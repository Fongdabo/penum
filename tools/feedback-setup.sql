-- PENUM feedback box (กล่องแจ้งปัญหาและแสดงความคิดเห็น) for PENUM PM, MEP and BIM, read in ORIEN ฝ่ายขาย.
-- Paste all of this into Supabase › SQL Editor › New query, then press Run. Safe to run again.
-- The last line shows the reader code: copy it into ORIEN ฝ่ายขาย › กล่องรับเรื่อง.
-- The apps send with the public key, which can only ADD a message (rpc penum_fb_send). Nobody can read the
-- messages with that key; reading and marking them goes through functions that check the reader code.
create extension if not exists pgcrypto;

create table if not exists public.penum_feedback(
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  app text not null default '',
  ver text not null default '',
  kind text not null default 'other',
  message text not null,
  contact text not null default '',
  company text not null default '',
  lic text not null default '',
  page text not null default '',
  device text not null default '',
  shot text not null default '',
  status text not null default 'new',
  note text not null default '',
  updated_at timestamptz);
-- no policies at all: the table cannot be read or written directly with the public key
alter table public.penum_feedback enable row level security;

-- one reader code, made here; only the functions below can see it
create table if not exists public.penum_fb_reader(
  one boolean primary key default true check(one),
  code text not null default encode(gen_random_bytes(18),'hex'));
alter table public.penum_fb_reader enable row level security;
insert into public.penum_fb_reader(one) values(true) on conflict do nothing;

create or replace function public.penum_fb_ok(p_code text) returns boolean language sql stable security definer set search_path=public as
$$ select exists(select 1 from penum_fb_reader where code=coalesce(p_code,'')) $$;

-- an app sends one message; returns its number
create or replace function public.penum_fb_send(p jsonb) returns bigint language plpgsql security definer set search_path=public as $$
declare i bigint; m text:=left(btrim(coalesce(p->>'message','')),5000); s text:=coalesce(p->>'shot','');
begin
  if m='' then raise exception 'empty message'; end if;
  -- a flood guard for the whole box, since anyone with the public key can send
  if (select count(*) from penum_feedback where created_at>now()-interval '10 minutes')>=60 then raise exception 'busy'; end if;
  if length(s)>700000 or s!~'^data:image/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$' then s:=''; end if;
  insert into penum_feedback(app,ver,kind,message,contact,company,lic,page,device,shot)
  values(left(coalesce(p->>'app',''),20),left(coalesce(p->>'ver',''),60),
    case when p->>'kind' in ('bug','idea','how','other') then p->>'kind' else 'other' end,
    m,left(coalesce(p->>'contact',''),300),left(coalesce(p->>'company',''),200),left(coalesce(p->>'lic',''),60),
    left(coalesce(p->>'page',''),200),left(coalesce(p->>'device',''),300),s)
  returning id into i;
  return i;
end $$;

-- ORIEN ฝ่ายขาย: the newest 1000 messages (without the pictures)
create or replace function public.penum_fb_list(p_code text) returns json language plpgsql stable security definer set search_path=public as $$
begin
  if not penum_fb_ok(p_code) then raise exception 'bad code'; end if;
  return (select coalesce(json_agg(json_build_object('id',id,'at',created_at,'app',app,'ver',ver,'kind',kind,'message',message,
    'contact',contact,'company',company,'lic',lic,'page',page,'device',device,'shot',shot<>'','status',status,'note',note) order by id desc),'[]'::json)
    from (select * from penum_feedback order by id desc limit 1000) f);
end $$;
create or replace function public.penum_fb_shot(p_code text, p_id bigint) returns text language plpgsql stable security definer set search_path=public as $$
begin
  if not penum_fb_ok(p_code) then raise exception 'bad code'; end if;
  return (select shot from penum_feedback where id=p_id);
end $$;
create or replace function public.penum_fb_set(p_code text, p_id bigint, p_status text, p_note text default null) returns void language plpgsql security definer set search_path=public as $$
begin
  if not penum_fb_ok(p_code) then raise exception 'bad code'; end if;
  if p_status not in ('new','seen','ticket','done') then raise exception 'bad status'; end if;
  update penum_feedback set status=p_status,note=coalesce(left(p_note,2000),note),updated_at=now() where id=p_id;
end $$;

revoke all on function public.penum_fb_ok(text) from public, anon, authenticated;
revoke all on function public.penum_fb_send(jsonb), public.penum_fb_list(text), public.penum_fb_shot(text,bigint), public.penum_fb_set(text,bigint,text,text) from public;
grant execute on function public.penum_fb_send(jsonb), public.penum_fb_list(text), public.penum_fb_shot(text,bigint), public.penum_fb_set(text,bigint,text,text) to anon, authenticated;

-- to make a new reader code (the old one stops working), run:  update public.penum_fb_reader set code=encode(gen_random_bytes(18),'hex');
select code as "รหัสอ่านกล่องรับเรื่อง (คัดลอกไปใส่ใน ORIEN ฝ่ายขาย)" from public.penum_fb_reader;

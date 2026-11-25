-- PENUM feedback box (กล่องแจ้งปัญหาและแสดงความคิดเห็น) for PENUM PM, MEP and BIM, read in ORIEN ฝ่ายขาย.
-- Paste all of this into Supabase › SQL Editor › New query, then press Run. Safe to run again.
-- The last line shows the reader code: copy it into ORIEN ฝ่ายขาย › กล่องรับเรื่อง.
-- The apps send with the public key, which can only ADD a message (rpc penum_fb_send). Nobody can read the
-- messages with that key; reading and marking them goes through functions that check the reader code.
-- แชตตอบกลับ: each message the apps send carries a random secret (tok) that stays on the customer's device; with it the
-- customer reads ORIEN's answers and writes back (penum_fb_mine / penum_fb_reply), and nothing else. The secret is kept here
-- only as its sha256. An automatic acknowledgement (the template in penum_fb_reader.auto, {n} = number) is the first reply.
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

-- แชตตอบกลับ: the conversation under each message; who = 'auto' (the acknowledgement), 'orien' or 'cust'
alter table public.penum_feedback add column if not exists tok text not null default '';
alter table public.penum_feedback add column if not exists cust_at timestamptz;
alter table public.penum_feedback add column if not exists orien_at timestamptz;
create table if not exists public.penum_fb_msg(
  id bigint generated always as identity primary key,
  fb bigint not null references public.penum_feedback(id) on delete cascade,
  at timestamptz not null default now(),
  who text not null,
  name text not null default '',
  body text not null);
create index if not exists penum_fb_msg_fb on public.penum_fb_msg(fb,id);
alter table public.penum_fb_msg enable row level security;
-- the automatic acknowledgement; ORIEN ฝ่ายขาย › กล่องรับเรื่อง can change it, an empty text turns it off
alter table public.penum_fb_reader add column if not exists auto text not null default
  'สวัสดีครับ ทีม ORIEN ได้รับเรื่อง #{n} ({kind}) แล้ว ขอบคุณที่แจ้งเข้ามา เราจะอ่านและตอบกลับในแชตนี้โดยเร็วที่สุด เมื่อมีคำตอบ โปรแกรมจะแจ้งเตือนให้ทราบ ถ้าต้องการเพิ่มรายละเอียด พิมพ์ต่อในแชตนี้ได้เลย';

create or replace function public.penum_fb_ok(p_code text) returns boolean language sql stable security definer set search_path=public as
$$ select exists(select 1 from penum_fb_reader where code=coalesce(p_code,'')) $$;

-- an app sends one message; returns its number. p.tok is the customer's secret for the reply chat (kept as its sha256).
create or replace function public.penum_fb_send(p jsonb) returns bigint language plpgsql security definer set search_path=public as $$
declare i bigint; m text:=left(btrim(coalesce(p->>'message','')),5000); s text:=coalesce(p->>'shot',''); t text:=coalesce(p->>'tok','');
  k text:=case when p->>'kind' in ('bug','idea','how','other') then p->>'kind' else 'other' end; a text;
begin
  if m='' then raise exception 'empty message'; end if;
  -- a flood guard for the whole box, since anyone with the public key can send
  if (select count(*) from penum_feedback where created_at>now()-interval '10 minutes')>=60 then raise exception 'busy'; end if;
  if length(s)>700000 or s!~'^data:image/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$' then s:=''; end if;
  insert into penum_feedback(app,ver,kind,message,contact,company,lic,page,device,shot,tok)
  values(left(coalesce(p->>'app',''),20),left(coalesce(p->>'ver',''),60),k,
    m,left(coalesce(p->>'contact',''),300),left(coalesce(p->>'company',''),200),left(coalesce(p->>'lic',''),60),
    left(coalesce(p->>'page',''),200),left(coalesce(p->>'device',''),300),s,
    case when t~'^[0-9a-f]{32,64}$' then encode(digest(t,'sha256'),'hex') else '' end)
  returning id into i;
  select btrim(auto) into a from penum_fb_reader;
  if coalesce(a,'')<>'' then
    insert into penum_fb_msg(fb,who,name,body) values(i,'auto','ทีม ORIEN',left(replace(replace(a,'{n}',i::text),'{kind}',
      case k when 'bug' then 'แจ้งปัญหา' when 'idea' then 'อยากได้เพิ่ม' when 'how' then 'ถามวิธีใช้' else 'ความคิดเห็น' end),3000));
  end if;
  return i;
end $$;

-- the customer's app: its own messages and their conversations. p = [{"id":12,"t":"<secret>"},…] (at most 50)
create or replace function public.penum_fb_mine(p jsonb) returns json language plpgsql stable security definer set search_path=public as $$
begin
  if jsonb_typeof(p)<>'array' then return '[]'::json; end if;
  return (select coalesce(json_agg(json_build_object('id',f.id,'at',f.created_at,'app',f.app,'kind',f.kind,'message',f.message,'status',f.status,
    'msgs',(select coalesce(json_agg(json_build_object('id',x.id,'at',x.at,'who',x.who,'name',x.name,'body',x.body) order by x.id),'[]'::json)
      from (select * from penum_fb_msg where fb=f.id order by id desc limit 200) x)) order by f.id desc),'[]'::json)
    from (select (e->>'id')::bigint id, coalesce(e->>'t','') t from jsonb_array_elements(p) with ordinality q(e,o)
          where o<=50 and e->>'id'~'^[0-9]{1,18}$') k
    join penum_feedback f on f.id=k.id and f.tok<>'' and f.tok=encode(digest(k.t,'sha256'),'hex'));
end $$;
-- the customer writes back; the message comes up as new again in กล่องรับเรื่อง (one opened as a ticket stays a ticket)
create or replace function public.penum_fb_reply(p_id bigint, p_t text, p_body text, p_name text default '') returns bigint language plpgsql security definer set search_path=public as $$
declare i bigint; b text:=left(btrim(coalesce(p_body,'')),3000);
begin
  if b='' then raise exception 'empty message'; end if;
  if not exists(select 1 from penum_feedback where id=p_id and tok<>'' and tok=encode(digest(coalesce(p_t,''),'sha256'),'hex')) then raise exception 'bad key'; end if;
  if (select count(*) from penum_fb_msg where fb=p_id and who='cust' and at>now()-interval '10 minutes')>=20
     or (select count(*) from penum_fb_msg where who='cust' and at>now()-interval '10 minutes')>=200 then raise exception 'busy'; end if;
  insert into penum_fb_msg(fb,who,name,body) values(p_id,'cust',left(coalesce(p_name,''),100),b) returning id into i;
  update penum_feedback set cust_at=now(),updated_at=now(),status=case when status in ('seen','done') then 'new' else status end where id=p_id;
  return i;
end $$;

-- ORIEN ฝ่ายขาย: the newest 1000 messages (without the pictures)
create or replace function public.penum_fb_list(p_code text) returns json language plpgsql stable security definer set search_path=public as $$
begin
  if not penum_fb_ok(p_code) then raise exception 'bad code'; end if;
  return (select coalesce(json_agg(json_build_object('id',id,'at',created_at,'app',app,'ver',ver,'kind',kind,'message',message,
    'contact',contact,'company',company,'lic',lic,'page',page,'device',device,'shot',shot<>'','status',status,'note',note,
    'chat',tok<>'','cust_at',cust_at,'orien_at',orien_at,'nmsg',(select count(*) from penum_fb_msg x where x.fb=f.id and x.who<>'auto')) order by id desc),'[]'::json)
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
-- ORIEN ฝ่ายขาย: the conversation under one message, an answer to the customer, and the automatic acknowledgement
create or replace function public.penum_fb_msgs(p_code text, p_id bigint) returns json language plpgsql stable security definer set search_path=public as $$
begin
  if not penum_fb_ok(p_code) then raise exception 'bad code'; end if;
  return (select coalesce(json_agg(json_build_object('id',id,'at',at,'who',who,'name',name,'body',body) order by id),'[]'::json) from penum_fb_msg where fb=p_id);
end $$;
create or replace function public.penum_fb_answer(p_code text, p_id bigint, p_body text, p_name text default '') returns bigint language plpgsql security definer set search_path=public as $$
declare i bigint; b text:=left(btrim(coalesce(p_body,'')),3000);
begin
  if not penum_fb_ok(p_code) then raise exception 'bad code'; end if;
  if b='' then raise exception 'empty message'; end if;
  if not exists(select 1 from penum_feedback where id=p_id) then raise exception 'no such message'; end if;
  insert into penum_fb_msg(fb,who,name,body) values(p_id,'orien',coalesce(nullif(left(btrim(coalesce(p_name,'')),100),''),'ทีม ORIEN'),b) returning id into i;
  update penum_feedback set orien_at=now(),updated_at=now(),status=case when status='new' then 'seen' else status end where id=p_id;
  return i;
end $$;
create or replace function public.penum_fb_auto(p_code text, p_text text default null) returns text language plpgsql security definer set search_path=public as $$
declare a text;
begin
  if not penum_fb_ok(p_code) then raise exception 'bad code'; end if;
  if p_text is not null then update penum_fb_reader set auto=left(btrim(p_text),2000); end if;
  select auto into a from penum_fb_reader;
  return a;
end $$;

revoke all on function public.penum_fb_ok(text) from public, anon, authenticated;
revoke all on function public.penum_fb_send(jsonb), public.penum_fb_list(text), public.penum_fb_shot(text,bigint), public.penum_fb_set(text,bigint,text,text),
  public.penum_fb_mine(jsonb), public.penum_fb_reply(bigint,text,text,text), public.penum_fb_msgs(text,bigint), public.penum_fb_answer(text,bigint,text,text),
  public.penum_fb_auto(text,text) from public;
grant execute on function public.penum_fb_send(jsonb), public.penum_fb_list(text), public.penum_fb_shot(text,bigint), public.penum_fb_set(text,bigint,text,text),
  public.penum_fb_mine(jsonb), public.penum_fb_reply(bigint,text,text,text), public.penum_fb_msgs(text,bigint), public.penum_fb_answer(text,bigint,text,text),
  public.penum_fb_auto(text,text) to anon, authenticated;

-- to make a new reader code (the old one stops working), run:  update public.penum_fb_reader set code=encode(gen_random_bytes(18),'hex');
select code as "รหัสอ่านกล่องรับเรื่อง (คัดลอกไปใส่ใน ORIEN ฝ่ายขาย)" from public.penum_fb_reader;

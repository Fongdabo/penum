-- PENUM รหัสเชื่อมโครงการ: PENUM MEP, PM and BIM pass a project's data to each other across computers through ORIEN's Supabase
-- (shared/link.js). Paste all of this into Supabase › SQL Editor › New query, then press Run. Safe to run again.
-- A row is one slot of one project ('mep' = PENUM MEP's results and BOQ). k is the first 16 bytes of sha256('penum-link:' + code)
-- in hex and iv/ct are AES-GCM with the key sha256('penum-link-key:' + code): the code lives only in the customers' projects, so
-- only they can find or read a row; ORIEN sees sizes and times, never the content. Customers write rows with the public key.
create table if not exists public.penum_link(
  k text not null,
  s text not null,
  iv text not null,
  ct text not null,
  at timestamptz not null default now(),
  primary key(k,s));
-- no policies at all: only the functions below read or write it
alter table public.penum_link enable row level security;

create or replace function public.penum_link_put(p_k text, p_s text, p_iv text, p_ct text) returns timestamptz
language plpgsql security definer set search_path=public as $$
declare t timestamptz:=now();
begin
  if coalesce(p_k,'')!~'^[0-9a-f]{32}$' or coalesce(p_s,'') not in ('mep','bim','hand')
    or coalesce(p_iv,'')!~'^[A-Za-z0-9_-]{16}$' or coalesce(p_ct,'')!~'^[A-Za-z0-9_-]+$' or length(p_ct) not between 24 and 3000000 then
    raise exception 'bad entry'; end if;
  -- the free database is shared with the feedback box and the licence renewals: new projects stop at 200 MB, the ones already here go on
  if pg_total_relation_size('public.penum_link')>200000000 and not exists(select 1 from penum_link where k=p_k and s=p_s) then
    raise exception 'full'; end if;
  insert into penum_link(k,s,iv,ct,at) values(p_k,p_s,p_iv,p_ct,t)
    on conflict(k,s) do update set iv=excluded.iv,ct=excluded.ct,at=excluded.at;
  return t;
end $$;

-- one slot of one project: {"iv":"…","ct":"…","at":"…"}, or null when there is none yet
create or replace function public.penum_link_get(p_k text, p_s text) returns json language sql stable security definer set search_path=public as $$
  select json_build_object('iv',iv,'ct',ct,'at',at) from penum_link where k=p_k and s=p_s $$;

-- when each slot of these projects last changed: {"<k>":{"mep":"…"}}, so the apps fetch a project again only when it is newer
create or replace function public.penum_link_at(p_k text[]) returns json language sql stable security definer set search_path=public as $$
  select coalesce(json_object_agg(k,o),'{}'::json) from (select k,json_object_agg(s,at) o from penum_link where k=any(p_k[1:30]) group by k) x $$;

revoke all on function public.penum_link_put(text,text,text,text), public.penum_link_get(text,text), public.penum_link_at(text[]) from public;
grant execute on function public.penum_link_put(text,text,text,text), public.penum_link_get(text,text), public.penum_link_at(text[]) to anon, authenticated;

select 'ตั้งค่าเชื่อมข้อมูลข้ามเครื่องเรียบร้อย' as "ผลลัพธ์", count(*) as "ข้อมูลที่เก็บอยู่ (แถว)" from public.penum_link;

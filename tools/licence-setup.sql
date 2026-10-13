-- PENUM licence renewals sent from ORIEN ฝ่ายขาย (ส่งให้ลูกค้าอัตโนมัติ), so a customer's PENUM PM, MEP and BIM pick up
-- the new code by themselves when they are opened online. No change to the site is needed for each renewal.
-- Paste all of this into Supabase › SQL Editor › New query, then press Run. Safe to run again.
-- It uses the same ORIEN code as the feedback box (กล่องรับเรื่อง, tools/feedback-setup.sql); the last line shows it.
-- A row is one new code encrypted for the company that holds an older code, as in pm/files/licences.json: k is the first
-- 12 bytes of sha256('i' + older code) in hex, iv/ct are AES-GCM with the key sha256('k' + older code). Anyone may ask for
-- a row by its k, but only a holder of the older code can work out k or open the row, and the apps still check the new
-- code's signature, so a row that ORIEN did not sign opens nothing.
create extension if not exists pgcrypto;

create table if not exists public.penum_fb_reader(
  one boolean primary key default true check(one),
  code text not null default encode(gen_random_bytes(18),'hex'));
alter table public.penum_fb_reader enable row level security;
insert into public.penum_fb_reader(one) values(true) on conflict do nothing;
create or replace function public.penum_fb_ok(p_code text) returns boolean language sql stable security definer set search_path=public as
$$ select exists(select 1 from penum_fb_reader where code=coalesce(p_code,'')) $$;

create table if not exists public.penum_lic_renew(
  k text primary key,
  iv text not null,
  ct text not null,
  updated_at timestamptz not null default now());
-- no policies at all: only the functions below read or write it
alter table public.penum_lic_renew enable row level security;

-- ORIEN ฝ่ายขาย sends one approval, {"<k>":{"iv":"…","ct":"…"},…}; a later approval for the same older code replaces the earlier one
create or replace function public.penum_lic_put(p_code text, p_e jsonb) returns int language plpgsql security definer set search_path=public as $$
declare r record; n int:=0;
begin
  if not penum_fb_ok(p_code) then raise exception 'bad code'; end if;
  if jsonb_typeof(p_e) is distinct from 'object' then raise exception 'bad entry'; end if;
  for r in select key,value from jsonb_each(p_e) loop
    if r.key!~'^[0-9a-f]{24}$' or jsonb_typeof(r.value) is distinct from 'object'
      or coalesce(r.value->>'iv','')!~'^[A-Za-z0-9_-]{16}$' or coalesce(r.value->>'ct','')!~'^[A-Za-z0-9_-]+$'
      or length(r.value->>'ct') not between 40 and 8000 then
      raise exception 'bad entry'; end if;
    insert into penum_lic_renew(k,iv,ct) values(r.key,r.value->>'iv',r.value->>'ct')
      on conflict(k) do update set iv=excluded.iv,ct=excluded.ct,updated_at=now();
    n:=n+1;
  end loop;
  return n;
end $$;

-- the apps: the rows for the codes a device holds, as {"<k>":{"iv":"…","ct":"…"}}
create or replace function public.penum_lic_get(p_k text[]) returns json language sql stable security definer set search_path=public as $$
  select coalesce(json_object_agg(k,json_build_object('iv',iv,'ct',ct)),'{}'::json) from penum_lic_renew where k=any(p_k[1:30]) $$;

revoke all on function public.penum_fb_ok(text) from public, anon, authenticated;
revoke all on function public.penum_lic_put(text,jsonb), public.penum_lic_get(text[]) from public;
grant execute on function public.penum_lic_put(text,jsonb), public.penum_lic_get(text[]) to anon, authenticated;

-- the same code as the feedback box; to make a new one (the old one stops working), run:
--   update public.penum_fb_reader set code=encode(gen_random_bytes(18),'hex');
select code as "รหัส ORIEN (ใส่ใน ORIEN ฝ่ายขาย)" from public.penum_fb_reader;

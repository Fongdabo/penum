-- PENUM PM cloud (Supabase) setup. Paste all of this into SQL Editor > New query, then press Run. Safe to run again.
-- Each company's data lives in the private storage bucket "pm" under <company id>/ (penum-pm.json, photos/, backup/).
-- Only devices that joined the company (with the admin's link or a staff invite link) can read or write it.
create extension if not exists pgcrypto;

create table if not exists public.pm_companies(
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  lic text not null default '',
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid());
create table if not exists public.pm_members(
  company_id uuid not null references public.pm_companies(id) on delete cascade,
  user_id uuid not null,
  role text not null default 'staff' check (role in ('admin','staff')),
  label text not null default '',
  joined_at timestamptz not null default now(),
  primary key(company_id,user_id));
-- invite codes: no policy at all, so only the functions below can read them
create table if not exists public.pm_codes(
  company_id uuid primary key references public.pm_companies(id) on delete cascade,
  staff_code text not null default encode(gen_random_bytes(18),'hex'),
  admin_code text not null default encode(gen_random_bytes(18),'hex'));
alter table public.pm_companies enable row level security;
alter table public.pm_members enable row level security;
alter table public.pm_codes enable row level security;

create or replace function public.pm_is_member(c uuid) returns boolean language sql stable security definer set search_path=public as
$$ select exists(select 1 from pm_members where company_id=c and user_id=auth.uid()) $$;
create or replace function public.pm_is_admin(c uuid) returns boolean language sql stable security definer set search_path=public as
$$ select exists(select 1 from pm_members where company_id=c and user_id=auth.uid() and role='admin') $$;
create or replace function public.pm_path_ok(p text) returns boolean language sql stable security definer set search_path=public as
$$ select exists(select 1 from pm_members where company_id::text=split_part(p,'/',1) and user_id=auth.uid()) $$;

drop policy if exists pm_co_read on public.pm_companies;
create policy pm_co_read on public.pm_companies for select using (public.pm_is_member(id));
drop policy if exists pm_co_upd on public.pm_companies;
create policy pm_co_upd on public.pm_companies for update using (public.pm_is_admin(id));
drop policy if exists pm_mem_read on public.pm_members;
create policy pm_mem_read on public.pm_members for select using (public.pm_is_member(company_id));
drop policy if exists pm_mem_del on public.pm_members;
create policy pm_mem_del on public.pm_members for delete using (public.pm_is_admin(company_id));

-- a new company; the device that creates it is its admin (at most 5 companies per device)
create or replace function public.pm_create_company(p_name text, p_lic text default '') returns json language plpgsql security definer set search_path=public as $$
declare c uuid; k pm_codes;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if (select count(*) from pm_companies where created_by=auth.uid())>=5 then raise exception 'too many companies'; end if;
  insert into pm_companies(name,lic) values(coalesce(p_name,''),coalesce(p_lic,'')) returning id into c;
  insert into pm_members(company_id,user_id,role,label) values(c,auth.uid(),'admin','ผู้ดูแลระบบ');
  insert into pm_codes(company_id) values(c) returning * into k;
  return json_build_object('id',c,'staff',k.staff_code,'admin',k.admin_code);
end $$;
-- join with a link: the staff code gives staff access, the admin code admin access
create or replace function public.pm_join(p_company uuid, p_code text, p_label text default '') returns json language plpgsql security definer set search_path=public as $$
declare k pm_codes; r text; n text;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  select * into k from pm_codes where company_id=p_company;
  if k is null then raise exception 'no such company'; end if;
  if p_code=k.admin_code then r:='admin'; elsif p_code=k.staff_code then r:='staff'; else raise exception 'bad code'; end if;
  insert into pm_members(company_id,user_id,role,label) values(p_company,auth.uid(),r,coalesce(p_label,''))
    on conflict(company_id,user_id) do update set role=case when pm_members.role='admin' then 'admin' else excluded.role end, label=excluded.label;
  select name into n from pm_companies where id=p_company;
  return json_build_object('id',p_company,'role',r,'name',n);
end $$;
-- the admin reads the codes for invite links, or makes new ones (old links stop working)
create or replace function public.pm_get_codes(p_company uuid, p_new boolean default false) returns json language plpgsql security definer set search_path=public as $$
declare k pm_codes;
begin
  if not pm_is_admin(p_company) then raise exception 'admins only'; end if;
  if p_new then update pm_codes set staff_code=encode(gen_random_bytes(18),'hex') where company_id=p_company; end if;
  select * into k from pm_codes where company_id=p_company;
  return json_build_object('staff',k.staff_code,'admin',k.admin_code);
end $$;
revoke all on function public.pm_create_company(text,text) from public, anon;
revoke all on function public.pm_join(uuid,text,text) from public, anon;
revoke all on function public.pm_get_codes(uuid,boolean) from public, anon;
grant execute on function public.pm_create_company(text,text), public.pm_join(uuid,text,text), public.pm_get_codes(uuid,boolean) to authenticated;

-- storage: private bucket, 50 MB per file
insert into storage.buckets(id,name,public,file_size_limit) values('pm','pm',false,52428800) on conflict(id) do nothing;
drop policy if exists pm_obj_read on storage.objects;
create policy pm_obj_read on storage.objects for select to authenticated using (bucket_id='pm' and public.pm_path_ok(name));
drop policy if exists pm_obj_ins on storage.objects;
create policy pm_obj_ins on storage.objects for insert to authenticated with check (bucket_id='pm' and public.pm_path_ok(name));
drop policy if exists pm_obj_upd on storage.objects;
create policy pm_obj_upd on storage.objects for update to authenticated using (bucket_id='pm' and public.pm_path_ok(name));
drop policy if exists pm_obj_del on storage.objects;
create policy pm_obj_del on storage.objects for delete to authenticated using (bucket_id='pm' and public.pm_path_ok(name));

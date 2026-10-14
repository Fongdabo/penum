-- PENUM โครงการของบริษัท (company projects): every PENUM MEP and PENUM BIM project of one customer company in one list that all its
-- staff see, with who edited it last and who has it open now, so two people do not overwrite each other (shared/team.js).
-- Paste all of this into Supabase › SQL Editor › New query, then press Run. Safe to run again.
-- The company is the licence code: a device that holds the company's code finds penum_team_key by the first 16 bytes of
-- sha256('penum-team-c:' + code) and opens it with sha256('penum-team-ck:' + code); inside is the company's own random key.
-- Rows of penum_team are found by sha256('penum-team:' + that key) and encrypted (AES-GCM) with it, so ORIEN sees sizes and
-- times only, never names or content. A renewed code gets the same company key from a device that knew the older one.
create table if not exists public.penum_team_key(
  k text primary key,
  e text not null,
  at timestamptz not null default now());
create table if not exists public.penum_team(
  t text not null,                     -- the company
  p text not null,                     -- the project
  a text not null,                     -- 'mep' or 'bim'
  m text not null,                     -- what the list shows (name, client, figures, who saved it), encrypted
  d text not null,                     -- the project itself, encrypted
  at timestamptz not null default now(),   -- when d last changed
  mat timestamptz not null default now(),  -- when m last changed
  off boolean not null default false,  -- taken off the company's list
  ld text not null default '',         -- the device that has it open now (random id)
  lw text not null default '',         -- who that is, encrypted
  lat timestamptz,                     -- when that device last said so
  primary key(t,p));
-- no policies at all: only the functions below read or write them
alter table public.penum_team_key enable row level security;
alter table public.penum_team enable row level security;

-- the company key for a licence code: "iv.ct", or null when no device of the company has used the list yet
create or replace function public.penum_team_key_get(p_k text) returns text language sql stable security definer set search_path=public as $$
  select e from penum_team_key where k=p_k $$;
-- the first device of a company stores its key; the key that is there afterwards is returned (another device may have been first)
create or replace function public.penum_team_key_add(p_k text, p_e text) returns text language plpgsql security definer set search_path=public as $$
declare r text;
begin
  if coalesce(p_k,'')!~'^[0-9a-f]{32}$' or coalesce(p_e,'')!~'^[A-Za-z0-9_-]{16}\.[A-Za-z0-9_-]+$' or length(p_e)>400 then raise exception 'bad entry'; end if;
  insert into penum_team_key(k,e) values(p_k,p_e) on conflict(k) do nothing;
  select e into r from penum_team_key where k=p_k;
  return r;
end $$;

-- a company's projects of one program, newest first; the device holding one counts only while it said so in the last 150 seconds
create or replace function public.penum_team_list(p_t text, p_a text) returns json language sql stable security definer set search_path=public as $$
  select coalesce(json_agg(json_build_object('p',p,'m',m,'at',at,'mat',mat,'off',off,'size',length(d),
    'ld',case when lat>now()-interval '150 seconds' then ld else '' end,'lw',case when lat>now()-interval '150 seconds' then lw else '' end,'lat',lat) order by mat desc),'[]'::json)
  from (select * from penum_team where t=p_t and a=p_a order by mat desc limit 500) x $$;

-- one project: {"d":"…","at":"…"}
create or replace function public.penum_team_get(p_t text, p_p text) returns json language sql stable security definer set search_path=public as $$
  select json_build_object('d',d,'at',at,'m',m) from penum_team where t=p_t and p=p_p $$;

-- save a project. p_d null = only what the list shows. p_base = the version this device started from (null for a new project):
-- {"at":…} saved · {"stale":…} someone saved after p_base · {"lock":…} another device has it open · {"off":true} taken off the list
create or replace function public.penum_team_put(p_t text, p_p text, p_a text, p_m text, p_d text, p_base timestamptz, p_dev text) returns json
language plpgsql security definer set search_path=public as $$
declare r penum_team; n timestamptz:=now();
begin
  if coalesce(p_t,'')!~'^[0-9a-f]{32}$' or coalesce(p_p,'')!~'^[0-9a-f]{32}$' or coalesce(p_a,'') not in ('mep','bim')
    or coalesce(p_dev,'')!~'^[0-9a-f]{24}$' or coalesce(p_m,'')!~'^[A-Za-z0-9_-]{16}\.[A-Za-z0-9_-]+$' or length(p_m)>20000
    or (p_d is not null and (p_d!~'^[A-Za-z0-9_-]{16}\.[A-Za-z0-9_-]+$' or length(p_d)>3000000)) then
    raise exception 'bad entry'; end if;
  select * into r from penum_team where t=p_t and p=p_p for update;
  if not found then
    if p_d is null then return json_build_object('none',true); end if;
    -- the free database is shared with the other PENUM tables: new projects stop at 300 MB, the ones already here go on
    if pg_total_relation_size('public.penum_team')>300000000 then raise exception 'full'; end if;
    insert into penum_team(t,p,a,m,d,at,mat,ld,lat) values(p_t,p_p,p_a,p_m,p_d,n,n,p_dev,n);
    return json_build_object('at',n);
  end if;
  if p_d is null then update penum_team set m=p_m,mat=n where t=p_t and p=p_p; return json_build_object('at',r.at); end if;
  if r.off then return json_build_object('off',true); end if;
  if r.ld<>'' and r.ld<>p_dev and r.lat>n-interval '150 seconds' then return json_build_object('lock',true,'ld',r.ld,'lw',r.lw,'lat',r.lat); end if;
  if p_base is null or r.at<>p_base then return json_build_object('stale',r.at); end if;
  update penum_team set m=p_m,d=p_d,at=n,mat=n,ld=p_dev,lat=n where t=p_t and p=p_p;
  return json_build_object('at',n);
end $$;

-- "I have this project open": {"ok":true,"at":…} the device holds it now · {"ok":false,"ld","lw","lat","at"} another device does
-- · {"none":true} not on the list yet · {"off":true} taken off the list. p_force takes it over from the other device.
create or replace function public.penum_team_lock(p_t text, p_p text, p_dev text, p_lw text, p_force boolean) returns json
language plpgsql security definer set search_path=public as $$
declare r penum_team; n timestamptz:=now();
begin
  if coalesce(p_dev,'')!~'^[0-9a-f]{24}$' or coalesce(p_lw,'')!~'^[A-Za-z0-9_-]{16}\.[A-Za-z0-9_-]+$' or length(p_lw)>2000 then raise exception 'bad entry'; end if;
  select * into r from penum_team where t=p_t and p=p_p for update;
  if not found then return json_build_object('none',true); end if;
  if r.off then return json_build_object('off',true,'at',r.at); end if;
  if r.ld<>'' and r.ld<>p_dev and r.lat>n-interval '150 seconds' and not coalesce(p_force,false) then
    return json_build_object('ok',false,'ld',r.ld,'lw',r.lw,'lat',r.lat,'at',r.at); end if;
  update penum_team set ld=p_dev,lw=p_lw,lat=n where t=p_t and p=p_p;
  return json_build_object('ok',true,'at',r.at);
end $$;

-- the device closed the project (or went idle)
create or replace function public.penum_team_unlock(p_t text, p_p text, p_dev text) returns void language sql security definer set search_path=public as $$
  update penum_team set ld='',lw='',lat=null where t=p_t and p=p_p and ld=p_dev $$;

-- take a project off the company's list, or put it back; nothing is deleted
create or replace function public.penum_team_off(p_t text, p_p text, p_off boolean) returns void language sql security definer set search_path=public as $$
  update penum_team set off=coalesce(p_off,false),mat=now() where t=p_t and p=p_p $$;

revoke all on function public.penum_team_key_get(text), public.penum_team_key_add(text,text), public.penum_team_list(text,text), public.penum_team_get(text,text),
  public.penum_team_put(text,text,text,text,text,timestamptz,text), public.penum_team_lock(text,text,text,text,boolean), public.penum_team_unlock(text,text,text),
  public.penum_team_off(text,text,boolean) from public;
grant execute on function public.penum_team_key_get(text), public.penum_team_key_add(text,text), public.penum_team_list(text,text), public.penum_team_get(text,text),
  public.penum_team_put(text,text,text,text,text,timestamptz,text), public.penum_team_lock(text,text,text,text,boolean), public.penum_team_unlock(text,text,text),
  public.penum_team_off(text,text,boolean) to anon, authenticated;

select 'ตั้งค่าโครงการของบริษัทเรียบร้อย' as "ผลลัพธ์", count(*) as "โครงการที่เก็บอยู่" from public.penum_team;

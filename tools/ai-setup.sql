-- PENUM PM ผู้ช่วย AI (PM 3.71): limits for the Claude assistant that runs through the Edge Function "penum-ai".
-- Paste all of this into Supabase › SQL Editor › New query, then press Run. Safe to run again.
-- The Anthropic API key is NOT here: it is stored as the Edge Function secret ANTHROPIC_API_KEY.
-- Each signed-in device (anonymous sign-in, same as the PENUM cloud) gets a number of AI requests per day,
-- and the whole project gets a number per month. Change the numbers in the last section and run it again.

create table if not exists public.penum_ai_cfg(
  one boolean primary key default true check(one),
  on_ boolean not null default true,         -- false = the assistant is switched off for everyone
  per_day int not null default 150,          -- requests per device per day (one question may use several)
  per_month int not null default 20000);     -- requests for the whole project per month
alter table public.penum_ai_cfg enable row level security;
insert into public.penum_ai_cfg(one) values(true) on conflict do nothing;

create table if not exists public.penum_ai_use(
  day date not null default current_date,
  user_id uuid not null,
  n int not null default 0,
  tin bigint not null default 0,
  tout bigint not null default 0,
  primary key(day,user_id));
-- no policies: the tables cannot be read or written directly with the public key
alter table public.penum_ai_use enable row level security;

-- the Edge Function calls this with the person's own sign-in before each request to Claude
create or replace function public.penum_ai_take() returns json language plpgsql security definer set search_path=public as $$
declare c penum_ai_cfg; k int; m bigint;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  select * into c from penum_ai_cfg where one;
  if not coalesce(c.on_,false) then return json_build_object('ok',false,'why','off'); end if;
  select coalesce(sum(n),0) into m from penum_ai_use where day>=date_trunc('month',current_date)::date;
  if m>=c.per_month then return json_build_object('ok',false,'why','month'); end if;
  insert into penum_ai_use(day,user_id,n) values(current_date,auth.uid(),1)
    on conflict(day,user_id) do update set n=penum_ai_use.n+1 returning n into k;
  if k>c.per_day then return json_build_object('ok',false,'why','day','n',k,'max',c.per_day); end if;
  return json_build_object('ok',true,'n',k,'max',c.per_day);
end $$;

-- the Edge Function adds the tokens of each answer (for the monthly summary below)
create or replace function public.penum_ai_used(p_in bigint, p_out bigint) returns void language sql security definer set search_path=public as $$
  update penum_ai_use set tin=tin+greatest(0,coalesce(p_in,0)), tout=tout+greatest(0,coalesce(p_out,0))
  where day=current_date and user_id=auth.uid() $$;

revoke all on function public.penum_ai_take() from public;
revoke all on function public.penum_ai_used(bigint,bigint) from public;
grant execute on function public.penum_ai_take() to authenticated;
grant execute on function public.penum_ai_used(bigint,bigint) to authenticated;

-- ---- settings (edit and run again) ----
update public.penum_ai_cfg set on_=true, per_day=150, per_month=20000 where one;

-- ---- this month's use (run on its own to look) ----
-- select day, count(*) devices, sum(n) requests, sum(tin) tokens_in, sum(tout) tokens_out
--   from public.penum_ai_use where day>=date_trunc('month',current_date) group by day order by day;
select 'ผู้ช่วย AI พร้อมแล้ว' as status, per_day, per_month from public.penum_ai_cfg;

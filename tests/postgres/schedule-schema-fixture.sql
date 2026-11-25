-- Disposable PostgreSQL integration-test fixture, never used on Supabase production.
create role authenticated nologin;
create role anon nologin;
create role service_role nologin;

create schema auth;
create table auth.users(id uuid primary key);
insert into auth.users(id) values
  ('11111111-1111-4111-8111-111111111111'),
  ('22222222-2222-4222-8222-222222222222'),
  ('33333333-3333-4333-8333-333333333333');

create function auth.uid()
returns uuid language sql stable
as $$
  select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
$$;
grant usage on schema auth to authenticated, anon;
grant execute on function auth.uid() to authenticated, anon;
grant usage on schema public to authenticated, anon, service_role;

create table public.mawaeidi_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  lessons jsonb not null default '[]'::jsonb
    check (jsonb_typeof(lessons)='array' and octet_length(lessons::text)<=5242880),
  updated_at timestamptz not null default now(),
  finance jsonb not null default '{"cycles":[],"version":1,"payments":[],"agreements":[],"monthCounts":[]}'::jsonb check(jsonb_typeof(finance)='object')
);
alter table public.mawaeidi_data enable row level security;
revoke all on public.mawaeidi_data from public,anon,authenticated;
grant select,insert,update on public.mawaeidi_data to authenticated;
grant all on public.mawaeidi_data to service_role;

create policy "owner_reads_schedule" on public.mawaeidi_data
  for select to authenticated using ((select auth.uid())=user_id);
create policy "owner_inserts_schedule" on public.mawaeidi_data
  for insert to authenticated with check ((select auth.uid())=user_id);
create policy "owner_updates_schedule" on public.mawaeidi_data
  for update to authenticated using ((select auth.uid())=user_id)
  with check ((select auth.uid())=user_id);

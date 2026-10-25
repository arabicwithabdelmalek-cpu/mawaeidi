begin;

create schema if not exists private;
revoke all on schema private from public;

create table if not exists public.mawaeidi_data (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  lessons jsonb not null default '[]'::jsonb
    check (jsonb_typeof(lessons) = 'array' and octet_length(lessons::text) <= 5242880),
  finance jsonb not null default '{"version":1,"agreements":[],"cycles":[],"payments":[],"monthCounts":[]}'::jsonb
    check (
      jsonb_typeof(finance) = 'object'
      and jsonb_typeof(coalesce(finance -> 'agreements', '[]'::jsonb)) = 'array'
      and jsonb_typeof(coalesce(finance -> 'cycles', '[]'::jsonb)) = 'array'
      and jsonb_typeof(coalesce(finance -> 'payments', '[]'::jsonb)) = 'array'
      and jsonb_typeof(coalesce(finance -> 'monthCounts', '[]'::jsonb)) = 'array'
      and octet_length(finance::text) <= 5242880
    ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.mawaeidi_data enable row level security;
revoke all on table public.mawaeidi_data from anon, authenticated;
grant select, insert, update, delete on table public.mawaeidi_data to authenticated;
grant all on table public.mawaeidi_data to service_role;

drop policy if exists "mawaeidi_data_read_own" on public.mawaeidi_data;
create policy "mawaeidi_data_read_own"
  on public.mawaeidi_data for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "mawaeidi_data_add_own" on public.mawaeidi_data;
create policy "mawaeidi_data_add_own"
  on public.mawaeidi_data for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "mawaeidi_data_edit_own" on public.mawaeidi_data;
create policy "mawaeidi_data_edit_own"
  on public.mawaeidi_data for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "mawaeidi_data_remove_own" on public.mawaeidi_data;
create policy "mawaeidi_data_remove_own"
  on public.mawaeidi_data for delete to authenticated
  using ((select auth.uid()) = user_id);

create or replace function private.set_mawaeidi_data_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function private.set_mawaeidi_data_updated_at() from public, anon, authenticated;

drop trigger if exists mawaeidi_data_set_updated_at on public.mawaeidi_data;
create trigger mawaeidi_data_set_updated_at
before update on public.mawaeidi_data
for each row execute function private.set_mawaeidi_data_updated_at();

create table if not exists public.mawaeidi_history (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  before_lessons jsonb not null check (jsonb_typeof(before_lessons) = 'array' and octet_length(before_lessons::text) <= 5242880),
  after_lessons jsonb not null check (jsonb_typeof(after_lessons) = 'array' and octet_length(after_lessons::text) <= 5242880),
  before_finance jsonb not null default '{"version":1,"agreements":[],"cycles":[],"payments":[],"monthCounts":[]}'::jsonb
    check (jsonb_typeof(before_finance) = 'object' and octet_length(before_finance::text) <= 5242880),
  after_finance jsonb not null default '{"version":1,"agreements":[],"cycles":[],"payments":[],"monthCounts":[]}'::jsonb
    check (jsonb_typeof(after_finance) = 'object' and octet_length(after_finance::text) <= 5242880),
  created_at timestamptz not null default now()
);

create index if not exists mawaeidi_history_user_created_idx
  on public.mawaeidi_history (user_id, created_at desc);

alter table public.mawaeidi_history enable row level security;
revoke all on table public.mawaeidi_history from anon, authenticated;
grant select on table public.mawaeidi_history to authenticated;
grant all on table public.mawaeidi_history to service_role;
grant usage, select on sequence public.mawaeidi_history_id_seq to service_role;

drop policy if exists "Users read their own schedule history" on public.mawaeidi_history;
create policy "Users read their own schedule history"
  on public.mawaeidi_history for select to authenticated
  using ((select auth.uid()) = user_id);

create or replace function private.log_mawaeidi_lessons_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  empty_finance constant jsonb := '{"version":1,"agreements":[],"cycles":[],"payments":[],"monthCounts":[]}'::jsonb;
begin
  insert into public.mawaeidi_history (
    user_id, before_lessons, after_lessons, before_finance, after_finance
  ) values (
    new.user_id,
    case when tg_op = 'INSERT' then '[]'::jsonb else coalesce(old.lessons, '[]'::jsonb) end,
    coalesce(new.lessons, '[]'::jsonb),
    case when tg_op = 'INSERT' then empty_finance else coalesce(old.finance, empty_finance) end,
    coalesce(new.finance, empty_finance)
  );

  return new;
end;
$$;

revoke all on function private.log_mawaeidi_lessons_change() from public, anon, authenticated;

drop trigger if exists mawaeidi_lessons_history on public.mawaeidi_data;
create trigger mawaeidi_lessons_history
after update of lessons, finance on public.mawaeidi_data
for each row
when (old.lessons is distinct from new.lessons or old.finance is distinct from new.finance)
execute function private.log_mawaeidi_lessons_change();

drop trigger if exists mawaeidi_lessons_initial_history on public.mawaeidi_data;
create trigger mawaeidi_lessons_initial_history
after insert on public.mawaeidi_data
for each row
when (
  jsonb_array_length(new.lessons) > 0
  or jsonb_array_length(coalesce(new.finance -> 'agreements', '[]'::jsonb)) > 0
  or jsonb_array_length(coalesce(new.finance -> 'payments', '[]'::jsonb)) > 0
)
execute function private.log_mawaeidi_lessons_change();

create table if not exists public.mawaeidi_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique check (length(endpoint) between 1 and 2048),
  p256dh text not null check (length(p256dh) between 1 and 512),
  auth_key text not null check (length(auth_key) between 1 and 512),
  timezone text not null default 'UTC' check (length(timezone) between 1 and 100),
  lead_minutes smallint not null default 15 check (lead_minutes in (5, 10, 15, 30, 60)),
  lead_minutes_list smallint[] not null default array[60, 15]::smallint[]
    check (
      cardinality(lead_minutes_list) between 1 and 3
      and lead_minutes_list <@ array[5, 10, 15, 30, 60]::smallint[]
    ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists mawaeidi_push_subscriptions_user_idx
  on public.mawaeidi_push_subscriptions (user_id);

alter table public.mawaeidi_push_subscriptions enable row level security;
revoke all on table public.mawaeidi_push_subscriptions from anon, authenticated;
grant select (id, user_id, endpoint, timezone, lead_minutes, lead_minutes_list, created_at, updated_at)
  on public.mawaeidi_push_subscriptions to authenticated;
grant insert (user_id, endpoint, p256dh, auth_key, timezone, lead_minutes, lead_minutes_list, updated_at)
  on public.mawaeidi_push_subscriptions to authenticated;
grant update (p256dh, auth_key, timezone, lead_minutes, lead_minutes_list, updated_at)
  on public.mawaeidi_push_subscriptions to authenticated;
grant delete on table public.mawaeidi_push_subscriptions to authenticated;
grant all on table public.mawaeidi_push_subscriptions to service_role;

drop policy if exists "Users read their own push devices" on public.mawaeidi_push_subscriptions;
create policy "Users read their own push devices" on public.mawaeidi_push_subscriptions
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Users add their own push devices" on public.mawaeidi_push_subscriptions;
create policy "Users add their own push devices" on public.mawaeidi_push_subscriptions
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Users update their own push devices" on public.mawaeidi_push_subscriptions;
create policy "Users update their own push devices" on public.mawaeidi_push_subscriptions
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Users remove their own push devices" on public.mawaeidi_push_subscriptions;
create policy "Users remove their own push devices" on public.mawaeidi_push_subscriptions
  for delete to authenticated using ((select auth.uid()) = user_id);

create table if not exists public.mawaeidi_notification_log (
  id bigint generated always as identity primary key,
  subscription_id uuid not null references public.mawaeidi_push_subscriptions (id) on delete cascade,
  lesson_id text not null,
  occurrence_at timestamptz not null,
  lead_minutes smallint not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  attempt_count smallint not null default 1 check (attempt_count between 1 and 1000),
  claimed_at timestamptz not null default now(),
  sent_at timestamptz,
  last_error text check (last_error is null or length(last_error) <= 1000),
  check (status <> 'sent' or sent_at is not null),
  unique (subscription_id, lesson_id, occurrence_at, lead_minutes)
);

create index if not exists mawaeidi_notification_log_claimed_idx
  on public.mawaeidi_notification_log (status, claimed_at);

alter table public.mawaeidi_notification_log enable row level security;
revoke all on table public.mawaeidi_notification_log from anon, authenticated;
grant all on table public.mawaeidi_notification_log to service_role;
grant usage, select on sequence public.mawaeidi_notification_log_id_seq to service_role;

drop policy if exists "deny notification log access from browsers" on public.mawaeidi_notification_log;
create policy "deny notification log access from browsers"
  on public.mawaeidi_notification_log
  for all to anon, authenticated
  using (false) with check (false);

notify pgrst, 'reload schema';

commit;

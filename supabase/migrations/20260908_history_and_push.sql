begin;

create schema if not exists private;
revoke all on schema private from public;

create table public.mawaeidi_history (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  before_lessons jsonb not null check (
    jsonb_typeof(before_lessons) = 'array'
    and octet_length(before_lessons::text) <= 5242880
  ),
  after_lessons jsonb not null check (
    jsonb_typeof(after_lessons) = 'array'
    and octet_length(after_lessons::text) <= 5242880
  ),
  created_at timestamptz not null default now()
);

create index mawaeidi_history_user_created_idx
  on public.mawaeidi_history (user_id, created_at desc);

alter table public.mawaeidi_history enable row level security;
revoke all on table public.mawaeidi_history from anon, authenticated;
grant select on table public.mawaeidi_history to authenticated;
grant all on table public.mawaeidi_history to service_role;
grant usage, select on sequence public.mawaeidi_history_id_seq to service_role;

create policy "Users read their own schedule history"
  on public.mawaeidi_history
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create or replace function private.log_mawaeidi_lessons_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  previous_lessons jsonb;
begin
  if tg_op = 'INSERT' then
    previous_lessons := '[]'::jsonb;
  else
    previous_lessons := coalesce(old.lessons, '[]'::jsonb);
  end if;

  insert into public.mawaeidi_history (user_id, before_lessons, after_lessons)
  values (
    new.user_id,
    previous_lessons,
    coalesce(new.lessons, '[]'::jsonb)
  );

  delete from public.mawaeidi_history
  where id in (
    select id
    from public.mawaeidi_history
    where user_id = new.user_id
    order by created_at desc, id desc
    offset 50
  );

  return new;
end;
$$;

revoke all on function private.log_mawaeidi_lessons_change() from public, anon, authenticated;

drop trigger if exists mawaeidi_lessons_history on public.mawaeidi_data;
create trigger mawaeidi_lessons_history
after update of lessons on public.mawaeidi_data
for each row
when (old.lessons is distinct from new.lessons)
execute function private.log_mawaeidi_lessons_change();

drop trigger if exists mawaeidi_lessons_initial_history on public.mawaeidi_data;
create trigger mawaeidi_lessons_initial_history
after insert on public.mawaeidi_data
for each row
when (jsonb_array_length(new.lessons) > 0)
execute function private.log_mawaeidi_lessons_change();

create table public.mawaeidi_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null check (length(endpoint) between 1 and 2048),
  p256dh text not null check (length(p256dh) between 1 and 512),
  auth_key text not null check (length(auth_key) between 1 and 512),
  timezone text not null default 'UTC' check (length(timezone) between 1 and 100),
  lead_minutes smallint not null default 15 check (lead_minutes in (5, 10, 15, 30, 60)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (endpoint)
);

create index mawaeidi_push_subscriptions_user_idx
  on public.mawaeidi_push_subscriptions (user_id);

alter table public.mawaeidi_push_subscriptions enable row level security;
revoke all on table public.mawaeidi_push_subscriptions from anon, authenticated;
grant select (id, user_id, endpoint, timezone, lead_minutes, created_at, updated_at)
  on public.mawaeidi_push_subscriptions to authenticated;
grant insert (user_id, endpoint, p256dh, auth_key, timezone, lead_minutes, updated_at)
  on public.mawaeidi_push_subscriptions to authenticated;
grant update (p256dh, auth_key, timezone, lead_minutes, updated_at)
  on public.mawaeidi_push_subscriptions to authenticated;
grant delete on table public.mawaeidi_push_subscriptions to authenticated;
grant all on table public.mawaeidi_push_subscriptions to service_role;

create policy "Users read their own push devices"
  on public.mawaeidi_push_subscriptions
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users add their own push devices"
  on public.mawaeidi_push_subscriptions
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users update their own push devices"
  on public.mawaeidi_push_subscriptions
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users remove their own push devices"
  on public.mawaeidi_push_subscriptions
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create table public.mawaeidi_notification_log (
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

create index mawaeidi_notification_log_claimed_idx
  on public.mawaeidi_notification_log (status, claimed_at);

alter table public.mawaeidi_notification_log enable row level security;
revoke all on table public.mawaeidi_notification_log from anon, authenticated;
grant all on table public.mawaeidi_notification_log to service_role;
grant usage, select on sequence public.mawaeidi_notification_log_id_seq to service_role;

commit;

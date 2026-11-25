-- Pilot: workers and subscription APIs not enabled yet. No live notifications.
BEGIN;
create table public.mawaeidi_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references neon_auth."user"(id) on delete cascade,
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

revoke all on table public.mawaeidi_push_subscriptions from PUBLIC, anonymous, authenticated;

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

revoke all on table public.mawaeidi_notification_log from PUBLIC, anonymous, authenticated;

ALTER TABLE public.mawaeidi_push_subscriptions ADD COLUMN lead_minutes_list smallint[] NOT NULL DEFAULT ARRAY[60,15]::smallint[] CHECK (cardinality(lead_minutes_list) BETWEEN 1 AND 3 AND array_position(lead_minutes_list,NULL) IS NULL AND lead_minutes_list <@ ARRAY[5,10,15,30,60]::smallint[]);

CREATE POLICY notification_log_no_client_access ON public.mawaeidi_notification_log FOR ALL TO anonymous,authenticated USING (false) WITH CHECK (false);
COMMIT;

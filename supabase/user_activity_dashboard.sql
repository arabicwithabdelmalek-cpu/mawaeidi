-- Mawaeidi | per-account usage reporting. Apply to the production Supabase project.
-- Add administrators separately using a privileged SQL session. Do not put personal IDs
-- or service-role credentials in this public repository.

create table if not exists public.mawaeidi_usage_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.mawaeidi_usage_admins enable row level security;
revoke all on public.mawaeidi_usage_admins from public, anon, authenticated;
grant select on public.mawaeidi_usage_admins to authenticated;
drop policy if exists "usage_admins_own_membership" on public.mawaeidi_usage_admins;
create policy "usage_admins_own_membership" on public.mawaeidi_usage_admins
  for select to authenticated using (user_id = (select auth.uid()));

create table if not exists public.mawaeidi_usage_sessions (
  user_id uuid not null references auth.users(id) on delete cascade,
  session_key uuid not null,
  started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  active_seconds integer not null default 0 check (active_seconds >= 0),
  client_type text not null default 'web'
    check (client_type in ('web', 'android', 'ios')),
  primary key (user_id, session_key),
  check (last_seen_at >= started_at)
);
create index if not exists mawaeidi_usage_sessions_started_at_idx
  on public.mawaeidi_usage_sessions (started_at desc);
alter table public.mawaeidi_usage_sessions enable row level security;
revoke all on public.mawaeidi_usage_sessions from public, anon, authenticated;
grant select, insert, update on public.mawaeidi_usage_sessions to authenticated;
drop policy if exists "usage_sessions_read_own" on public.mawaeidi_usage_sessions;
create policy "usage_sessions_read_own" on public.mawaeidi_usage_sessions
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "usage_sessions_insert_own" on public.mawaeidi_usage_sessions;
create policy "usage_sessions_insert_own" on public.mawaeidi_usage_sessions
  for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "usage_sessions_update_own" on public.mawaeidi_usage_sessions;
create policy "usage_sessions_update_own" on public.mawaeidi_usage_sessions
  for update to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- The server stamps times; the browser cannot forge visit times.
create or replace function public.mawaeidi_usage_stamp()
returns trigger language plpgsql security invoker set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.started_at := now();
    new.last_seen_at := now();
    new.active_seconds := 0;
  else
    new.user_id := old.user_id;
    new.session_key := old.session_key;
    new.started_at := old.started_at;
    -- Count only contiguous activity windows; ignore idle gaps.
    new.active_seconds := old.active_seconds + case
      when (now() - old.last_seen_at) <= interval '120 seconds'
      then greatest(0, floor(extract(epoch from now() - old.last_seen_at)))::integer
      else 0 end;
    new.last_seen_at := now();
  end if;
  return new;
end;
$$;
revoke all on function public.mawaeidi_usage_stamp() from public, anon, authenticated;
drop trigger if exists mawaeidi_usage_stamp_trigger on public.mawaeidi_usage_sessions;
create trigger mawaeidi_usage_stamp_trigger
before insert or update on public.mawaeidi_usage_sessions
for each row execute function public.mawaeidi_usage_stamp();

-- Read access to all users is only through this explicitly authorized function.
-- SECURITY DEFINER is needed to access auth.users, which is never exposed directly.
create or replace function public.mawaeidi_admin_usage(p_days integer default 30)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_days integer := least(greatest(coalesce(p_days, 30), 1), 90);
begin
  if v_actor is null or not exists (
    select 1 from public.mawaeidi_usage_admins a where a.user_id = v_actor
  ) then
    raise exception 'admin_only' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'generated_at', now(),
    'days', v_days,
    'users', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', u.id,
        'name', coalesce(nullif(btrim(u.raw_user_meta_data ->> 'full_name'), ''), split_part(coalesce(u.email, ''), '@', 1)),
        'email', u.email,
        'created_at', u.created_at,
        'last_sign_in_at', u.last_sign_in_at
      ) order by u.created_at), '[]'::jsonb)
      from auth.users u
    ),
    'sessions', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'user_id', x.user_id,
        'started_at', x.started_at,
        'last_seen_at', x.last_seen_at,
        'active_seconds', x.active_seconds,
        'client_type', x.client_type
      ) order by x.started_at desc), '[]'::jsonb)
      from (
        select s.user_id, s.started_at, s.last_seen_at, s.active_seconds, s.client_type
        from public.mawaeidi_usage_sessions s
        where s.started_at >= (now() - make_interval(days => v_days))
        order by s.started_at desc limit 8000
      ) x
    )
  );
end;
$$;
revoke all on function public.mawaeidi_admin_usage(integer) from public, anon, authenticated;
grant execute on function public.mawaeidi_admin_usage(integer) to authenticated;

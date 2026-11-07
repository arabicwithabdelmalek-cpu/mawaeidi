-- Non-secret audit marker for password changes initiated within the Mawaeidi account page.
-- No password values, hashes, tokens or credentials are stored here.
create table if not exists public.mawaeidi_password_change_events (
  user_id uuid primary key references auth.users(id) on delete cascade,
  changed_at timestamptz not null default now()
);

alter table public.mawaeidi_password_change_events enable row level security;
revoke all on public.mawaeidi_password_change_events from public, anon, authenticated;
grant select, insert, update on public.mawaeidi_password_change_events to authenticated;

drop policy if exists "password_change_events_read_owner_or_admin" on public.mawaeidi_password_change_events;
create policy "password_change_events_read_owner_or_admin"
on public.mawaeidi_password_change_events for select to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1 from public.mawaeidi_usage_admins a
    where a.user_id = (select auth.uid())
  )
);

drop policy if exists "password_change_events_insert_self" on public.mawaeidi_password_change_events;
create policy "password_change_events_insert_self"
on public.mawaeidi_password_change_events for insert to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists "password_change_events_update_self" on public.mawaeidi_password_change_events;
create policy "password_change_events_update_self"
on public.mawaeidi_password_change_events for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create or replace function public.mawaeidi_stamp_password_change_event()
returns trigger language plpgsql security invoker set search_path = ''
as $$
begin
  new.changed_at := now();
  return new;
end $$;

revoke all on function public.mawaeidi_stamp_password_change_event() from public, anon, authenticated;
drop trigger if exists mawaeidi_stamp_password_event_tr on public.mawaeidi_password_change_events;
create trigger mawaeidi_stamp_password_event_tr
before insert or update on public.mawaeidi_password_change_events
for each row execute function public.mawaeidi_stamp_password_change_event();

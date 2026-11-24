-- Nhost test project only. Do not run in production Supabase.
-- This is a provisional reconstruction from app-main.js, not a source DB dump.
begin;
create table if not exists public.mawaeidi_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  lessons jsonb not null default '[]'::jsonb
    check (jsonb_typeof(lessons) = 'array'),
  updated_at timestamptz not null default now()
);
-- Nhost/Hasura is the API authorization layer. No anonymous table grants.
revoke all on public.mawaeidi_data from public;
commit;

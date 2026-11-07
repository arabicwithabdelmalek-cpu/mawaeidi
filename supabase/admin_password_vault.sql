-- Encrypted administrative password vault for Mawaeidi.
-- Encrypted payloads are produced using browser Web Crypto AES-GCM.
-- The master passphrase and unencrypted credentials NEVER reach Postgres or a server key.
create table if not exists public.mawaeidi_admin_vault_config (
  owner_user_id uuid primary key references auth.users(id) on delete cascade,
  kdf_salt text not null check (length(kdf_salt) between 16 and 100),
  check_iv text not null check (length(check_iv) between 12 and 100),
  check_ciphertext text not null check (length(check_ciphertext) between 12 and 800),
  created_at timestamptz not null default now()
);

create table if not exists public.mawaeidi_admin_vault_entries (
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  target_user_id uuid not null references auth.users(id) on delete cascade,
  iv text not null check (length(iv) between 12 and 100),
  ciphertext text not null check (length(ciphertext) between 16 and 16000),
  updated_at timestamptz not null default now(),
  primary key(owner_user_id, target_user_id)
);

alter table public.mawaeidi_admin_vault_config enable row level security;
alter table public.mawaeidi_admin_vault_entries enable row level security;

revoke all on public.mawaeidi_admin_vault_config from public, anon, authenticated;
revoke all on public.mawaeidi_admin_vault_entries from public, anon, authenticated;
grant select, insert on public.mawaeidi_admin_vault_config to authenticated;
grant select, insert, update, delete on public.mawaeidi_admin_vault_entries to authenticated;

create policy "admin vault config read own"
on public.mawaeidi_admin_vault_config for select to authenticated
using (
 owner_user_id = (select auth.uid())
 and exists (select 1 from public.mawaeidi_usage_admins a where a.user_id = (select auth.uid()))
);
create policy "admin vault config initialize own"
on public.mawaeidi_admin_vault_config for insert to authenticated
with check (
 owner_user_id = (select auth.uid())
 and exists (select 1 from public.mawaeidi_usage_admins a where a.user_id = (select auth.uid()))
);

create policy "admin vault entries select own"
on public.mawaeidi_admin_vault_entries for select to authenticated
using (
 owner_user_id = (select auth.uid())
 and exists (select 1 from public.mawaeidi_usage_admins a where a.user_id = (select auth.uid()))
);
create policy "admin vault entries insert own"
on public.mawaeidi_admin_vault_entries for insert to authenticated
with check (
 owner_user_id = (select auth.uid())
 and exists (select 1 from public.mawaeidi_usage_admins a where a.user_id = (select auth.uid()))
);
create policy "admin vault entries update own"
on public.mawaeidi_admin_vault_entries for update to authenticated
using (
 owner_user_id = (select auth.uid())
 and exists (select 1 from public.mawaeidi_usage_admins a where a.user_id = (select auth.uid()))
)
with check (
 owner_user_id = (select auth.uid())
 and exists (select 1 from public.mawaeidi_usage_admins a where a.user_id = (select auth.uid()))
);
create policy "admin vault entries delete own"
on public.mawaeidi_admin_vault_entries for delete to authenticated
using (
 owner_user_id = (select auth.uid())
 and exists (select 1 from public.mawaeidi_usage_admins a where a.user_id = (select auth.uid()))
);

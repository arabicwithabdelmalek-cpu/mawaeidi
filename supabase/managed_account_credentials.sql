-- Mawaeidi: manage known administrator-stored account credentials without
-- a separate master password. Supabase Vault handles encryption at rest.
-- This DOES NOT expose current Supabase Auth password hashes or password changes.
-- The public RPC checks server-side admin membership on every operation.

create table if not exists private.mawaeidi_admin_password_entries (
  user_id uuid primary key references auth.users(id) on delete cascade,
  secret_id uuid not null unique,
  website text not null default 'مواعيدي',
  note text not null default '',
  updated_at timestamptz not null default now(),
  constraint site_length check (char_length(website) <= 300),
  constraint note_length check (char_length(note) <= 500)
);

alter table private.mawaeidi_admin_password_entries enable row level security;
revoke all on private.mawaeidi_admin_password_entries from public, anon, authenticated;

create or replace function private.mawaeidi_remove_password_secret()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  delete from vault.secrets where id = old.secret_id;
  return old;
end;
$$;
revoke all on function private.mawaeidi_remove_password_secret() from public, anon, authenticated;
drop trigger if exists mawaeidi_remove_password_secret_tr on private.mawaeidi_admin_password_entries;
create trigger mawaeidi_remove_password_secret_tr
before delete on private.mawaeidi_admin_password_entries
for each row execute function private.mawaeidi_remove_password_secret();

create or replace function public.mawaeidi_admin_credentials(
  p_action text,
  p_user_id uuid default null,
  p_password text default null,
  p_website text default null,
  p_note text default null
)
returns jsonb
language plpgsql volatile security definer
set search_path = ''
as $$
declare
  v_admin uuid := (select auth.uid());
  v_secret_id uuid;
  v_output jsonb;
begin
  if v_admin is null or not exists (
    select 1 from public.mawaeidi_usage_admins a where a.user_id = v_admin
  ) then
    raise exception 'admin_only' using errcode = '42501';
  end if;

  if p_action = 'list' then
    select coalesce(jsonb_agg(jsonb_build_object(
      'user_id', p.user_id,
      'password', ds.decrypted_secret,
      'website', p.website,
      'note', p.note,
      'updated_at', p.updated_at
    ) order by p.updated_at desc), '[]'::jsonb)
    into v_output
    from private.mawaeidi_admin_password_entries p
    join vault.decrypted_secrets ds on ds.id = p.secret_id;
    return v_output;
  end if;

  if p_action = 'save' then
    if p_user_id is null or p_password is null
      or char_length(p_password) = 0 or char_length(p_password) > 256
      or char_length(coalesce(p_website, '')) > 300
      or char_length(coalesce(p_note, '')) > 500 then
      raise exception 'invalid_fields' using errcode = '22023';
    end if;
    if not exists (select 1 from auth.users where id = p_user_id) then
      raise exception 'user_not_found' using errcode = '22023';
    end if;

    select entry.secret_id into v_secret_id
    from private.mawaeidi_admin_password_entries entry
    where entry.user_id = p_user_id for update;

    if v_secret_id is not null then
      perform vault.update_secret(v_secret_id, p_password);
      update private.mawaeidi_admin_password_entries
      set website = coalesce(nullif(btrim(p_website), ''), 'مواعيدي'),
          note = coalesce(p_note, ''),
          updated_at = now()
      where user_id = p_user_id;
    else
      v_secret_id := vault.create_secret(
        p_password, null, 'Mawaeidi managed account password');
      insert into private.mawaeidi_admin_password_entries
        (user_id, secret_id, website, note)
      values (p_user_id, v_secret_id,
        coalesce(nullif(btrim(p_website), ''), 'مواعيدي'),
        coalesce(p_note, ''));
    end if;
    return jsonb_build_object('saved', true);
  end if;

  if p_action = 'delete' then
    if p_user_id is null then
      raise exception 'invalid_user' using errcode = '22023';
    end if;
    delete from private.mawaeidi_admin_password_entries
    where user_id = p_user_id;
    return jsonb_build_object('deleted', true);
  end if;

  raise exception 'unsupported_action' using errcode = '22023';
end;
$$;
revoke all on function public.mawaeidi_admin_credentials(text,uuid,text,text,text)
  from public, anon, authenticated;
grant execute on function public.mawaeidi_admin_credentials(text,uuid,text,text,text)
  to authenticated;

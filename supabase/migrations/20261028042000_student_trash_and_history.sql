-- Student trash, 30-day restore window and per-owner audit history.
-- Fully backward-compatible with active student records.
alter table public.mawaeidi_students
  add column if not exists deleted_at timestamptz;

create index if not exists mawaeidi_students_owner_deleted_at
  on public.mawaeidi_students (user_id, deleted_at);

-- Owners may permanently delete only records already in the trash.
drop policy if exists "students_remove_own" on public.mawaeidi_students;
create policy "students_remove_own"
  on public.mawaeidi_students for delete to authenticated
  using ((select auth.uid()) = user_id and deleted_at is not null);

drop policy if exists "students_edit_own" on public.mawaeidi_students;
create policy "students_edit_own"
  on public.mawaeidi_students for update to authenticated
  using (
    (select auth.uid()) = user_id
    and (deleted_at is null or deleted_at > now() - interval '30 days')
  )
  with check ((select auth.uid()) = user_id);

create table if not exists public.mawaeidi_student_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  student_id uuid not null,
  student_name text not null default '',
  action text not null check (action in ('created','updated','trashed','restored','purged')),
  changes jsonb not null default '{}'::jsonb,
  changed_at timestamptz not null default now()
);
create index if not exists mawaeidi_student_history_owner_date
  on public.mawaeidi_student_history (user_id, changed_at desc);
create index if not exists mawaeidi_student_history_student_date
  on public.mawaeidi_student_history (user_id, student_id, changed_at desc);
alter table public.mawaeidi_student_history enable row level security;
revoke all on public.mawaeidi_student_history from anon, authenticated;
grant select on public.mawaeidi_student_history to authenticated;
grant all on public.mawaeidi_student_history to service_role;
drop policy if exists "student_history_read_own" on public.mawaeidi_student_history;
create policy "student_history_read_own"
  on public.mawaeidi_student_history for select to authenticated
  using ((select auth.uid()) = user_id);

-- Durable cleanup queue so interrupted photo deletions are retried at next sign-in.
create table if not exists public.mawaeidi_student_photo_cleanup (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  photo_path text not null,
  created_at timestamptz not null default now(),
  unique (user_id, photo_path)
);
create index if not exists mawaeidi_student_photo_cleanup_owner
  on public.mawaeidi_student_photo_cleanup (user_id, created_at);
alter table public.mawaeidi_student_photo_cleanup enable row level security;
revoke all on public.mawaeidi_student_photo_cleanup from anon, authenticated;
grant select, delete on public.mawaeidi_student_photo_cleanup to authenticated;
grant all on public.mawaeidi_student_photo_cleanup to service_role;
drop policy if exists "student_cleanup_read_own" on public.mawaeidi_student_photo_cleanup;
create policy "student_cleanup_read_own"
  on public.mawaeidi_student_photo_cleanup for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists "student_cleanup_delete_own" on public.mawaeidi_student_photo_cleanup;
create policy "student_cleanup_delete_own"
  on public.mawaeidi_student_photo_cleanup for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Only the database stamps deletion time. A trashed record cannot be edited
-- without restoring it, and expired records cannot be restored.
create or replace function private.guard_mawaeidi_student_trash()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.deleted_at is null and new.deleted_at is not null then
    new.deleted_at := now();
  elsif old.deleted_at is not null and new.deleted_at is null then
    if old.deleted_at <= now() - interval '30 days' then
      raise exception 'Student trash retention period has expired';
    end if;
  elsif old.deleted_at is not null and new.deleted_at is not null then
    new.deleted_at := old.deleted_at;
    if (to_jsonb(new) - array['updated_at','deleted_at'])
       is distinct from (to_jsonb(old) - array['updated_at','deleted_at']) then
      raise exception 'Restore trashed student before editing';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function private.guard_mawaeidi_student_trash() from public, anon, authenticated;
drop trigger if exists mawaeidi_student_trash_guard on public.mawaeidi_students;
create trigger mawaeidi_student_trash_guard
before update on public.mawaeidi_students
for each row execute function private.guard_mawaeidi_student_trash();

-- Auditing is database-side, so CSV imports, backups and direct API edits
-- are logged, not just changes made through the browser form.
create or replace function private.audit_mawaeidi_student_changes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  prior jsonb;
  after_value jsonb;
  differences jsonb := '{}'::jsonb;
  event_action text;
  owner_id uuid;
  person_id uuid;
  person_name text;
begin
  if tg_op = 'DELETE' then
    -- Permanent erasure clears all previous field values from history.
    delete from public.mawaeidi_student_history
    where user_id = old.user_id and student_id = old.id;
    if nullif(btrim(coalesce(old.photo_path,'')),'') is not null then
      insert into public.mawaeidi_student_photo_cleanup (user_id, photo_path)
      values (old.user_id, old.photo_path)
      on conflict (user_id, photo_path) do nothing;
    end if;
    insert into public.mawaeidi_student_history
      (user_id, student_id, student_name, action, changes)
    values (old.user_id, old.id, 'ملف محذوف نهائيًا', 'purged', '{}'::jsonb);
    return old;
  end if;

  owner_id := new.user_id;
  person_id := new.id;
  person_name := btrim(concat_ws(' ', new.first_name, nullif(new.last_name,'')));
  if tg_op = 'INSERT' then
    event_action := case when new.deleted_at is null then 'created' else 'trashed' end;
  else
    prior := to_jsonb(old) - array['id','user_id','created_at','updated_at'];
    after_value := to_jsonb(new) - array['id','user_id','created_at','updated_at'];
    select coalesce(
      jsonb_object_agg(fields.key,
        jsonb_build_object('before',prior -> fields.key,'after',after_value -> fields.key)),
      '{}'::jsonb)
    into differences
    from pg_catalog.jsonb_object_keys(after_value) as fields(key)
    where (prior -> fields.key) is distinct from (after_value -> fields.key);
    if differences = '{}'::jsonb then return new; end if;
    event_action := case
      when old.deleted_at is null and new.deleted_at is not null then 'trashed'
      when old.deleted_at is not null and new.deleted_at is null then 'restored'
      else 'updated'
    end;
  end if;

  insert into public.mawaeidi_student_history
    (user_id, student_id, student_name, action, changes)
  values (owner_id, person_id, person_name, event_action, differences);
  return new;
end;
$$;
revoke all on function private.audit_mawaeidi_student_changes() from public, anon, authenticated;
drop trigger if exists mawaeidi_students_audit_log on public.mawaeidi_students;
create trigger mawaeidi_students_audit_log
after insert or update or delete on public.mawaeidi_students
for each row execute function private.audit_mawaeidi_student_changes();

comment on column public.mawaeidi_students.deleted_at is
  'Null when active; server-stamped when moved to trash. Recoverable for 30 days.';
comment on table public.mawaeidi_student_history is
  'Private per-owner audit history; prior field values are erased on permanent deletion.';
notify pgrst, 'reload schema';

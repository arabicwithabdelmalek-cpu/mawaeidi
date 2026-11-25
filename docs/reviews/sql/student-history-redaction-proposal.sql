-- DRAFT FOR REVIEW ONLY; NOT A DEPLOYED MIGRATION.
-- This file deliberately lives under docs/reviews/sql, outside supabase/migrations.
-- Do NOT apply until the correct Mawaeidi Supabase project is connected and
-- production schema, permissions, audit behavior and backup have been verified.
--
-- Goal: avoid persisting old/new student login passwords inside history.changes.
-- Change is scoped to the existing student audit trigger function.
-- A password change is recorded only as a boolean 'credential_updated' marker.
-- Existing audit rows keep all other before/after diffs, with only the legacy
-- login_password key removed from the JSONB changes field.
--
-- Preconditions: private schema and relevant public tables exist, reviewer has
-- sufficient privileges, and Mawaeidi schema is confirmed.
-- Review results on a TEST DATABASE before promoting.
begin;

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
    prior := to_jsonb(old) - array['id','user_id','created_at','updated_at','login_password'];
    after_value := to_jsonb(new) - array['id','user_id','created_at','updated_at','login_password'];
    select coalesce(
      jsonb_object_agg(fields.key,
        jsonb_build_object('before',prior -> fields.key,'after',after_value -> fields.key)),
      '{}'::jsonb)
    into differences
    from pg_catalog.jsonb_object_keys(after_value) as fields(key)
    where (prior -> fields.key) is distinct from (after_value -> fields.key);
    -- Log that a saved student credential was changed, never its old/new value.
    if (to_jsonb(old)->'login_password') is distinct from
       (to_jsonb(new)->'login_password') then
      differences := differences || pg_catalog.jsonb_build_object(
        'credential_updated', pg_catalog.jsonb_build_object('changed', true));
    end if;
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

-- Retain the existing execution posture and permissions.
revoke all on function private.audit_mawaeidi_student_changes()
  from public, anon, authenticated;

-- Do not delete student history or modify student account passwords.
-- This removes ONLY secret-bearing legacy fields from per-row audit diffs.
update public.mawaeidi_student_history
   set changes = (changes - 'login_password') || pg_catalog.jsonb_build_object(
     'credential_updated', pg_catalog.jsonb_build_object('changed', true))
 where changes ? 'login_password';

commit;

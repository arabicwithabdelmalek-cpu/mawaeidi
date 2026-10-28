-- Archived students may receive a backup-restored photo while remaining in trash.
-- Other profile fields still require the student to be restored first.
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
    if (to_jsonb(new) - array['updated_at','deleted_at','photo_path'])
       is distinct from (to_jsonb(old) - array['updated_at','deleted_at','photo_path']) then
      raise exception 'Restore trashed student before editing';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function private.guard_mawaeidi_student_trash() from public, anon, authenticated;

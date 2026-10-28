-- Protect photographs from stale browser clients: a file may be removed
-- only after no current/trashed student row references it.
drop policy if exists mawaeidi_student_photos_delete on storage.objects;
create policy mawaeidi_student_photos_delete
on storage.objects for delete to authenticated
using (
  bucket_id='mawaeidi-student-photos'
  and (storage.foldername(name))[1]=(select auth.uid()::text)
  and not exists (
    select 1
    from public.mawaeidi_students s
    where s.user_id=(select auth.uid())
      and s.photo_path=storage.objects.name
  )
);

-- Photo replacement/removal is recoverable from a disrupted network operation.
create or replace function private.enqueue_detached_mawaeidi_student_photo()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.photo_path is distinct from new.photo_path
     and nullif(btrim(coalesce(old.photo_path,'')),'') is not null then
    insert into public.mawaeidi_student_photo_cleanup (user_id,photo_path)
    values (old.user_id,old.photo_path)
    on conflict (user_id,photo_path) do nothing;
  end if;
  return new;
end;
$$;
revoke all on function private.enqueue_detached_mawaeidi_student_photo() from public, anon, authenticated;
drop trigger if exists mawaeidi_student_photo_detach_queue on public.mawaeidi_students;
create trigger mawaeidi_student_photo_detach_queue
after update of photo_path on public.mawaeidi_students
for each row execute function private.enqueue_detached_mawaeidi_student_photo();

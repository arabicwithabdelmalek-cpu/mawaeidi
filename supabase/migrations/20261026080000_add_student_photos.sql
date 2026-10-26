-- Optional private profile photos for the development student registry.
-- The first path segment is always the authenticated user's UUID.

alter table public.mawaeidi_students
  add column if not exists photo_path text;

comment on column public.mawaeidi_students.photo_path is
  'Optional private Supabase Storage path for the student profile photo.';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'mawaeidi-student-photos',
  'mawaeidi-student-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set name = excluded.name,
    public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists mawaeidi_student_photos_select on storage.objects;
create policy mawaeidi_student_photos_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'mawaeidi-student-photos'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists mawaeidi_student_photos_insert on storage.objects;
create policy mawaeidi_student_photos_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'mawaeidi-student-photos'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists mawaeidi_student_photos_update on storage.objects;
create policy mawaeidi_student_photos_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'mawaeidi-student-photos'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  bucket_id = 'mawaeidi-student-photos'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists mawaeidi_student_photos_delete on storage.objects;
create policy mawaeidi_student_photos_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'mawaeidi-student-photos'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

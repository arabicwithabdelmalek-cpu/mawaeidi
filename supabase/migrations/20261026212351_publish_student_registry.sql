create table if not exists public.mawaeidi_students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  username text not null constraint student_username_valid check (length(btrim(username)) between 1 and 120),
  first_name text not null constraint student_first_name_valid check (length(btrim(first_name)) between 1 and 120),
  last_name text not null default '',
  country text not null default '',
  status text not null default 'غير محدد'
    constraint student_status_valid check (status in ('حالي','سابق','متوقف مؤقتًا','جديد','غير محدد')),
  institute text not null default '',
  study_group text not null default '',
  distinguishing_mark text not null default '',
  email text not null default '',
  whatsapp text not null default '',
  current_level text not null default 'غير محدد'
    constraint student_level_valid check (current_level in ('مبتدئ','متوسط','متقدم','غير محدد')),
  study_type text not null default 'غير محدد'
    constraint student_type_valid check (study_type in ('فردي','مجموعة','غير محدد')),
  course_book text not null default '',
  communication_language text not null default '',
  joined_on date,
  educational_notes text not null default ''
    constraint student_notes_length check (length(educational_notes) <= 20000),
  student_account_url text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists mawaeidi_students_username_per_owner
  on public.mawaeidi_students (user_id, lower(btrim(username)));

create index if not exists mawaeidi_students_owner_status
  on public.mawaeidi_students (user_id, status);

alter table public.mawaeidi_students enable row level security;

revoke all on table public.mawaeidi_students from anon, authenticated;
grant select, insert, update, delete on table public.mawaeidi_students to authenticated;
grant all on table public.mawaeidi_students to service_role;

drop policy if exists "students_read_own" on public.mawaeidi_students;
create policy "students_read_own"
  on public.mawaeidi_students for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "students_add_own" on public.mawaeidi_students;
create policy "students_add_own"
  on public.mawaeidi_students for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "students_edit_own" on public.mawaeidi_students;
create policy "students_edit_own"
  on public.mawaeidi_students for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "students_remove_own" on public.mawaeidi_students;
create policy "students_remove_own"
  on public.mawaeidi_students for delete to authenticated
  using ((select auth.uid()) = user_id);

notify pgrst, 'reload schema';

create schema if not exists private;
revoke all on schema private from public;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'mawaeidi_students_owner_id_unique'
      and conrelid = 'public.mawaeidi_students'::regclass
  ) then
    alter table public.mawaeidi_students
      add constraint mawaeidi_students_owner_id_unique unique (user_id, id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'student_last_name_length'
      and conrelid = 'public.mawaeidi_students'::regclass
  ) then
    alter table public.mawaeidi_students
      add constraint student_last_name_length check (length(last_name) <= 120),
      add constraint student_country_length check (length(country) <= 120),
      add constraint student_institute_length check (length(institute) <= 160),
      add constraint student_study_group_length check (length(study_group) <= 160),
      add constraint student_distinguishing_mark_length check (length(distinguishing_mark) <= 160),
      add constraint student_email_length check (length(email) <= 254),
      add constraint student_whatsapp_length check (length(whatsapp) <= 80),
      add constraint student_course_book_length check (length(course_book) <= 240),
      add constraint student_communication_language_length check (length(communication_language) <= 120),
      add constraint student_account_url_length check (length(student_account_url) <= 2048);
  end if;
end
$$;

create or replace function private.set_mawaeidi_student_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function private.set_mawaeidi_student_updated_at() from public, anon, authenticated;

drop trigger if exists mawaeidi_students_set_updated_at on public.mawaeidi_students;
create trigger mawaeidi_students_set_updated_at
before update on public.mawaeidi_students
for each row execute function private.set_mawaeidi_student_updated_at();

revoke all on table public.mawaeidi_students from anon, authenticated;
grant select, insert, update, delete on table public.mawaeidi_students to authenticated;
grant all on table public.mawaeidi_students to service_role;

-- Optional private profile photos for the student registry.
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

notify pgrst, 'reload schema';

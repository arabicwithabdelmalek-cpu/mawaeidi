begin;

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

commit;

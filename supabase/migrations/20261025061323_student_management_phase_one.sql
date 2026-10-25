begin;

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

create or replace function private.set_mawaeidi_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function private.set_mawaeidi_updated_at() from public, anon, authenticated;

drop trigger if exists mawaeidi_students_set_updated_at on public.mawaeidi_students;
create trigger mawaeidi_students_set_updated_at
before update on public.mawaeidi_students
for each row execute function private.set_mawaeidi_updated_at();

revoke all on table public.mawaeidi_students from anon, authenticated;
grant select, insert, update, delete on table public.mawaeidi_students to authenticated;
grant all on table public.mawaeidi_students to service_role;

create table public.mawaeidi_student_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  student_id uuid not null,
  recorded_on date not null default current_date,
  category text not null default 'general'
    check (category in ('general','vocabulary','speaking','listening','reading','writing','grammar','pronunciation','assessment','homework')),
  title text not null check (length(btrim(title)) between 1 and 160),
  notes text not null default '' check (length(notes) <= 5000),
  score smallint check (score is null or score between 0 and 100),
  next_step text not null default '' check (length(next_step) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mawaeidi_student_progress_owner_student_fkey
    foreign key (user_id, student_id)
    references public.mawaeidi_students (user_id, id)
    on delete cascade
);

create index mawaeidi_student_progress_owner_student_date_idx
  on public.mawaeidi_student_progress (user_id, student_id, recorded_on desc, created_at desc);

alter table public.mawaeidi_student_progress enable row level security;

revoke all on table public.mawaeidi_student_progress from anon, authenticated;
grant select, insert, update, delete on table public.mawaeidi_student_progress to authenticated;
grant all on table public.mawaeidi_student_progress to service_role;

create policy "student_progress_read_own"
  on public.mawaeidi_student_progress for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "student_progress_add_own"
  on public.mawaeidi_student_progress for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "student_progress_edit_own"
  on public.mawaeidi_student_progress for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "student_progress_remove_own"
  on public.mawaeidi_student_progress for delete to authenticated
  using ((select auth.uid()) = user_id);

create trigger mawaeidi_student_progress_set_updated_at
before update on public.mawaeidi_student_progress
for each row execute function private.set_mawaeidi_updated_at();

notify pgrst, 'reload schema';

commit;

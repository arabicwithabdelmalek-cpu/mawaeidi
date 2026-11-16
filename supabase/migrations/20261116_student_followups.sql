-- Mawaeidi student follow-up timeline, independent from schedule and finance.
-- Run against the Mawaeidi Supabase project only after review.
create table if not exists public.mawaeidi_student_followups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  student_id uuid not null,
  kind text not null default 'note' check (kind in ('note','contact','reminder')),
  body text not null check (length(btrim(body)) between 1 and 2000),
  due_on date,
  done_at timestamptz,
  created_at timestamptz not null default now(),
  constraint student_followups_owner_student_fk foreign key (user_id,student_id)
    references public.mawaeidi_students (user_id,id) on delete cascade
);

create index if not exists student_followups_owner_student_date
  on public.mawaeidi_student_followups (user_id,student_id,created_at desc);

create index if not exists student_followups_due_pending
  on public.mawaeidi_student_followups (user_id,due_on)
  where done_at is null and due_on is not null;

alter table public.mawaeidi_student_followups enable row level security;

revoke all on public.mawaeidi_student_followups from anon,authenticated;
grant select,insert,update,delete on public.mawaeidi_student_followups to authenticated;
grant all on public.mawaeidi_student_followups to service_role;

drop policy if exists "student_followups_read_own" on public.mawaeidi_student_followups;
create policy "student_followups_read_own"
  on public.mawaeidi_student_followups for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "student_followups_add_own" on public.mawaeidi_student_followups;
create policy "student_followups_add_own"
  on public.mawaeidi_student_followups for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "student_followups_edit_own" on public.mawaeidi_student_followups;
create policy "student_followups_edit_own"
  on public.mawaeidi_student_followups for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "student_followups_remove_own" on public.mawaeidi_student_followups;
create policy "student_followups_remove_own"
  on public.mawaeidi_student_followups for delete to authenticated
  using ((select auth.uid()) = user_id);

comment on table public.mawaeidi_student_followups is
  'Private student follow-up timeline; retained separately from lessons and financial records.';

notify pgrst, 'reload schema';

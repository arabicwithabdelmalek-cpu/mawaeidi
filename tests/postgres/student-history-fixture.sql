-- Synthetic student table matching the columns used by the real audit trigger.
create table public.mawaeidi_students (
 id uuid primary key, user_id uuid not null references auth.users(id),
 first_name text not null, last_name text not null default '', login_password text,
 photo_path text, created_at timestamptz default now(), updated_at timestamptz default now()
);
alter table public.mawaeidi_students enable row level security;
grant select,insert,update,delete on public.mawaeidi_students to authenticated;
create policy student_read on public.mawaeidi_students for select to authenticated using (auth.uid()=user_id);
create policy student_insert on public.mawaeidi_students for insert to authenticated with check (auth.uid()=user_id);

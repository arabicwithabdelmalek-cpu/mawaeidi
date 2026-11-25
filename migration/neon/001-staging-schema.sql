-- Empty pilot database only. Adapted from the source migration files, not a production dump.
-- No client grants until server-side functions and RLS are tested.
BEGIN;
CREATE TABLE public.mawaeidi_data (user_id uuid PRIMARY KEY DEFAULT auth.uid() REFERENCES neon_auth."user"(id) ON DELETE CASCADE, lessons jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(lessons)='array' AND octet_length(lessons::text)<=5242880), updated_at timestamptz NOT NULL DEFAULT now());

create table if not exists public.mawaeidi_students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references neon_auth."user"(id) on delete cascade,
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

ALTER TABLE public.mawaeidi_students ADD COLUMN photo_path text, ADD COLUMN deleted_at timestamptz, ADD CONSTRAINT mawaeidi_students_owner_id_unique UNIQUE (user_id,id);

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

create table if not exists public.mawaeidi_student_followups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references neon_auth."user"(id) on delete cascade,
  student_id uuid not null,
  kind text not null default 'note' check (kind in ('note','contact','reminder')),
  body text not null check (length(btrim(body)) between 1 and 2000),
  due_on date,
  done_at timestamptz,
  created_at timestamptz not null default now(),
  constraint student_followups_owner_student_fk foreign key (user_id,student_id)
    references public.mawaeidi_students (user_id,id) on delete cascade
);

create table if not exists public.mawaeidi_world_clock_settings (
 user_id uuid primary key default auth.uid() references neon_auth."user"(id) on delete cascade,
 base_zone text not null default 'Africa/Cairo'
   check (char_length(base_zone) between 1 and 120),
 zones text[] not null default array['Asia/Baku']::text[]
   check (cardinality(zones)<=9 and array_position(zones,null) is null),
 version bigint not null default 1 check (version >= 1),
 updated_at timestamptz not null default now(),
 constraint mawaeidi_world_clock_base_not_listed check (array_position(zones,base_zone) is null)
);

create table if not exists public.mawaeidi_student_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references neon_auth."user"(id) on delete cascade,
  student_id uuid not null,
  student_name text not null default '',
  action text not null check (action in ('created','updated','trashed','restored','purged')),
  changes jsonb not null default '{}'::jsonb,
  changed_at timestamptz not null default now()
);

create table if not exists public.mawaeidi_student_photo_cleanup (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references neon_auth."user"(id) on delete cascade,
  photo_path text not null,
  created_at timestamptz not null default now(),
  unique (user_id, photo_path)
);

create table if not exists public.mawaeidi_trash (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references neon_auth."user"(id) on delete cascade,
  entity_kind text not null check (entity_kind in ('lesson','world_zone')),
  item_key text not null check (char_length(item_key) between 1 and 240),
  label text not null default '' check (char_length(label) <= 300),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  deleted_at timestamptz not null default now()
);

create table public.mawaeidi_history (
  id bigint generated always as identity primary key,
  user_id uuid not null references neon_auth."user"(id) on delete cascade,
  before_lessons jsonb not null check (
    jsonb_typeof(before_lessons) = 'array'
    and octet_length(before_lessons::text) <= 5242880
  ),
  after_lessons jsonb not null check (
    jsonb_typeof(after_lessons) = 'array'
    and octet_length(after_lessons::text) <= 5242880
  ),
  created_at timestamptz not null default now()
);

create unique index if not exists mawaeidi_students_username_per_owner
  on public.mawaeidi_students (user_id, lower(btrim(username)));

create index if not exists mawaeidi_students_owner_status
  on public.mawaeidi_students (user_id, status);

create index if not exists student_followups_owner_student_date
  on public.mawaeidi_student_followups (user_id,student_id,created_at desc);

create index if not exists student_followups_due_pending
  on public.mawaeidi_student_followups (user_id,due_on)
  where done_at is null and due_on is not null;

create index if not exists mawaeidi_world_clock_updated_idx
 on public.mawaeidi_world_clock_settings(updated_at desc);

create index if not exists mawaeidi_students_owner_deleted_at
  on public.mawaeidi_students (user_id, deleted_at);

create index if not exists mawaeidi_student_history_owner_date
  on public.mawaeidi_student_history (user_id, changed_at desc);

create index if not exists mawaeidi_student_history_student_date
  on public.mawaeidi_student_history (user_id, student_id, changed_at desc);

create index if not exists mawaeidi_student_photo_cleanup_owner
  on public.mawaeidi_student_photo_cleanup (user_id, created_at);

create index if not exists mawaeidi_trash_owner_deleted
  on public.mawaeidi_trash(user_id,deleted_at desc);

create index mawaeidi_history_user_created_idx
  on public.mawaeidi_history (user_id, created_at desc);

ALTER TABLE public.mawaeidi_data ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.mawaeidi_data FROM PUBLIC, anonymous, authenticated;

ALTER TABLE public.mawaeidi_students ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.mawaeidi_students FROM PUBLIC, anonymous, authenticated;

ALTER TABLE public.mawaeidi_student_followups ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.mawaeidi_student_followups FROM PUBLIC, anonymous, authenticated;

ALTER TABLE public.mawaeidi_world_clock_settings ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.mawaeidi_world_clock_settings FROM PUBLIC, anonymous, authenticated;

ALTER TABLE public.mawaeidi_student_history ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.mawaeidi_student_history FROM PUBLIC, anonymous, authenticated;

ALTER TABLE public.mawaeidi_student_photo_cleanup ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.mawaeidi_student_photo_cleanup FROM PUBLIC, anonymous, authenticated;

ALTER TABLE public.mawaeidi_trash ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.mawaeidi_trash FROM PUBLIC, anonymous, authenticated;

ALTER TABLE public.mawaeidi_history ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.mawaeidi_history FROM PUBLIC, anonymous, authenticated;
COMMIT;

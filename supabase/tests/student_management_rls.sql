-- Run against an isolated development database only.
-- Every row created here is rolled back before the script finishes.

begin;

insert into auth.users (id, email)
values
  ('10000000-0000-4000-8000-000000000001','rls-owner-one@example.test'),
  ('20000000-0000-4000-8000-000000000002','rls-owner-two@example.test');

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);

insert into public.mawaeidi_students (username, first_name)
values ('rls_owner_one_student','اختبار');

do $$
begin
  if (select count(*) from public.mawaeidi_students) <> 1 then
    raise exception 'owner one could not read own student';
  end if;
end
$$;

insert into public.mawaeidi_student_progress (student_id, title)
select id, 'اختبار تقدم'
from public.mawaeidi_students
where username = 'rls_owner_one_student';

insert into public.mawaeidi_data (lessons)
select jsonb_build_array(jsonb_build_object(
  'id','rls-lesson-one',
  'studentIds',jsonb_build_array(id::text),
  'schedules',jsonb_build_array(jsonb_build_object('day','الاثنين','time','18:00'))
))
from public.mawaeidi_students
where username = 'rls_owner_one_student';

insert into public.mawaeidi_push_subscriptions (
  user_id, endpoint, p256dh, auth_key, timezone, lead_minutes, lead_minutes_list
) values (
  '10000000-0000-4000-8000-000000000001',
  'https://push.example.test/owner-one',
  'test-p256dh',
  'test-auth',
  'Africa/Cairo',
  15,
  array[60,15]::smallint[]
);

do $$
begin
  if (select count(*) from public.mawaeidi_student_progress) <> 1 then
    raise exception 'owner one could not read own progress';
  end if;
  if (select count(*) from public.mawaeidi_data) <> 1 then
    raise exception 'owner one could not read own integrated app data';
  end if;
  if (select count(*) from public.mawaeidi_history) <> 1 then
    raise exception 'owner one could not read own schedule history';
  end if;
  if (select count(*) from public.mawaeidi_push_subscriptions) <> 1 then
    raise exception 'owner one could not read own push subscription';
  end if;
end
$$;

select set_config(
  'request.jwt.claims',
  '{"sub":"20000000-0000-4000-8000-000000000002","role":"authenticated"}',
  true
);

do $$
begin
  if (select count(*) from public.mawaeidi_students) <> 0 then
    raise exception 'owner two can read owner one student';
  end if;
  if (select count(*) from public.mawaeidi_student_progress) <> 0 then
    raise exception 'owner two can read owner one progress';
  end if;
  if (select count(*) from public.mawaeidi_data) <> 0 then
    raise exception 'owner two can read owner one integrated app data';
  end if;
  if (select count(*) from public.mawaeidi_history) <> 0 then
    raise exception 'owner two can read owner one history';
  end if;
  if (select count(*) from public.mawaeidi_push_subscriptions) <> 0 then
    raise exception 'owner two can read owner one push subscription';
  end if;
end
$$;

do $$
declare
  touched integer;
begin
  update public.mawaeidi_students
  set first_name = 'اختراق'
  where username = 'rls_owner_one_student';
  get diagnostics touched = row_count;
  if touched <> 0 then
    raise exception 'owner two modified owner one student';
  end if;
end
$$;

do $$
declare
  touched integer;
begin
  update public.mawaeidi_data
  set lessons = '[]'::jsonb;
  get diagnostics touched = row_count;
  if touched <> 0 then
    raise exception 'owner two modified owner one integrated app data';
  end if;
end
$$;

rollback;

-- No real users or passwords; runs only inside disposable CI database.
set role authenticated;
set request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
do $$ begin
 if (select count(*) from public.mawaeidi_student_history)<>2 then raise exception 'History rows lost'; end if;
 if exists(select 1 from public.mawaeidi_student_history where changes ? 'login_password') then raise exception 'Legacy credential remained'; end if;
 if not exists(select 1 from public.mawaeidi_student_history where changes @> '{"credential_updated":{"changed":true},"first_name":{"before":"Synthetic","after":"Changed"}}') then raise exception 'Legacy non-secret diff or marker lost'; end if;
 if (select login_password from public.mawaeidi_students where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') is distinct from 'fixture-new' then raise exception 'Original credential modified'; end if;
end $$;
update public.mawaeidi_students set login_password='fixture-third' where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
update public.mawaeidi_students set first_name='Latest' where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
do $$ begin
 if (select count(*) from public.mawaeidi_student_history where changes ? 'credential_updated')<>2 then raise exception 'Password-only change not logged'; end if;
 if exists(select 1 from public.mawaeidi_student_history where changes::text like '%fixture-%') then raise exception 'Password leaked into history'; end if;
 if not exists(select 1 from public.mawaeidi_student_history where changes @> '{"first_name":{"after":"Latest"}}') then raise exception 'Normal audit broken'; end if;
end $$;
set request.jwt.claim.sub='22222222-2222-4222-8222-222222222222';
do $$ begin
 if exists(select 1 from public.mawaeidi_student_history) then raise exception 'Cross-owner history access'; end if;
 if exists(select 1 from public.mawaeidi_students) then raise exception 'Cross-owner student access'; end if;
end $$;
set request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
update public.mawaeidi_students set deleted_at=now() where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
update public.mawaeidi_students set deleted_at=null where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
do $$ begin
 if (select count(*) from public.mawaeidi_student_history where action in ('trashed','restored'))<>2 then raise exception 'Trash audit broken'; end if;
end $$;
update public.mawaeidi_students set deleted_at=now() where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
delete from public.mawaeidi_students where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
do $$ begin
 if (select count(*) from public.mawaeidi_student_history)<>1 or not exists(select 1 from public.mawaeidi_student_history where action='purged' and changes='{}') then raise exception 'Purge audit broken'; end if;
 if not exists(select 1 from public.mawaeidi_student_photo_cleanup where photo_path='synthetic/photo.png') then raise exception 'Photo cleanup missing'; end if;
end $$;
reset role;

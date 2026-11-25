-- Run with the original production-equivalent trigger before redaction.
set role authenticated;
set request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
insert into public.mawaeidi_students(id,user_id,first_name,login_password,photo_path)
values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',auth.uid(),'Synthetic','fixture-old','synthetic/photo.png');
update public.mawaeidi_students set first_name='Changed',login_password='fixture-new' where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
do $$ begin
 if (select count(*) from public.mawaeidi_student_history where changes ? 'login_password')<>1 then raise exception 'Legacy fixture must contain one password diff'; end if;
end $$;
reset role;

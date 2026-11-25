-- Pilot only; uses Neon auth.uid() and preserves source functions and RLS.
-- Storage-object policy translation and real JWT isolation tests remain pending.
BEGIN;
CREATE SCHEMA IF NOT EXISTS private;

REVOKE ALL ON SCHEMA private FROM PUBLIC, anonymous, authenticated;

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

create or replace function private.guard_mawaeidi_student_trash()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.deleted_at is null and new.deleted_at is not null then
    new.deleted_at := now();
  elsif old.deleted_at is not null and new.deleted_at is null then
    if old.deleted_at <= now() - interval '30 days' then
      raise exception 'Student trash retention period has expired';
    end if;
  elsif old.deleted_at is not null and new.deleted_at is not null then
    new.deleted_at := old.deleted_at;
    if (to_jsonb(new) - array['updated_at','deleted_at','photo_path'])
       is distinct from (to_jsonb(old) - array['updated_at','deleted_at','photo_path']) then
      raise exception 'Restore trashed student before editing';
    end if;
  end if;
  return new;
end;
$$;

create or replace function private.audit_mawaeidi_student_changes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  prior jsonb;
  after_value jsonb;
  differences jsonb := '{}'::jsonb;
  event_action text;
  owner_id uuid;
  person_id uuid;
  person_name text;
begin
  if tg_op = 'DELETE' then
    -- Permanent erasure clears all previous field values from history.
    delete from public.mawaeidi_student_history
    where user_id = old.user_id and student_id = old.id;
    if nullif(btrim(coalesce(old.photo_path,'')),'') is not null then
      insert into public.mawaeidi_student_photo_cleanup (user_id, photo_path)
      values (old.user_id, old.photo_path)
      on conflict (user_id, photo_path) do nothing;
    end if;
    insert into public.mawaeidi_student_history
      (user_id, student_id, student_name, action, changes)
    values (old.user_id, old.id, 'ملف محذوف نهائيًا', 'purged', '{}'::jsonb);
    return old;
  end if;

  owner_id := new.user_id;
  person_id := new.id;
  person_name := btrim(concat_ws(' ', new.first_name, nullif(new.last_name,'')));
  if tg_op = 'INSERT' then
    event_action := case when new.deleted_at is null then 'created' else 'trashed' end;
  else
    prior := to_jsonb(old) - array['id','user_id','created_at','updated_at'];
    after_value := to_jsonb(new) - array['id','user_id','created_at','updated_at'];
    select coalesce(
      jsonb_object_agg(fields.key,
        jsonb_build_object('before',prior -> fields.key,'after',after_value -> fields.key)),
      '{}'::jsonb)
    into differences
    from pg_catalog.jsonb_object_keys(after_value) as fields(key)
    where (prior -> fields.key) is distinct from (after_value -> fields.key);
    if differences = '{}'::jsonb then return new; end if;
    event_action := case
      when old.deleted_at is null and new.deleted_at is not null then 'trashed'
      when old.deleted_at is not null and new.deleted_at is null then 'restored'
      else 'updated'
    end;
  end if;

  insert into public.mawaeidi_student_history
    (user_id, student_id, student_name, action, changes)
  values (owner_id, person_id, person_name, event_action, differences);
  return new;
end;
$$;

create or replace function private.enqueue_detached_mawaeidi_student_photo()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.photo_path is distinct from new.photo_path
     and nullif(btrim(coalesce(old.photo_path,'')),'') is not null then
    insert into public.mawaeidi_student_photo_cleanup (user_id,photo_path)
    values (old.user_id,old.photo_path)
    on conflict (user_id,photo_path) do nothing;
  end if;
  return new;
end;
$$;

create or replace function private.archive_deleted_mawaeidi_lessons()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  item jsonb;
  item_id text;
begin
  if pg_catalog.jsonb_typeof(old.lessons) <> 'array'
     or pg_catalog.jsonb_typeof(new.lessons) <> 'array' then
    return new;
  end if;
  for item in select value from pg_catalog.jsonb_array_elements(old.lessons)
  loop
    item_id := item->>'id';
    if item_id is not null and char_length(item_id) between 1 and 240
       and not exists (
         select 1 from pg_catalog.jsonb_array_elements(new.lessons) as next_item(value)
         where next_item.value->>'id'=item_id
       ) then
      insert into public.mawaeidi_trash(user_id,entity_kind,item_key,label,payload)
      values (new.user_id,'lesson',item_id,coalesce(left(item->>'name',300),'حصة بدون اسم'),item);
    end if;
  end loop;
  return new;
end;
$$;

create or replace function private.log_mawaeidi_lessons_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  previous_lessons jsonb;
begin
  if tg_op = 'INSERT' then
    previous_lessons := '[]'::jsonb;
  else
    previous_lessons := coalesce(old.lessons, '[]'::jsonb);
  end if;

  insert into public.mawaeidi_history (user_id, before_lessons, after_lessons)
  values (
    new.user_id,
    previous_lessons,
    coalesce(new.lessons, '[]'::jsonb)
  );

  delete from public.mawaeidi_history
  where id in (
    select id
    from public.mawaeidi_history
    where user_id = new.user_id
    order by created_at desc, id desc
    offset 50
  );

  return new;
end;
$$;

create or replace function public.mawaeidi_restore_trashed_lesson(p_trash_id uuid)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  archived public.mawaeidi_trash%rowtype;
  current_lessons jsonb;
  item jsonb;
  existing_schedule jsonb;
  restored_schedule jsonb;
  existing_start integer;
  restored_start integer;
  existing_duration integer;
  restored_duration integer;
begin
  if (select auth.uid()) is null then raise exception 'authentication_required'; end if;
  delete from public.mawaeidi_trash
  where id=p_trash_id and user_id=(select auth.uid())
    and entity_kind='lesson'
  returning * into archived;
  if not found then raise exception 'trash_item_not_found'; end if;
  if archived.deleted_at <= now() - interval '30 days'
    then raise exception 'trash_item_expired'; end if;
  if archived.payload->>'id' is distinct from archived.item_key
    then raise exception 'invalid_archived_lesson'; end if;

  select lessons into current_lessons
    from public.mawaeidi_data
    where user_id=(select auth.uid()) for update;
  if not found or pg_catalog.jsonb_typeof(current_lessons)<>'array'
    then raise exception 'schedule_unavailable'; end if;
  if exists (select 1 from pg_catalog.jsonb_array_elements(current_lessons) as e(value)
    where e.value->>'id'=archived.item_key)
    then raise exception 'lesson_id_exists'; end if;

  -- Check time collisions against the CURRENT schedule, not an old browser snapshot.
  for item in select value from pg_catalog.jsonb_array_elements(current_lessons)
  loop
    existing_duration := case when item->>'duration' ~ '^[0-9]{1,4}$'
      then (item->>'duration')::integer else 60 end;
    restored_duration := case when archived.payload->>'duration' ~ '^[0-9]{1,4}$'
      then (archived.payload->>'duration')::integer else 60 end;
    for existing_schedule in select value from
      pg_catalog.jsonb_array_elements(case when pg_catalog.jsonb_typeof(item->'schedules')='array' then item->'schedules' else '[]'::jsonb end)
    loop
      for restored_schedule in select value from
        pg_catalog.jsonb_array_elements(case when pg_catalog.jsonb_typeof(archived.payload->'schedules')='array' then archived.payload->'schedules' else '[]'::jsonb end)
      loop
        if existing_schedule->>'day'=restored_schedule->>'day'
          and existing_schedule->>'time' ~ '^(?:[01][0-9]|2[0-3]):[0-5][0-9]$'
          and restored_schedule->>'time' ~ '^(?:[01][0-9]|2[0-3]):[0-5][0-9]$' then
          existing_start := split_part(existing_schedule->>'time',':',1)::integer*60
                            + split_part(existing_schedule->>'time',':',2)::integer;
          restored_start := split_part(restored_schedule->>'time',':',1)::integer*60
                            + split_part(restored_schedule->>'time',':',2)::integer;
          if existing_start < restored_start+restored_duration
             and restored_start < existing_start+existing_duration then
            raise exception 'lesson_time_conflict';
          end if;
        end if;
      end loop;
    end loop;
  end loop;

  update public.mawaeidi_data
    set lessons=current_lessons || pg_catalog.jsonb_build_array(archived.payload),
        updated_at=now()
    where user_id=(select auth.uid());
  delete from public.mawaeidi_trash
    where id=archived.id and user_id=(select auth.uid());
  return true;
end;
$$;

create or replace function public.mawaeidi_world_clock_initialize(p_base text,p_zones text[])
returns public.mawaeidi_world_clock_settings
language plpgsql security invoker set search_path=''
as $$
declare owner_id uuid := (select auth.uid());
  chosen_base text := coalesce(p_base,'Africa/Cairo');
  chosen_zones text[] := array[]::text[];
  item text;
  result public.mawaeidi_world_clock_settings%rowtype;
begin
 if owner_id is null then raise exception 'authentication_required'; end if;
 if not exists (select 1 from pg_catalog.pg_timezone_names where name=chosen_base)
   then raise exception 'invalid_time_zone'; end if;
 foreach item in array coalesce(p_zones,array[]::text[]) loop
   if not exists (select 1 from pg_catalog.pg_timezone_names where name=item)
      then raise exception 'invalid_time_zone'; end if;
   if item<>chosen_base and not(item=any(chosen_zones)) then
      chosen_zones:=array_append(chosen_zones,item);
   end if;
 end loop;
 if cardinality(chosen_zones)>9 then raise exception 'clock_zone_limit'; end if;
 insert into public.mawaeidi_world_clock_settings(user_id,base_zone,zones)
 values(owner_id,chosen_base,chosen_zones)
 on conflict (user_id) do nothing;
 select * into result from public.mawaeidi_world_clock_settings
 where user_id=owner_id;
 if not found then raise exception 'clock_unavailable'; end if;
 return result;
end $$;

create or replace function public.mawaeidi_world_clock_change(
 p_action text, p_zone text default null, p_zones text[] default null, p_trash_id uuid default null
)
returns public.mawaeidi_world_clock_settings
language plpgsql security invoker set search_path=''
as $$
declare owner_id uuid := (select auth.uid());
 r public.mawaeidi_world_clock_settings%rowtype;
 archived public.mawaeidi_trash%rowtype;
 next_zones text[];
 item text;
begin
 if owner_id is null then raise exception 'authentication_required'; end if;
 select * into r from public.mawaeidi_world_clock_settings
 where user_id=owner_id for update;
 if not found then raise exception 'clock_unavailable'; end if;

 if p_action in ('add','remove','base') then
   if not exists (select 1 from pg_catalog.pg_timezone_names where name=p_zone)
     then raise exception 'invalid_time_zone'; end if;
 end if;
 next_zones:=r.zones;
 if p_action='add' then
   if p_zone<>r.base_zone and not(p_zone=any(next_zones)) then
     if cardinality(next_zones)>=9 then raise exception 'clock_zone_limit'; end if;
     next_zones:=array_append(next_zones,p_zone);
   end if;
 elsif p_action='remove' then
   if p_zone=r.base_zone then raise exception 'cannot_remove_base'; end if;
   if p_zone=any(next_zones) then
     insert into public.mawaeidi_trash(user_id,entity_kind,item_key,label,payload)
       values(owner_id,'world_zone',p_zone,p_zone,pg_catalog.jsonb_build_object('zone',p_zone));
     next_zones:=array_remove(next_zones,p_zone);
   end if;
 elsif p_action='base' then
   if p_zone<>r.base_zone then
     next_zones:=array_remove(next_zones,p_zone);
     if cardinality(next_zones)>=9 then raise exception 'clock_zone_limit'; end if;
     next_zones:=array_prepend(r.base_zone,next_zones);
     r.base_zone:=p_zone;
   end if;
 elsif p_action='restore' then
   delete from public.mawaeidi_trash
    where id=p_trash_id and user_id=owner_id and entity_kind='world_zone'
    returning * into archived;
   if not found then raise exception 'trash_item_not_found'; end if;
   if archived.deleted_at<=now()-interval '30 days' then raise exception 'trash_item_expired'; end if;
   item:=archived.payload->>'zone';
   if item is distinct from archived.item_key or not exists
      (select 1 from pg_catalog.pg_timezone_names where name=item)
     then raise exception 'invalid_time_zone'; end if;
   if item=r.base_zone or item=any(next_zones) then raise exception 'zone_exists'; end if;
   if cardinality(next_zones)>=9 then raise exception 'clock_zone_limit'; end if;
   next_zones:=array_append(next_zones,item);
   -- The deleted row returns automatically if this transaction fails.
 elsif p_action='merge' then
   foreach item in array coalesce(p_zones,array[]::text[]) loop
     if not exists (select 1 from pg_catalog.pg_timezone_names where name=item)
       then raise exception 'invalid_time_zone'; end if;
     if item<>r.base_zone and not(item=any(next_zones)) then
       if cardinality(next_zones)>=9 then raise exception 'clock_zone_limit'; end if;
       next_zones:=array_append(next_zones,item);
     end if;
   end loop;
 else
   raise exception 'invalid_clock_action';
 end if;

 if r.base_zone is distinct from (
    select base_zone from public.mawaeidi_world_clock_settings where user_id=owner_id)
    or next_zones is distinct from r.zones then
    update public.mawaeidi_world_clock_settings
      set base_zone=r.base_zone,zones=next_zones,version=version+1,updated_at=now()
    where user_id=owner_id returning * into r;
 end if;
 return r;
end $$;

REVOKE ALL ON FUNCTION private.set_mawaeidi_student_updated_at() FROM PUBLIC, anonymous, authenticated;

REVOKE ALL ON FUNCTION private.guard_mawaeidi_student_trash() FROM PUBLIC, anonymous, authenticated;

REVOKE ALL ON FUNCTION private.audit_mawaeidi_student_changes() FROM PUBLIC, anonymous, authenticated;

REVOKE ALL ON FUNCTION private.enqueue_detached_mawaeidi_student_photo() FROM PUBLIC, anonymous, authenticated;

REVOKE ALL ON FUNCTION private.archive_deleted_mawaeidi_lessons() FROM PUBLIC, anonymous, authenticated;

REVOKE ALL ON FUNCTION private.log_mawaeidi_lessons_change() FROM PUBLIC, anonymous, authenticated;

REVOKE ALL ON FUNCTION public.mawaeidi_restore_trashed_lesson(uuid) FROM PUBLIC, anonymous, authenticated;

REVOKE ALL ON FUNCTION public.mawaeidi_world_clock_initialize(text,text[]) FROM PUBLIC, anonymous, authenticated;

REVOKE ALL ON FUNCTION public.mawaeidi_world_clock_change(text,text,text[],uuid) FROM PUBLIC, anonymous, authenticated;

create trigger mawaeidi_students_set_updated_at
before update on public.mawaeidi_students
for each row execute function private.set_mawaeidi_student_updated_at();

create trigger mawaeidi_student_trash_guard
before update on public.mawaeidi_students
for each row execute function private.guard_mawaeidi_student_trash();

create trigger mawaeidi_students_audit_log
after insert or update or delete on public.mawaeidi_students
for each row execute function private.audit_mawaeidi_student_changes();

create trigger mawaeidi_student_photo_detach_queue
after update of photo_path on public.mawaeidi_students
for each row execute function private.enqueue_detached_mawaeidi_student_photo();

create trigger mawaeidi_lessons_to_trash
  after update of lessons on public.mawaeidi_data
  for each row execute function private.archive_deleted_mawaeidi_lessons();

create trigger mawaeidi_lessons_history
after update of lessons on public.mawaeidi_data
for each row
when (old.lessons is distinct from new.lessons)
execute function private.log_mawaeidi_lessons_change();

create trigger mawaeidi_lessons_initial_history
after insert on public.mawaeidi_data
for each row
when (jsonb_array_length(new.lessons) > 0)
execute function private.log_mawaeidi_lessons_change();

CREATE POLICY mawaeidi_data_select_own ON public.mawaeidi_data FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

CREATE POLICY mawaeidi_data_insert_own ON public.mawaeidi_data FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY mawaeidi_data_update_own ON public.mawaeidi_data FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

create policy "students_read_own"
  on public.mawaeidi_students for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "students_add_own"
  on public.mawaeidi_students for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "students_edit_own"
  on public.mawaeidi_students for update to authenticated
  using (
    (select auth.uid()) = user_id
    and (deleted_at is null or deleted_at > now() - interval '30 days')
  )
  with check ((select auth.uid()) = user_id);

create policy "students_remove_own"
  on public.mawaeidi_students for delete to authenticated
  using ((select auth.uid()) = user_id and deleted_at is not null);

create policy "student_history_read_own"
  on public.mawaeidi_student_history for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "student_cleanup_read_own"
  on public.mawaeidi_student_photo_cleanup for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "student_cleanup_delete_own"
  on public.mawaeidi_student_photo_cleanup for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "student_followups_read_own"
  on public.mawaeidi_student_followups for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "student_followups_add_own"
  on public.mawaeidi_student_followups for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "student_followups_edit_own"
  on public.mawaeidi_student_followups for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "student_followups_remove_own"
  on public.mawaeidi_student_followups for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "world_clock_select_own" on public.mawaeidi_world_clock_settings
 for select to authenticated using ((select auth.uid())=user_id);

create policy "world_clock_insert_own" on public.mawaeidi_world_clock_settings
 for insert to authenticated with check ((select auth.uid())=user_id);

create policy "world_clock_update_own" on public.mawaeidi_world_clock_settings
 for update to authenticated using ((select auth.uid())=user_id)
 with check ((select auth.uid())=user_id);

create policy "mawaeidi_trash_select_own" on public.mawaeidi_trash
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "mawaeidi_trash_insert_own" on public.mawaeidi_trash
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "mawaeidi_trash_delete_own" on public.mawaeidi_trash
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Users read their own schedule history"
  on public.mawaeidi_history
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

GRANT SELECT, INSERT, UPDATE ON TABLE public.mawaeidi_data TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.mawaeidi_students TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.mawaeidi_student_followups TO authenticated;

GRANT SELECT, INSERT, UPDATE ON TABLE public.mawaeidi_world_clock_settings TO authenticated;

GRANT SELECT ON TABLE public.mawaeidi_student_history TO authenticated;

GRANT SELECT, DELETE ON TABLE public.mawaeidi_student_photo_cleanup TO authenticated;

GRANT SELECT, INSERT, DELETE ON TABLE public.mawaeidi_trash TO authenticated;

GRANT SELECT ON TABLE public.mawaeidi_history TO authenticated;

GRANT EXECUTE ON FUNCTION public.mawaeidi_restore_trashed_lesson(uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION public.mawaeidi_world_clock_initialize(text,text[]) TO authenticated;

GRANT EXECUTE ON FUNCTION public.mawaeidi_world_clock_change(text,text,text[],uuid) TO authenticated;
COMMIT;

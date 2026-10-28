-- Restore locks the trash record by deleting it inside the transaction; rollback returns it on failure.
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
notify pgrst,'reload schema';

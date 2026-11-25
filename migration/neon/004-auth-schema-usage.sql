-- Neon controls the auth schema ACL. A narrowly scoped identity helper
-- resolves the JWT subject without exposing the auth schema or bypassing
-- table RLS in the SECURITY INVOKER business functions.
BEGIN;
CREATE OR REPLACE FUNCTION public.mawaeidi_actor_id() RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$ SELECT auth.uid() $$;

REVOKE ALL ON FUNCTION public.mawaeidi_actor_id() FROM PUBLIC, anonymous, authenticated;

GRANT EXECUTE ON FUNCTION public.mawaeidi_actor_id() TO authenticated;

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
  if (select public.mawaeidi_actor_id()) is null then raise exception 'authentication_required'; end if;
  delete from public.mawaeidi_trash
  where id=p_trash_id and user_id=(select public.mawaeidi_actor_id())
    and entity_kind='lesson'
  returning * into archived;
  if not found then raise exception 'trash_item_not_found'; end if;
  if archived.deleted_at <= now() - interval '30 days'
    then raise exception 'trash_item_expired'; end if;
  if archived.payload->>'id' is distinct from archived.item_key
    then raise exception 'invalid_archived_lesson'; end if;

  select lessons into current_lessons
    from public.mawaeidi_data
    where user_id=(select public.mawaeidi_actor_id()) for update;
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
    where user_id=(select public.mawaeidi_actor_id());
  delete from public.mawaeidi_trash
    where id=archived.id and user_id=(select public.mawaeidi_actor_id());
  return true;
end;
$$;

create or replace function public.mawaeidi_world_clock_initialize(p_base text,p_zones text[])
returns public.mawaeidi_world_clock_settings
language plpgsql security invoker set search_path=''
as $$
declare owner_id uuid := (select public.mawaeidi_actor_id());
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
declare owner_id uuid := (select public.mawaeidi_actor_id());
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
COMMIT;

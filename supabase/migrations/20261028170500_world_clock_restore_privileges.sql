-- Removing the archived row in-transaction avoids UPDATE privilege on the trash table.
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
notify pgrst,'reload schema';

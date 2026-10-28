-- Account-owned world clock preferences, independent from lessons/students.
create table if not exists public.mawaeidi_world_clock_settings (
 user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
 base_zone text not null default 'Africa/Cairo'
   check (char_length(base_zone) between 1 and 120),
 zones text[] not null default array['Asia/Baku']::text[]
   check (cardinality(zones)<=9 and array_position(zones,null) is null),
 version bigint not null default 1 check (version >= 1),
 updated_at timestamptz not null default now(),
 constraint mawaeidi_world_clock_base_not_listed check (array_position(zones,base_zone) is null)
);
create index if not exists mawaeidi_world_clock_updated_idx
 on public.mawaeidi_world_clock_settings(updated_at desc);
alter table public.mawaeidi_world_clock_settings enable row level security;
revoke all on public.mawaeidi_world_clock_settings from anon,authenticated;
grant select,insert,update on public.mawaeidi_world_clock_settings to authenticated;
grant all on public.mawaeidi_world_clock_settings to service_role;
drop policy if exists "world_clock_select_own" on public.mawaeidi_world_clock_settings;
create policy "world_clock_select_own" on public.mawaeidi_world_clock_settings
 for select to authenticated using ((select auth.uid())=user_id);
drop policy if exists "world_clock_insert_own" on public.mawaeidi_world_clock_settings;
create policy "world_clock_insert_own" on public.mawaeidi_world_clock_settings
 for insert to authenticated with check ((select auth.uid())=user_id);
drop policy if exists "world_clock_update_own" on public.mawaeidi_world_clock_settings;
create policy "world_clock_update_own" on public.mawaeidi_world_clock_settings
 for update to authenticated using ((select auth.uid())=user_id)
 with check ((select auth.uid())=user_id);

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
revoke all on function public.mawaeidi_world_clock_initialize(text,text[]) from public,anon;
grant execute on function public.mawaeidi_world_clock_initialize(text,text[]) to authenticated;

-- Atomic operations prevent concurrent devices from overwriting each other's list.
-- Each remove inserts a recoverable trash record within the same transaction.
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
   select * into archived from public.mawaeidi_trash
    where id=p_trash_id and user_id=owner_id and entity_kind='world_zone'
    for update;
   if not found then raise exception 'trash_item_not_found'; end if;
   if archived.deleted_at<=now()-interval '30 days' then raise exception 'trash_item_expired'; end if;
   item:=archived.payload->>'zone';
   if item is distinct from archived.item_key or not exists
      (select 1 from pg_catalog.pg_timezone_names where name=item)
     then raise exception 'invalid_time_zone'; end if;
   if item=r.base_zone or item=any(next_zones) then raise exception 'zone_exists'; end if;
   if cardinality(next_zones)>=9 then raise exception 'clock_zone_limit'; end if;
   next_zones:=array_append(next_zones,item);
   delete from public.mawaeidi_trash where id=archived.id and user_id=owner_id;
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
revoke all on function public.mawaeidi_world_clock_change(text,text,text[],uuid) from public,anon;
grant execute on function public.mawaeidi_world_clock_change(text,text,text[],uuid) to authenticated;

-- Allow live cross-device updates when the client is actively connected.
do $$
begin
 if not exists (
  select 1 from pg_catalog.pg_publication_tables
  where pubname='supabase_realtime' and schemaname='public' and tablename='mawaeidi_world_clock_settings'
 ) then
   alter publication supabase_realtime add table public.mawaeidi_world_clock_settings;
 end if;
end $$;
notify pgrst,'reload schema';

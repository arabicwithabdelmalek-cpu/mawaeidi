-- Central trash for schedule lessons and locally configured world-clock zones.
-- Student records keep their existing recoverable soft-delete and private photos.
create table if not exists public.mawaeidi_trash (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  entity_kind text not null check (entity_kind in ('lesson','world_zone')),
  item_key text not null check (char_length(item_key) between 1 and 240),
  label text not null default '' check (char_length(label) <= 300),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  deleted_at timestamptz not null default now()
);
create index if not exists mawaeidi_trash_owner_deleted
  on public.mawaeidi_trash(user_id,deleted_at desc);
alter table public.mawaeidi_trash enable row level security;
revoke all on public.mawaeidi_trash from anon, authenticated;
grant select,insert,delete on public.mawaeidi_trash to authenticated;
grant all on public.mawaeidi_trash to service_role;
drop policy if exists "mawaeidi_trash_select_own" on public.mawaeidi_trash;
create policy "mawaeidi_trash_select_own" on public.mawaeidi_trash
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "mawaeidi_trash_insert_own" on public.mawaeidi_trash;
create policy "mawaeidi_trash_insert_own" on public.mawaeidi_trash
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "mawaeidi_trash_delete_own" on public.mawaeidi_trash;
create policy "mawaeidi_trash_delete_own" on public.mawaeidi_trash
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Every removal from the schedule is automatically archived *in the same
-- transaction*, including removals made by an older browser or history restore.
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
revoke all on function private.archive_deleted_mawaeidi_lessons() from public,anon,authenticated;
drop trigger if exists mawaeidi_lessons_to_trash on public.mawaeidi_data;
create trigger mawaeidi_lessons_to_trash
  after update of lessons on public.mawaeidi_data
  for each row execute function private.archive_deleted_mawaeidi_lessons();

-- Restores a single lesson without overwriting later schedule changes.
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
  select * into archived
  from public.mawaeidi_trash
  where id=p_trash_id and user_id=(select auth.uid())
    and entity_kind='lesson'
  for update;
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
revoke all on function public.mawaeidi_restore_trashed_lesson(uuid) from public, anon;
grant execute on function public.mawaeidi_restore_trashed_lesson(uuid) to authenticated;
notify pgrst,'reload schema';

-- REVIEW-ONLY SQL — NOT DEPLOYED. Kept outside supabase/migrations.
-- Install on a TEST COPY of Mawaeidi's real database schema first.
-- This protects NEW clients that use the RPC; older clients can still write
-- directly until all Android/web clients migrate and direct UPDATE is revoked.
-- Precondition: public.mawaeidi_data has (user_id uuid PRIMARY KEY/UNIQUE,
-- lessons jsonb, updated_at timestamptz) with ownership RLS for authenticated.
-- Existing lesson history and trash triggers remain in place.
begin;

create or replace function public.mawaeidi_save_schedule_if_unchanged(
  p_expected_lessons jsonb,
  p_lessons jsonb
)
returns jsonb
language plpgsql
volatile security invoker
set search_path = ''
as $$
declare
  owner_id uuid := (select auth.uid());
  current_row public.mawaeidi_data%rowtype;
  saved_row public.mawaeidi_data%rowtype;
begin
  if owner_id is null then
    raise exception 'authentication_required' using errcode='42501';
  end if;
  if p_lessons is null
     or pg_catalog.jsonb_typeof(p_lessons) <> 'array'
     or pg_catalog.jsonb_array_length(p_lessons) > 2000
     or pg_catalog.octet_length(p_lessons::text) > 5242880
     or (p_expected_lessons is not null and
         (pg_catalog.jsonb_typeof(p_expected_lessons) <> 'array'
          or pg_catalog.octet_length(p_expected_lessons::text) > 5242880)) then
    raise exception 'invalid_schedule' using errcode='22023';
  end if;

  -- Lock the user's record and compare the whole stored JSON snapshot.
  -- This remains correct even if two devices have different local clocks.
  select * into current_row
    from public.mawaeidi_data
   where user_id=owner_id
   for update;

  if found then
    if p_expected_lessons is null
       or current_row.lessons is distinct from p_expected_lessons then
      return pg_catalog.jsonb_build_object(
        'status','conflict',
        'current_lessons',current_row.lessons,
        'updated_at',current_row.updated_at);
    end if;
    update public.mawaeidi_data
       set lessons=p_lessons,
           updated_at=pg_catalog.greatest(
             pg_catalog.clock_timestamp(),
             current_row.updated_at + interval '1 microsecond')
     where user_id=owner_id
     returning * into saved_row;
    if not found then
      raise exception 'schedule_update_denied' using errcode='42501';
    end if;
  else
    if p_expected_lessons is not null then
      return pg_catalog.jsonb_build_object('status','conflict','current_lessons',null,'updated_at',null);
    end if;
    -- Two simultaneous first writes: only one can insert this user_id.
    insert into public.mawaeidi_data(user_id,lessons,updated_at)
    values(owner_id,p_lessons,pg_catalog.clock_timestamp())
    on conflict (user_id) do nothing
    returning * into saved_row;
    if not found then
      select * into current_row from public.mawaeidi_data
       where user_id=owner_id;
      return pg_catalog.jsonb_build_object(
        'status','conflict',
        'current_lessons',current_row.lessons,
        'updated_at',current_row.updated_at);
    end if;
  end if;

  return pg_catalog.jsonb_build_object(
    'status','saved',
    'updated_at',saved_row.updated_at);
end;
$$;
revoke all on function public.mawaeidi_save_schedule_if_unchanged(jsonb,jsonb)
  from public,anon,authenticated;
grant execute on function public.mawaeidi_save_schedule_if_unchanged(jsonb,jsonb)
  to authenticated;
notify pgrst,'reload schema';
commit;

-- Rollout requirements:
-- 1. Test the function on a temporary DB with the production RLS and triggers.
-- 2. Confirm two stale writes from separate sessions yield saved then conflict.
-- 3. Deploy the RPC BEFORE activating the matching web frontend.
-- 4. Update native Android and other old clients; they still use direct upsert.
-- 5. Only after all clients are updated, plan a separate carefully reviewed
--    policy/privilege change to prevent direct client writes.

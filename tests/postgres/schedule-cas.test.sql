-- Real PostgreSQL assertions: same schema ownership policies, actual history trigger,
-- SQL RPC and historical two-session stale-write behavior.
-- psql must stop on any error.
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
set role authenticated;

do $checks$
declare
  result jsonb;
  first_version timestamptz;
  second_version timestamptz;
  stored jsonb;
  history_count bigint;
begin
  -- Missing row: a client expecting old data must not silently insert.
  result := public.mawaeidi_save_schedule_if_unchanged('[]'::jsonb,'[{"id":"wrong"}]'::jsonb);
  if result->>'status' <> 'conflict'
     or result->'current_lessons' <> 'null'::jsonb then
    raise exception 'missing-row conflict validation failed: %',result;
  end if;

  -- First insert succeeds, starts the real schedule history trigger.
  result := public.mawaeidi_save_schedule_if_unchanged(null,'[{"id":"initial","name":"first"}]'::jsonb);
  if result->>'status' <> 'saved' then
    raise exception 'initial save failed: %',result;
  end if;
  first_version := (result->>'updated_at')::timestamptz;
  select count(*) into history_count from public.mawaeidi_history;
  if history_count <> 1 then
    raise exception 'history not written for initial save: %',history_count;
  end if;

  -- A second client with no baseline must not overwrite the first insert.
  result := public.mawaeidi_save_schedule_if_unchanged(null,'[{"id":"bad"}]'::jsonb);
  if result->>'status' <> 'conflict' then
    raise exception 'null baseline overwrote stored data';
  end if;

  -- Actual original snapshot advances the schedule and timestamp.
  result := public.mawaeidi_save_schedule_if_unchanged(
    '[{"id":"initial","name":"first"}]'::jsonb,
    '[{"id":"initial","name":"first"},{"id":"added","name":"second"}]'::jsonb
  );
  if result->>'status' <> 'saved' then raise exception 'legitimate update failed: %',result; end if;
  second_version := (result->>'updated_at')::timestamptz;
  if second_version <= first_version then raise exception 'timestamp failed to advance'; end if;

  -- A stale write must not touch either the current row or history.
  result := public.mawaeidi_save_schedule_if_unchanged(
    '[{"id":"initial","name":"first"}]'::jsonb,
    '[{"id":"stale","name":"old laptop"}]'::jsonb
  );
  if result->>'status' <> 'conflict' then
    raise exception 'stale write incorrectly succeeded: %',result;
  end if;
  if result->'current_lessons' is distinct from
    '[{"id":"initial","name":"first"},{"id":"added","name":"second"}]'::jsonb then
    raise exception 'conflict response omitted current data: %',result;
  end if;
  select lessons into stored from public.mawaeidi_data
    where user_id=(select auth.uid());
  if stored is distinct from '[{"id":"initial","name":"first"},{"id":"added","name":"second"}]'::jsonb then
    raise exception 'stale write changed the DB row';
  end if;
  select count(*) into history_count from public.mawaeidi_history;
  if history_count <> 2 then
    raise exception 'stale write unexpectedly logged history: %',history_count;
  end if;

  -- Invalid payload is rejected, not coerced to an empty schedule.
  begin
    perform public.mawaeidi_save_schedule_if_unchanged('[]'::jsonb,'{}'::jsonb);
    raise exception 'invalid payload unexpectedly allowed';
  exception when sqlstate '22023' then
    null;
  end;
  begin
    perform public.mawaeidi_save_schedule_if_unchanged('[]'::jsonb,null);
    raise exception 'null payload unexpectedly allowed';
  exception when sqlstate '22023' then
    null;
  end;
end
$checks$;

reset role;

-- Verify no function execution privilege is granted to anonymous clients.
do $permissions$
begin
  if has_function_privilege('anon',
    'public.mawaeidi_save_schedule_if_unchanged(jsonb,jsonb)','EXECUTE') then
    raise exception 'anonymous users can execute schedule mutation RPC';
  end if;
  if not has_function_privilege('authenticated',
    'public.mawaeidi_save_schedule_if_unchanged(jsonb,jsonb)','EXECUTE') then
    raise exception 'authenticated users cannot execute schedule mutation RPC';
  end if;
end
$permissions$;

select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);
set role authenticated;

do $user_isolation$
declare
  result jsonb;
  other_count bigint;
begin
  select count(*) into other_count from public.mawaeidi_data;
  if other_count <> 0 then raise exception 'RLS leaked first user schedule'; end if;
  select count(*) into other_count from public.mawaeidi_history;
  if other_count <> 0 then raise exception 'RLS leaked first user history'; end if;
  result := public.mawaeidi_save_schedule_if_unchanged(null,'[{"id":"bob"}]'::jsonb);
  if result->>'status' <> 'saved' then raise exception 'second user could not save own schedule'; end if;
  select count(*) into other_count from public.mawaeidi_data;
  if other_count <> 1 then raise exception 'second user saw another user schedule'; end if;
end
$user_isolation$;

reset role;
\echo 'Real PostgreSQL CAS, history trigger, RLS and permission checks passed'

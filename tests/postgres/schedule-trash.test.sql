-- Test the existing production history/trash triggers together with guarded writes.
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
set role authenticated;

do $checks$
declare
  saved jsonb;
  before_history bigint;
  after_history bigint;
  archived_id uuid;
  original jsonb := '[{"id":"initial","name":"first"},{"id":"added","name":"second"}]'::jsonb;
  only_first jsonb := '[{"id":"initial","name":"first"}]'::jsonb;
begin
  select count(*) into before_history from public.mawaeidi_history;
  saved := public.mawaeidi_save_schedule_if_unchanged(original,only_first);
  if saved->>'status' <> 'saved' then
    raise exception 'Guarded delete failed: %',saved;
  end if;

  select id into archived_id from public.mawaeidi_trash
  where entity_kind='lesson' and item_key='added' and user_id=(select auth.uid());
  if archived_id is null then
    raise exception 'Guarded deletion did not archive removed lesson';
  end if;
  select count(*) into after_history from public.mawaeidi_history;
  if after_history<>before_history+1 then
    raise exception 'Guarded deletion did not log exactly one history event';
  end if;

  -- A stale client must not archive anything or log extra history.
  saved := public.mawaeidi_save_schedule_if_unchanged(
    original, '[{"id":"stale-deleted-all"}]'::jsonb);
  if saved->>'status' <> 'conflict' then
    raise exception 'Stale update unexpectedly saved after deletion';
  end if;
  if (select count(*) from public.mawaeidi_trash)<>1 then
    raise exception 'Stale update unexpectedly moved another lesson to trash';
  end if;
  if (select count(*) from public.mawaeidi_history)<>after_history then
    raise exception 'Stale update unexpectedly created history';
  end if;

  -- An existing RPC that restores a deleted lesson remains compatible with CAS:
  -- when it modifies the schedule, an old browser's baseline should be rejected.
  if not public.mawaeidi_restore_trashed_lesson(archived_id) then
    raise exception 'Real trash restore RPC failed';
  end if;
  if (select count(*) from public.mawaeidi_trash)<>0 then
    raise exception 'Trash restore did not remove the archived row';
  end if;
  if (select count(*) from public.mawaeidi_data
      where lessons @> '[{"id":"added"}]'::jsonb)<>1 then
    raise exception 'Trash restore failed to append lesson';
  end if;
  saved := public.mawaeidi_save_schedule_if_unchanged(
    only_first, '[{"id":"stale-after-restore"}]'::jsonb);
  if saved->>'status'<>'conflict' then
    raise exception 'Old client overwrote a restored lesson';
  end if;
end
$checks$;

reset role;
\echo 'Real PostgreSQL trash/history/restoration compatibility checks passed'

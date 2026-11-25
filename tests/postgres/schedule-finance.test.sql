-- Synthetic data only: a schedule mutation must never overwrite finance.
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
set role authenticated;
do $finance$
declare before_finance jsonb := '{"cycles":[],"version":1,"payments":[{"id":"synthetic-payment"}],"agreements":[],"monthCounts":[]}'::jsonb;
  baseline jsonb; result jsonb; actual_finance jsonb;
begin
  update public.mawaeidi_data set finance=before_finance where user_id=auth.uid();
  select lessons into baseline from public.mawaeidi_data where user_id=auth.uid();
  result:=public.mawaeidi_save_schedule_if_unchanged(baseline,baseline || '[{"id":"finance-preservation-check"}]'::jsonb);
  if result->>'status'<>'saved' then raise exception 'schedule save failed in finance preservation check'; end if;
  select finance into actual_finance from public.mawaeidi_data where user_id=auth.uid();
  if actual_finance is distinct from before_finance then raise exception 'schedule save altered finance'; end if;
end
$finance$;
reset role;
\echo 'Schedule CAS preserves finance column'

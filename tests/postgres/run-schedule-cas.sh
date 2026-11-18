#!/usr/bin/env bash
set -euo pipefail

# Only use the disposable postgres:16 Docker service, never Supabase production.
PG_CONTAINER="$(docker ps --filter 'ancestor=postgres:16' --format '{{.ID}}' | head -n 1)"
if [[ -z "$PG_CONTAINER" ]]; then
  echo >&2 "No disposable postgres:16 container found; refusing database tests."
  exit 1
fi

run_sql_file() {
  local file="$1" target="/tmp/$(basename "$1")"
  docker cp "$file" "$PG_CONTAINER:$target"
  docker exec "$PG_CONTAINER" psql -X -U postgres -d mawaeidi_test \
    -v ON_ERROR_STOP=1 -f "$target"
}

run_sql_file tests/postgres/schedule-schema-fixture.sql
# Test the REAL schedule history migration, not a fake replacement trigger.
run_sql_file supabase/migrations/20260908_history_and_push.sql
run_sql_file docs/reviews/sql/schedule-cas-proposal.sql
run_sql_file tests/postgres/schedule-cas.test.sql

# Exactly one concurrent first write must win; the other must see a conflict.
call_first_write() {
  local lesson_id="$1"
  docker exec "$PG_CONTAINER" psql -X -Atq -v ON_ERROR_STOP=1 \
    -U postgres -d mawaeidi_test -c \
    "set role authenticated;
     set request.jwt.claim.sub='33333333-3333-4333-8333-333333333333';
     select (public.mawaeidi_save_schedule_if_unchanged(
       null, '[{\"id\":\"$lesson_id\"}]'::jsonb
     ))->>'status';"
}

result_a="$(mktemp)"
result_b="$(mktemp)"
trap 'rm -f "$result_a" "$result_b"' EXIT
call_first_write "simultaneous-a" > "$result_a" &
pid_a=$!
call_first_write "simultaneous-b" > "$result_b" &
pid_b=$!
wait "$pid_a"
wait "$pid_b"

both="$(cat "$result_a" "$result_b")"
if [[ "$(printf '%s\n' "$both" | grep -cx 'saved' || true)" != "1" ]] ||
   [[ "$(printf '%s\n' "$both" | grep -cx 'conflict' || true)" != "1" ]]; then
  echo >&2 "Concurrent first write failed expected saved+conflict:"
  cat "$result_a" "$result_b" >&2
  exit 1
fi

docker exec "$PG_CONTAINER" psql -X -Atq -v ON_ERROR_STOP=1 \
  -U postgres -d mawaeidi_test -c \
  "do \$test\$
   declare rows_count integer; history_count integer;
   begin
     select count(*) into rows_count from public.mawaeidi_data
     where user_id='33333333-3333-4333-8333-333333333333';
     select count(*) into history_count from public.mawaeidi_history
     where user_id='33333333-3333-4333-8333-333333333333';
     if rows_count<>1 or history_count<>1 then
       raise exception 'Concurrent first writes modified more than one row or history';
     end if;
   end
   \$test\$;"

echo "Real PostgreSQL concurrent first-write test passed (one saved, one conflict)."

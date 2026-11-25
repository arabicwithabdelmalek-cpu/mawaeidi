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
run_sql_file supabase/migrations/20261028160500_unified_trash.sql
run_sql_file supabase/migrations/20261028161000_fix_trash_restore_lock.sql
run_sql_file docs/reviews/sql/schedule-cas-proposal.sql
run_sql_file tests/postgres/schedule-cas.test.sql
run_sql_file tests/postgres/schedule-trash.test.sql

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


# Concurrent edits to an EXISTING schedule using the same baseline:
# exactly one update may be accepted; the other must preserve that update.
docker exec "$PG_CONTAINER" psql -X -Atq -v ON_ERROR_STOP=1 \
  -U postgres -d mawaeidi_test -c \
  "update public.mawaeidi_data
    set lessons='[{\"id\":\"shared\",\"name\":\"baseline\"}]'::jsonb,
        updated_at=clock_timestamp()
   where user_id='33333333-3333-4333-8333-333333333333';"

call_update() {
  local lesson_id="$1"
  docker exec "$PG_CONTAINER" psql -X -Atq -v ON_ERROR_STOP=1 \
    -U postgres -d mawaeidi_test -c \
    "set role authenticated;
     set request.jwt.claim.sub='33333333-3333-4333-8333-333333333333';
     select (public.mawaeidi_save_schedule_if_unchanged(
       '[{\"id\":\"shared\",\"name\":\"baseline\"}]'::jsonb,
       '[{\"id\":\"shared\",\"name\":\"baseline\"},{\"id\":\"$lesson_id\"}]'::jsonb
     ))->>'status';"
}

call_update "update-a" > "$result_a" &
pid_a=$!
call_update "update-b" > "$result_b" &
pid_b=$!
wait "$pid_a"
wait "$pid_b"

both="$(cat "$result_a" "$result_b")"
if [[ "$(printf '%s\n' "$both" | grep -cx 'saved' || true)" != "1" ]] ||
   [[ "$(printf '%s\n' "$both" | grep -cx 'conflict' || true)" != "1" ]]; then
  echo >&2 "Concurrent existing schedule edits did not produce saved+conflict:"
  cat "$result_a" "$result_b" >&2
  exit 1
fi

docker exec "$PG_CONTAINER" psql -X -Atq -v ON_ERROR_STOP=1 \
  -U postgres -d mawaeidi_test -c \
  "do \$test\$
   declare stored jsonb; history_count integer;
   begin
     select lessons into stored from public.mawaeidi_data
       where user_id='33333333-3333-4333-8333-333333333333';
     select count(*) into history_count from public.mawaeidi_history
       where user_id='33333333-3333-4333-8333-333333333333';
     if jsonb_array_length(stored)<>2 or
        not stored @> '[{\"id\":\"shared\"}]'::jsonb or
        not (stored @> '[{\"id\":\"update-a\"}]'::jsonb or stored @> '[{\"id\":\"update-b\"}]'::jsonb)
        or history_count<>3 then
       raise exception 'Concurrent schedule edit lost data or wrote multiple history entries';
     end if;
   end
   \$test\$;"
echo "Real PostgreSQL concurrent existing-schedule edits passed (one saved, one conflict)."

run_sql_file tests/postgres/schedule-finance.test.sql

# Exercise the real student audit trigger with synthetic credentials before and after redaction.
run_sql_file tests/postgres/student-history-fixture.sql
run_sql_file supabase/migrations/20261028042000_student_trash_and_history.sql
run_sql_file tests/postgres/student-history-legacy.test.sql
run_sql_file docs/reviews/sql/student-history-redaction-proposal.sql
run_sql_file tests/postgres/student-history-redaction.test.sql

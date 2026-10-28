#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PG_BIN="$(brew --prefix postgresql@17 2>/dev/null)/bin"
if [[ ! -x "$PG_BIN/initdb" ]]; then
  PG_BIN="$(dirname "$(command -v initdb || true)")"
fi
if [[ ! -x "$PG_BIN/initdb" || ! -x "$PG_BIN/pg_ctl" || ! -x "$PG_BIN/psql" ]]; then
  echo "PostgreSQL 17 client/server tools are required. On macOS: brew install postgresql@17" >&2
  exit 2
fi

TMP_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/hag-run-pg.XXXXXX")"
PGDATA="$TMP_ROOT/data"
PGLOG="$TMP_ROOT/postgres.log"
PORT="$(python3 -c 'import socket; s=socket.socket(); s.bind(("127.0.0.1", 0)); print(s.getsockname()[1]); s.close()')"
cleanup() {
  "$PG_BIN/pg_ctl" -D "$PGDATA" -m immediate stop >/dev/null 2>&1 || true
  rm -rf "$TMP_ROOT"
}
trap cleanup EXIT

"$PG_BIN/initdb" -D "$PGDATA" --auth-local=trust --auth-host=trust --no-sync >/dev/null
"$PG_BIN/pg_ctl" -D "$PGDATA" -l "$PGLOG" -o "-h 127.0.0.1 -p $PORT" -w start >/dev/null
DB_URL="postgresql://$(id -un)@127.0.0.1:$PORT/postgres"

"$PG_BIN/psql" "$DB_URL" -v ON_ERROR_STOP=1 -f "$REPO_ROOT/tests/sql/hag_run_fixture.sql" >/dev/null
"$PG_BIN/psql" "$DB_URL" -v ON_ERROR_STOP=1 -f "$REPO_ROOT/supabase/migrations/202610270001_hag_run.sql" >/dev/null
"$PG_BIN/psql" "$DB_URL" -v ON_ERROR_STOP=1 -f "$REPO_ROOT/tests/sql/hag_run_security.test.sql"

# Exercise the additive medical gate only after legacy RPC behavior has been checked.
"$PG_BIN/psql" "$DB_URL" -v ON_ERROR_STOP=1 -f "$REPO_ROOT/supabase/migrations/202610270002_hag_run_medical_gate.sql" >/dev/null
"$PG_BIN/psql" "$DB_URL" -v ON_ERROR_STOP=1 -f "$REPO_ROOT/tests/sql/hag_run_medical_gate.test.sql"

EVENT_ID="66666666-6666-4666-8666-666666666666"
CALL_SQL="set role anon; select public.hag_run_patient_save_execution(repeat('a',48), '$EVENT_ID'::uuid, 'clinician-session-next', '{\"completed\":false,\"duration_seconds\":300,\"distance_km\":0.5,\"rpe\":5,\"difficulty\":\"easy\",\"pain\":0,\"fatigue\":3,\"recovery\":\"good\"}'::jsonb);"
"$PG_BIN/psql" "$DB_URL" -v ON_ERROR_STOP=1 -Atc "$CALL_SQL" >"$TMP_ROOT/concurrent-a.out" & PID_A=$!
"$PG_BIN/psql" "$DB_URL" -v ON_ERROR_STOP=1 -Atc "$CALL_SQL" >"$TMP_ROOT/concurrent-b.out" & PID_B=$!
wait "$PID_A"
wait "$PID_B"
ROWS="$("$PG_BIN/psql" "$DB_URL" -v ON_ERROR_STOP=1 -Atc "select count(*) from public.hag_run_executions where client_event_id = '$EVENT_ID'::uuid;")"
[[ "$ROWS" == "1" ]] || { echo "Concurrent idempotency failed: expected 1 row, got $ROWS" >&2; exit 1; }
grep -q '"duplicate": true' "$TMP_ROOT/concurrent-a.out" "$TMP_ROOT/concurrent-b.out"
"$PG_BIN/psql" "$DB_URL" -v ON_ERROR_STOP=1 -f "$REPO_ROOT/tests/sql/hag_run_patient_hold.test.sql"
# HAG_RUN_CLINICIAN_REGISTRY_v1: cadastro de medico e vinculo pelo proprio medico, depois da 0002.
"$PG_BIN/psql" "$DB_URL" -v ON_ERROR_STOP=1 -f "$REPO_ROOT/supabase/migrations/202610280003_hag_run_clinician_registry.sql" >/dev/null
"$PG_BIN/psql" "$DB_URL" -v ON_ERROR_STOP=1 -f "$REPO_ROOT/tests/sql/hag_run_clinician_registry.test.sql"
echo "PostgreSQL 17 integration checks passed, including two concurrent retries with one persisted row."

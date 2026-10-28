#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if ! command -v supabase >/dev/null || ! command -v python3 >/dev/null; then
  echo "Install the Supabase CLI and Python 3 to run the local Supabase integration tests." >&2
  exit 2
fi
PG_BIN="$(brew --prefix postgresql@17 2>/dev/null)/bin"
if [[ ! -x "$PG_BIN/psql" ]]; then PG_BIN="$(dirname "$(command -v psql || true)")"; fi
if [[ ! -x "$PG_BIN/psql" ]]; then
  echo "PostgreSQL 17 psql is required. On macOS: brew install postgresql@17" >&2
  exit 2
fi

TMP_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/hag-run-supabase.XXXXXX")"
STACK_STARTED=0
cleanup() {
  if [[ "$STACK_STARTED" == "1" ]]; then
    SUPABASE_EXPERIMENTAL_STACK=1 supabase stack destroy --workdir "$TMP_ROOT" --yes >/dev/null 2>&1 || true
  fi
  rm -rf "$TMP_ROOT"
}
trap cleanup EXIT

export SUPABASE_EXPERIMENTAL_STACK=1
supabase init --workdir "$TMP_ROOT" >/dev/null 2>&1
python3 - "$TMP_ROOT/supabase/config.toml" <<'PY'
from pathlib import Path
import sys
import re

path = Path(sys.argv[1])
config = path.read_text()
marker = "[experimental]\n"
if marker not in config:
    raise SystemExit("Supabase config has no [experimental] section")
section = config.split(marker, 1)[1].split("\n[", 1)[0]
if not re.search(r"^stack\s*=", section, re.MULTILINE):
    config = config.replace(marker, marker + "stack = true\n", 1)
path.write_text(config)
PY

STACK_STARTED=1
if ! supabase start --workdir "$TMP_ROOT" >"$TMP_ROOT/start.log" 2>&1; then
  echo "The local Supabase stack did not start. No remote project was linked or changed." >&2
  exit 1
fi

STATUS_ENV="$(supabase status --workdir "$TMP_ROOT" --env --output-format text 2>/dev/null)"
API_URL=""
ANON_KEY=""
DB_URL=""
while IFS='=' read -r name value; do
  value="${value%\"}"
  value="${value#\"}"
  value="${value%\'}"
  value="${value#\'}"
  case "$name" in
    API_URL) API_URL="$value" ;;
    ANON_KEY) ANON_KEY="$value" ;;
    DB_URL) DB_URL="$value" ;;
  esac
done <<< "$STATUS_ENV"
unset STATUS_ENV
if [[ -z "$API_URL" || -z "$ANON_KEY" || -z "$DB_URL" ]]; then
  echo "The local Supabase stack did not return its local connection settings." >&2
  exit 1
fi
if [[ "$API_URL" != http://127.0.0.1:* && "$API_URL" != http://localhost:* ]]; then
  echo "Refusing to test against a non-local Supabase API URL." >&2
  exit 1
fi
if [[ "$DB_URL" != *127.0.0.1* && "$DB_URL" != *localhost* ]]; then
  echo "Refusing to test against a non-local PostgreSQL URL." >&2
  exit 1
fi

"$PG_BIN/psql" "$DB_URL" -q -v ON_ERROR_STOP=1 -f "$REPO_ROOT/tests/sql/hag_run_fixture.sql"
"$PG_BIN/psql" "$DB_URL" -q -v ON_ERROR_STOP=1 -f "$REPO_ROOT/supabase/migrations/202610270001_hag_run.sql"
"$PG_BIN/psql" "$DB_URL" -q -v ON_ERROR_STOP=1 -f "$REPO_ROOT/tests/sql/hag_run_security.test.sql"
"$PG_BIN/psql" "$DB_URL" -q -v ON_ERROR_STOP=1 -f "$REPO_ROOT/supabase/migrations/202610270002_hag_run_medical_gate.sql"
"$PG_BIN/psql" "$DB_URL" -q -v ON_ERROR_STOP=1 -f "$REPO_ROOT/tests/sql/hag_run_medical_gate.test.sql"
supabase db advisors --workdir "$TMP_ROOT" --local --type all --level warn --fail-on error
HAG_RUN_LOCAL_API_URL="$API_URL" HAG_RUN_LOCAL_ANON_KEY="$ANON_KEY" node "$REPO_ROOT/tests/ui/hag_run_supabase_local.test.js"
"$PG_BIN/psql" "$DB_URL" -q -v ON_ERROR_STOP=1 -f "$REPO_ROOT/tests/sql/hag_run_patient_hold.test.sql"
echo "HAG RUN local Supabase integration passed using synthetic-only records."

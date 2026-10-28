#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STACK_ROOT="$REPO_ROOT/.local/hag-run-supabase"
if ! command -v supabase >/dev/null 2>&1; then
  echo "Instale a Supabase CLI para iniciar o host local." >&2
  exit 2
fi
if [[ ! -f "$STACK_ROOT/supabase/config.toml" ]]; then
  mkdir -p "$STACK_ROOT"
  SUPABASE_EXPERIMENTAL_STACK=1 supabase init --workdir "$STACK_ROOT" >/dev/null
fi

python3 - "$STACK_ROOT/supabase/config.toml" <<'PY'
from pathlib import Path
import re
import sys

path = Path(sys.argv[1])
text = path.read_text()
if re.search(r"^\[experimental\]$", text, re.M):
    section_start = re.search(r"^\[experimental\]$", text, re.M).end()
    next_section = re.search(r"^\[", text[section_start:], re.M)
    section_end = section_start + next_section.start() if next_section else len(text)
    section = text[section_start:section_end]
    if re.search(r"^stack\s*=", section, re.M):
        section = re.sub(r"^stack\s*=.*$", "stack = true", section, flags=re.M)
    else:
        section += "\nstack = true\n"
    text = text[:section_start] + section + text[section_end:]
else:
    text += "\n[experimental]\nstack = true\n"
path.write_text(text)
PY

export SUPABASE_EXPERIMENTAL_STACK=1
# `stack start` writes the whole environment, including local secret/service-role
# keys, as JSON to stdout. Startup only needs the exit status; never echo it.
supabase stack start --stack hag-run-dev --workdir "$STACK_ROOT" --runtime auto --eager >/dev/null
STATUS_ENV="$(supabase stack status --stack hag-run-dev --workdir "$STACK_ROOT" --env --output-format text)"
API_URL=""; ANON_KEY=""; DB_URL=""
while IFS='=' read -r name value; do
  value="${value%\"}"; value="${value#\"}"; value="${value%\'}"; value="${value#\'}"
  case "$name" in
    API_URL) API_URL="$value" ;;
    ANON_KEY|PUBLISHABLE_KEY) ANON_KEY="$value" ;;
    DB_URL) DB_URL="$value" ;;
  esac
done <<< "$STATUS_ENV"
unset STATUS_ENV
if [[ "$API_URL" != http://127.0.0.1:* && "$API_URL" != http://localhost:* ]] || [[ -z "$ANON_KEY" || -z "$DB_URL" ]]; then
  echo "A stack local não retornou endpoints válidos. Nenhuma configuração remota será usada." >&2
  exit 1
fi

TABLE_EXISTS="$(psql "$DB_URL" -X -Atqc "select to_regclass('public.hag_run_programs') is not null" 2>/dev/null || true)"
if [[ "$TABLE_EXISTS" != "t" ]]; then
  echo "Stack iniciada. Execute uma vez 'npm run dev:hag-os:setup-db' para criar schema e dados sintéticos locais." >&2
  exit 2
fi

export HAG_RUN_LOCAL_API_URL="$API_URL"
export HAG_RUN_LOCAL_ANON_KEY="$ANON_KEY"
node "$REPO_ROOT/dev/hag_os_dev/server.mjs"

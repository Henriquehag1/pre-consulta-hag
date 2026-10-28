#!/usr/bin/env bash
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STACK_ROOT="$REPO_ROOT/.local/hag-run-supabase"
if [[ ! -f "$STACK_ROOT/supabase/config.toml" ]]; then
  echo "O ambiente HAG RUN local ainda não foi inicializado."
  exit 0
fi
SUPABASE_EXPERIMENTAL_STACK=1 supabase stack stop --stack hag-run-dev --workdir "$STACK_ROOT"

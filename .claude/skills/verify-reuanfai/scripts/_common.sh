#!/usr/bin/env bash
# sourced by the other scripts; not run directly
SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ROOT="$(cd "$SKILL_DIR/../../.." && pwd)"
VERIFY_DIR="$ROOT/.verify"
API_PORT=8787 # hardcoded in apps/api/src/dev.ts
WEB_PORT="${WEB_PORT:-3000}"
PW_CACHE="${XDG_CACHE_HOME:-$HOME/.cache}/reuanfai-verify"

port_pids() { lsof -nP -iTCP:"$1" -sTCP:LISTEN -t 2>/dev/null | sort -u || true; }
pgid_of() { ps -o pgid= -p "$1" 2>/dev/null | tr -d ' ' || true; }
group_alive() { [ -n "${1:-}" ] && pgrep -g "$1" >/dev/null 2>&1; }
cur_run() { [ -f "$VERIFY_DIR/current" ] && cat "$VERIFY_DIR/current" || true; }

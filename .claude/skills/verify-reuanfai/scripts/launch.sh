#!/usr/bin/env bash
# Starts api (:8787) + web (:$WEB_PORT, default 3000), each in its own process group.
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/_common.sh"

cd "$ROOT"
for p in "$API_PORT" "$WEB_PORT"; do
  if [ -n "$(port_pids "$p")" ]; then
    echo "launch: REFUSE port $p is held by a process we did not start (pid $(port_pids "$p" | tr '\n' ' '))." >&2
    echo "launch: stop it yourself or use WEB_PORT=<free> for web; the api port 8787 is hardcoded, so only one instance per machine." >&2
    exit 2
  fi
done

RUN_ID="$(date +%Y%m%d-%H%M%S)-$$"
STATE="$VERIFY_DIR/runs/$RUN_ID"
EVID="$VERIFY_DIR/evidence/$RUN_ID"
mkdir -p "$STATE" "$EVID"
printf '*\n' > "$VERIFY_DIR/.gitignore"
printf '%s\n' "$RUN_ID" > "$VERIFY_DIR/current"
printf '%s\n' "$WEB_PORT" > "$STATE/web_port"
git -C "$ROOT" rev-parse --short HEAD > "$STATE/head"

set -m # own process group per background job (pgid == pid)
( exec pnpm -C apps/api dev ) >"$EVID/api.log" 2>&1 &
API_PID=$!
( exec env API_ORIGIN="http://localhost:$API_PORT" NEXT_TELEMETRY_DISABLED=1 pnpm -C apps/web exec next dev -p "$WEB_PORT" ) >"$EVID/web.log" 2>&1 &
WEB_PID=$!
set +m
printf '%s\n' "$API_PID" > "$STATE/api.pid"; printf '%s\n' "$API_PID" > "$STATE/api.pgid"
printf '%s\n' "$WEB_PID" > "$STATE/web.pid"; printf '%s\n' "$WEB_PID" > "$STATE/web.pgid"

fail() { echo "launch: FAIL $1 (logs: $EVID); run scripts/cleanup.sh" >&2; tail -n 15 "$EVID/api.log" "$EVID/web.log" >&2 || true; exit 1; }

TIMEOUT=120
deadline=$((SECONDS + TIMEOUT))
api_ok=0; web_ok=0
while [ $SECONDS -lt $deadline ]; do
  kill -0 "$API_PID" 2>/dev/null || fail "api process exited"
  kill -0 "$WEB_PID" 2>/dev/null || fail "web process exited"
  if [ $api_ok -eq 0 ] && [ "$(curl -fsS --max-time 3 "http://localhost:$API_PORT/health" 2>/dev/null || true)" = '{"ok":true}' ]; then api_ok=1; fi
  if [ $web_ok -eq 0 ]; then
    code="$(curl -sS --max-time 60 -o "$STATE/ruenfai.html" -w '%{http_code} %{content_type}' "http://localhost:$WEB_PORT/ruenfai" 2>/dev/null || true)"
    case "$code" in "200 text/html"*) grep -q '<html' "$STATE/ruenfai.html" && web_ok=1 ;; esac
  fi
  [ $api_ok -eq 1 ] && [ $web_ok -eq 1 ] && break
  sleep 2
done
[ $api_ok -eq 1 ] || fail "api /health not {\"ok\":true} within ${TIMEOUT}s"
[ $web_ok -eq 1 ] || fail "web GET /ruenfai not 200 html within ${TIMEOUT}s"

echo "RUN_ID=$RUN_ID"
echo "API=http://localhost:$API_PORT  (pgid $API_PID)"
echo "WEB=http://localhost:$WEB_PORT  (pgid $WEB_PID)"
echo "EVIDENCE=$EVID"

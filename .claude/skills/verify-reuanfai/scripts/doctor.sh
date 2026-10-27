#!/usr/bin/env bash
# Read-only: is the recorded instance alive, ours, and healthy? Exit 0 = worth driving.
set -uo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/_common.sh"

die() { echo "doctor: FAIL $1" >&2; exit 1; }
RUN_ID="$(cur_run)"; [ -n "$RUN_ID" ] || die "no .verify/current; run scripts/launch.sh"
STATE="$VERIFY_DIR/runs/$RUN_ID"; [ -d "$STATE" ] || die "state dir $STATE missing"
web_port="$(cat "$STATE/web_port")"
BASE="http://localhost:$web_port"
case "$BASE" in http://localhost:*) ;; *) die "base URL $BASE is not localhost";; esac

for svc in api web; do
  pid="$(cat "$STATE/$svc.pid")"; pgid="$(cat "$STATE/$svc.pgid")"
  kill -0 "$pid" 2>/dev/null || die "$svc pid $pid is dead"
  port=$API_PORT; [ "$svc" = web ] && port="$web_port"
  pids="$(port_pids "$port")"; [ -n "$pids" ] || die "nothing listening on :$port"
  for lp in $pids; do
    [ "$(pgid_of "$lp")" = "$pgid" ] || die "listener pid $lp on :$port is not in our process group $pgid (someone else's server)"
  done
  echo "doctor: $svc ok pid=$pid pgid=$pgid port=$port"
done

health="$(curl -fsS --max-time 5 "http://localhost:$API_PORT/health" 2>/dev/null || true)"
[ "$health" = '{"ok":true}' ] || die "api /health returned '$health'"
code="$(curl -sS --max-time 60 -o /dev/null -w '%{http_code}' "$BASE/ruenfai" 2>/dev/null || true)"
[ "$code" = 200 ] || die "GET $BASE/ruenfai returned $code"

head_now="$(git -C "$ROOT" rev-parse --short HEAD)"; head_run="$(cat "$STATE/head")"
[ "$head_now" = "$head_run" ] && drift="" || drift=" (WARN HEAD moved since launch: $head_run -> $head_now)"
echo "doctor: OK run=$RUN_ID base=$BASE head=$head_now$drift evidence=$VERIFY_DIR/evidence/$RUN_ID"

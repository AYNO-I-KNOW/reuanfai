#!/usr/bin/env bash
# Kills ONLY the recorded process groups. Keeps .verify/evidence/<RUN_ID>. Safe after a failed launch.
set -uo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/_common.sh"

RUN_ID="$(cur_run)"
if [ -z "$RUN_ID" ]; then echo "cleanup: no current run"; git -C "$ROOT" status --short; exit 0; fi
STATE="$VERIFY_DIR/runs/$RUN_ID"; EVID="$VERIFY_DIR/evidence/$RUN_ID"
web_port="$(cat "$STATE/web_port" 2>/dev/null || echo "$WEB_PORT")"
own_pgid="$(pgid_of $$)"

for svc in api web; do
  pgid="$(cat "$STATE/$svc.pgid" 2>/dev/null || true)"
  case "$pgid" in ''|*[!0-9]*|0|1) continue;; esac
  [ "$pgid" = "$own_pgid" ] && continue
  group_alive "$pgid" && kill -TERM -- "-$pgid" 2>/dev/null
done
for i in $(seq 1 20); do
  alive=0
  for svc in api web; do group_alive "$(cat "$STATE/$svc.pgid" 2>/dev/null || true)" && alive=1; done
  [ $alive -eq 0 ] && break
  [ "$i" -eq 15 ] && for svc in api web; do
    pgid="$(cat "$STATE/$svc.pgid" 2>/dev/null || true)"; group_alive "$pgid" && kill -KILL -- "-$pgid" 2>/dev/null
  done
  sleep 1
done
for p in "$API_PORT" "$web_port"; do
  for i in $(seq 1 10); do [ -z "$(port_pids "$p")" ] && break; sleep 1; done
  [ -z "$(port_pids "$p")" ] || echo "cleanup: WARN port $p still held by pid $(port_pids "$p" | tr '\n' ' ') (not ours to kill)" >&2
done

rm -rf "$STATE" "$VERIFY_DIR/current"
echo "cleanup: done run=$RUN_ID"
echo "evidence kept: $EVID"
git -C "$ROOT" status --short

#!/usr/bin/env bash
# Installs the pinned playwright-core into a cache dir outside the repo. Idempotent.
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/_common.sh"

PW_VERSION="1.64.1"

command -v node >/dev/null || { echo "setup: node not found" >&2; exit 1; }
command -v pnpm >/dev/null || { echo "setup: pnpm not found" >&2; exit 1; }
[ -d "$ROOT/node_modules" ] || { echo "setup: run 'pnpm install' in $ROOT first" >&2; exit 1; }

installed="$(node -p "require('$PW_CACHE/node_modules/playwright-core/package.json').version" 2>/dev/null || true)"
if [ "$installed" = "$PW_VERSION" ]; then
  echo "setup: playwright-core@$PW_VERSION already in $PW_CACHE"
else
  mkdir -p "$PW_CACHE"
  PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm i --prefix "$PW_CACHE" --no-audit --no-fund --save-exact "playwright-core@$PW_VERSION"
  echo "setup: installed playwright-core@$PW_VERSION in $PW_CACHE"
fi

if [ -z "${CHROME_PATH:-}" ] && [ ! -d "/Applications/Google Chrome.app" ]; then
  echo "setup: WARN Google Chrome not found; set CHROME_PATH to a chrome/chromium binary" >&2
fi

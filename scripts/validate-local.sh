#!/usr/bin/env bash

set -euo pipefail

LOG_DIR="$(mktemp -d 2>/dev/null || mktemp -d -t 'validate-local')"
SERVER_LOG="$LOG_DIR/server.log"
SERVER_PID=""

function cleanup {
  if [[ -n "$SERVER_PID" ]] && ps -p "$SERVER_PID" >/dev/null 2>&1; then
    kill "$SERVER_PID" >/dev/null 2>&1 || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
  if [[ -n "$LOG_DIR" ]] && [[ -d "$LOG_DIR" ]]; then
    rm -rf "$LOG_DIR"
  fi
}

trap cleanup EXIT

echo "🚀 Building application..."
npm run build:test

echo "🟢 Starting test server on localhost:4311"
npm run start:test >"$SERVER_LOG" 2>&1 &
SERVER_PID=$!
echo "    PID: $SERVER_PID (logs: $SERVER_LOG)"

echo "⏳ Waiting for readiness..."
npx --yes wait-on http://localhost:4311/waitlist

echo "✅ Server ready — running unit tests"
npm run test:unit

echo "✅ Running Playwright E2E"
npm run test:e2e

echo "✅ Running accessibility (axe) suite"
npm run test:axe

echo "✅ Running Lighthouse"
npm run lighthouse

echo "🎉 All suites completed. Server logs are stored at $SERVER_LOG during execution." 

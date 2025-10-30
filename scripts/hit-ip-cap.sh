#!/usr/bin/env bash

set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:3000}"

for i in {1..12}; do
  email="cap${i}@example.com"
  curl -s -X POST "${BASE_URL}/api/waitlist" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${email}\",\"referredBy\":\"TESTREF\",\"consent\":true}" \
    | jq '.error // .ok'
done

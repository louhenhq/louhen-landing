#!/usr/bin/env bash

set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:3000}"
OWNER_EMAIL="${OWNER_EMAIL:-owner@example.com}"
REF_CODE="${REF_CODE:-OWNERCODE}"

echo "Simulating owner signup to seed referral mapping..."
curl -s -X POST "${BASE_URL}/api/waitlist" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${OWNER_EMAIL}\",\"referredBy\":null,\"consent\":true}" >/dev/null

echo "Attempting self referral..."
curl -s -X POST "${BASE_URL}/api/waitlist" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${OWNER_EMAIL}\",\"referredBy\":\"${REF_CODE}\",\"consent\":true}" \
  | jq

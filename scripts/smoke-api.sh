#!/usr/bin/env bash
set -euo pipefail
BASE_URL="${API_URL:-http://localhost:4000/api}"
: "${SMOKE_EMAIL:=admin@greenvalley.test}"
: "${SMOKE_PASSWORD:=password123}"

echo "[1/5] health"
curl -fsS "$BASE_URL/health" >/dev/null

echo "[2/5] login"
LOGIN=$(curl -fsS -H 'Content-Type: application/json' -d "{\"email\":\"$SMOKE_EMAIL\",\"password\":\"$SMOKE_PASSWORD\"}" "$BASE_URL/auth/login")
TOKEN=$(printf '%s' "$LOGIN" | sed -n 's/.*"accessToken":"\([^"]*\)".*/\1/p')
test -n "$TOKEN"

echo "[3/5] authenticated dashboard"
curl -fsS -H "Authorization: Bearer $TOKEN" "$BASE_URL/dashboard/admin" >/dev/null

echo "[4/5] notifications"
curl -fsS -H "Authorization: Bearer $TOKEN" "$BASE_URL/notifications/unread-count" >/dev/null

echo "[5/5] school settings"
curl -fsS -H "Authorization: Bearer $TOKEN" "$BASE_URL/school-settings" >/dev/null

echo "KAKSAM smoke checks passed."

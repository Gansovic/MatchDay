#!/bin/bash

# Auto-populate teams to season test script
# Usage: ./test-auto-populate.sh [seasonId] [teamCount]

SEASON_ID="${1:-d055defa-d9a8-4e7e-a95b-a1a5d0e408de}"
TEAM_COUNT="${2:-8}"
BASE_URL="http://localhost:3001"

echo "🚀 Auto-populating teams to season..."
echo "   Season ID: $SEASON_ID"
echo "   Team Count: $TEAM_COUNT"
echo ""

# You'll need to get the auth token from your browser
# Open dev tools -> Application -> Local Storage -> Look for supabase token
# Or login and copy from the network tab
echo "⚠️  You need to provide an authentication token"
echo "   Get it from browser dev tools -> Local Storage -> supabase.auth.token"
echo ""
read -p "Paste your auth token: " AUTH_TOKEN

if [ -z "$AUTH_TOKEN" ]; then
  echo "❌ Error: Auth token is required"
  exit 1
fi

echo ""
echo "📡 Making request..."

curl -X POST "${BASE_URL}/api/seasons/${SEASON_ID}/auto-populate-teams" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"teamCount\": ${TEAM_COUNT}}" \
  -w "\n\nHTTP Status: %{http_code}\n" \
  | jq '.' 2>/dev/null || cat

echo ""
echo "✅ Done!"

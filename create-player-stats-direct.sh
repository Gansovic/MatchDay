#!/bin/bash

echo "🚀 Creating player_stats table directly via Supabase API..."

# Supabase configuration
SUPABASE_URL="https://twkipeacdamypppxmmhe.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3a2lwZWFjZGFteXBwcHhtbWhlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTMwMzU5MiwiZXhwIjoyMDcwODc5NTkyfQ.ofH3TT43tYwpz5tIYfvrt_XvjW84OBC8cBFu5oCyKFg"

echo "📋 Step 1: Insert sample player_stats records directly..."

# Create sample player stats records for player@matchday.com
# First, get the user ID
USER_ID=$(curl -s -X GET "$SUPABASE_URL/rest/v1/users?email=eq.player@matchday.com&select=id" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" | jq -r '.[0].id')

echo "Found user ID: $USER_ID"

# Get team IDs for this user
TEAM_IDS=$(curl -s -X GET "$SUPABASE_URL/rest/v1/team_members?user_id=eq.$USER_ID&is_active=eq.true&select=team_id" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" | jq -r '.[].team_id')

echo "Found team IDs: $TEAM_IDS"

# Create matches first (try inserting)
echo "📋 Step 2: Create sample matches..."
curl -s -X POST "$SUPABASE_URL/rest/v1/matches" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "home_team_id": "26122240-4346-444a-9e24-320bbeac893b",
    "away_team_id": "39a9f0fb-517b-4f34-934e-9a280d206989",
    "match_date": "2024-12-01T15:00:00Z",
    "status": "completed",
    "home_score": 3,
    "away_score": 2
  }' | jq .

echo ""
echo "✅ Sample data insertion attempted!"
echo "🔄 Now check your dashboard - if player_stats table exists, data should be visible."
echo "📊 Dashboard URL: http://localhost:3003/dashboard"
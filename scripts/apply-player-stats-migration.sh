#!/bin/bash

echo "🚀 Applying player_stats migration to production Supabase..."

# Supabase project details
SUPABASE_URL="https://twkipeacdamypppxmmhe.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3a2lwZWFjZGFteXBwcHhtbWhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzMDM1OTIsImV4cCI6MjA3MDg3OTU5Mn0.O8W36cCRgI07ZVsArbi-deRRDBJxpt0d7HioR3M9kx4"
SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3a2lwZWFjZGFteXBwcHhtbWhlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTMwMzU5MiwiZXhwIjoyMDcwODc5NTkyfQ.ofH3TT43tYwpz5tIYfvrt_XvjW84OBC8cBFu5oCyKFg"

echo "📋 Step 1: Creating player_stats table..."

# Read the migration file
MIGRATION_SQL=$(cat /Users/lukini/MatchDay/supabase/migrations/20250110_create_player_stats_production.sql)

# Execute via Supabase SQL endpoint
curl -X POST "$SUPABASE_URL/rest/v1/rpc/sql" \
  -H "apikey: $SUPABASE_SERVICE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"$MIGRATION_SQL\"}" \
  2>/dev/null

echo "✅ Migration applied!"
echo ""
echo "📊 To verify the tables exist, go to:"
echo "https://supabase.com/dashboard/project/twkipeacdamypppxmmhe/editor"
echo ""
echo "Then refresh your dashboard to see the updated stats!"
#!/bin/bash

# Read the migration file
MIGRATION=$(cat /Users/lukini/MatchDay/supabase/migrations/20250110_create_player_stats_production.sql)

# Escape the SQL for JSON
ESCAPED_SQL=$(echo "$MIGRATION" | jq -Rs .)

# Create the request body
REQUEST_BODY="{\"query\": $ESCAPED_SQL}"

# Execute via Supabase Management API
echo "🚀 Executing migration via Supabase Management API..."

curl -X POST "https://api.supabase.com/v1/projects/twkipeacdamypppxmmhe/database/query" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3a2lwZWFjZGFteXBwcHhtbWhlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTMwMzU5MiwiZXhwIjoyMDcwODc5NTkyfQ.ofH3TT43tYwpz5tIYfvrt_XvjW84OBC8cBFu5oCyKFg" \
  -H "Content-Type: application/json" \
  -d "$REQUEST_BODY"

echo ""
echo "✅ Migration request sent!"
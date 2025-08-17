#!/bin/bash

# Apply team independence migration to Supabase database
# This script runs the migration to make teams independent from leagues

echo "🚀 Applying team independence migration..."

# Database connection details
DB_HOST="localhost"
DB_PORT="54322"
DB_NAME="postgres"
DB_USER="postgres"
DB_PASSWORD="postgres"

# Migration file path
MIGRATION_FILE="../supabase/migrations/20250817000000_make_teams_independent_from_leagues.sql"

# Check if migration file exists
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Migration file not found: $MIGRATION_FILE"
    exit 1
fi

echo "📝 Running migration: $(basename $MIGRATION_FILE)"

# Apply the migration using psql
PGPASSWORD=$DB_PASSWORD psql \
    -h $DB_HOST \
    -p $DB_PORT \
    -U $DB_USER \
    -d $DB_NAME \
    -f $MIGRATION_FILE \
    -v ON_ERROR_STOP=1

if [ $? -eq 0 ]; then
    echo "✅ Migration applied successfully!"
    
    # Show orphaned teams if any exist
    echo ""
    echo "📊 Checking for orphaned teams..."
    PGPASSWORD=$DB_PASSWORD psql \
        -h $DB_HOST \
        -p $DB_PORT \
        -U $DB_USER \
        -d $DB_NAME \
        -c "SELECT id, name, previous_league_name, is_archived FROM teams WHERE league_id IS NULL;"
else
    echo "❌ Migration failed! Please check the error messages above."
    exit 1
fi

echo ""
echo "🎉 Team independence migration complete!"
echo ""
echo "Summary of changes:"
echo "1. Teams now use ON DELETE SET NULL instead of CASCADE for league_id"
echo "2. Added is_archived flag for team management"
echo "3. Added previous_league_name to preserve league context"
echo "4. Created orphaned_teams view for easier management"
echo "5. Added helper functions for reassigning orphaned teams"
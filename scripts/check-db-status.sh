#!/bin/bash

# Check which database both MatchDay apps are currently using

echo "🔍 Checking current database configuration for both apps..."
echo ""

# Function to check database URL from .env.local file
check_db_config() {
    local app_name="$1"
    local env_file="$2"
    
    if [[ -f "$env_file" ]]; then
        local url=$(grep "^NEXT_PUBLIC_SUPABASE_URL=" "$env_file" | cut -d'=' -f2)
        
        echo "📱 $app_name:"
        if [[ "$url" == *"localhost"* || "$url" == *"127.0.0.1"* ]]; then
            echo "   🏠 Local Database ($url)"
        elif [[ "$url" == *".supabase.co"* ]]; then
            echo "   ☁️  Production Database ($url)"
        else
            echo "   ❓ Unknown Database ($url)"
        fi
    else
        echo "📱 $app_name:"
        echo "   ❌ No .env.local file found at $env_file"
    fi
    echo ""
}

# Check both apps
check_db_config "Main App" "/Users/lukini/MatchDay/.env.local"
check_db_config "Admin App" "/Users/lukini/matchday-admin/.env.local"

# Check if they match
main_url=$(grep "^NEXT_PUBLIC_SUPABASE_URL=" "/Users/lukini/MatchDay/.env.local" 2>/dev/null | cut -d'=' -f2)
admin_url=$(grep "^NEXT_PUBLIC_SUPABASE_URL=" "/Users/lukini/matchday-admin/.env.local" 2>/dev/null | cut -d'=' -f2)

if [[ "$main_url" == "$admin_url" ]]; then
    echo "✅ Both apps are using the SAME database - No confusion!"
else
    echo "⚠️  WARNING: Apps are using DIFFERENT databases!"
    echo "   Main App: $main_url"
    echo "   Admin App: $admin_url"
    echo ""
    echo "To fix this, run:"
    echo "   ./scripts/use-local-db.sh      (for local development)"
    echo "   ./scripts/use-production-db.sh (for production data)"
fi

echo ""
echo "Available commands:"
echo "  ./scripts/use-local-db.sh      - Switch both apps to local database"
echo "  ./scripts/use-production-db.sh - Switch both apps to production database"
echo "  ./scripts/check-db-status.sh   - Check current status (this script)"
#!/bin/bash

# Switch both MatchDay apps to use PRODUCTION database
# This ensures both main app and admin app use the same production environment

echo "🔄 Switching both apps to PRODUCTION database..."
echo "⚠️  WARNING: This will connect both apps to LIVE PRODUCTION DATA!"
read -p "Are you sure? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelled"
    exit 1
fi

# Update main app .env.local
echo "Updating main app..."
sed -i '' 's/^# NEXT_PUBLIC_SUPABASE_URL=https:\/\/twkipeacdamypppxmmhe.supabase.co/NEXT_PUBLIC_SUPABASE_URL=https:\/\/twkipeacdamypppxmmhe.supabase.co/' /Users/lukini/MatchDay/.env.local
sed -i '' 's/^# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3a2lwZWFjZGFteXBwcHhtbWhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzMDM1OTIsImV4cCI6MjA3MDg3OTU5Mn0.O8W36cCRgI07ZVsArbi-deRRDBJxpt0d7HioR3M9kx4/NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3a2lwZWFjZGFteXBwcHhtbWhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzMDM1OTIsImV4cCI6MjA3MDg3OTU5Mn0.O8W36cCRgI07ZVsArbi-deRRDBJxpt0d7HioR3M9kx4/' /Users/lukini/MatchDay/.env.local
sed -i '' 's/^# SUPABASE_SERVICE_ROLE_KEY=/SUPABASE_SERVICE_ROLE_KEY=/' /Users/lukini/MatchDay/.env.local
sed -i '' 's/^NEXT_PUBLIC_SUPABASE_URL=http:\/\/127.0.0.1:54321/#&/' /Users/lukini/MatchDay/.env.local
sed -i '' 's/^NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3a2lwZWFjZGFteXBwcHhtbWhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzMDM1OTIsImV4cCI6MjA3MDg3OTU5Mn0.O8W36cCRgI07ZVsArbi-deRRDBJxpt0d7HioR3M9kx4/#&/' /Users/lukini/MatchDay/.env.local

# Update admin app .env.local
echo "Updating admin app..."
sed -i '' 's/^# NEXT_PUBLIC_SUPABASE_URL=https:\/\/twkipeacdamypppxmmhe.supabase.co/NEXT_PUBLIC_SUPABASE_URL=https:\/\/twkipeacdamypppxmmhe.supabase.co/' /Users/lukini/matchday-admin/.env.local
sed -i '' 's/^# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3a2lwZWFjZGFteXBwcHhtbWhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzMDM1OTIsImV4cCI6MjA3MDg3OTU5Mn0.O8W36cCRgI07ZVsArbi-deRRDBJxpt0d7HioR3M9kx4/NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3a2lwZWFjZGFteXBwcHhtbWhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzMDM1OTIsImV4cCI6MjA3MDg3OTU5Mn0.O8W36cCRgI07ZVsArbi-deRRDBJxpt0d7HioR3M9kx4/' /Users/lukini/matchday-admin/.env.local
sed -i '' 's/^# SUPABASE_SERVICE_ROLE_KEY=/SUPABASE_SERVICE_ROLE_KEY=/' /Users/lukini/matchday-admin/.env.local
sed -i '' 's/^NEXT_PUBLIC_SUPABASE_URL=http:\/\/127.0.0.1:54321/#&/' /Users/lukini/matchday-admin/.env.local
sed -i '' 's/^NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3a2lwZWFjZGFteXBwcHhtbWhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzMDM1OTIsImV4cCI6MjA3MDg3OTU5Mn0.O8W36cCRgI07ZVsArbi-deRRDBJxpt0d7HioR3M9kx4/#&/' /Users/lukini/matchday-admin/.env.local

echo "✅ Both apps now configured for PRODUCTION database"
echo "🔴 WARNING: Both apps are now using LIVE PRODUCTION DATA!"
echo "🔄 You may need to restart your development servers"
echo ""
echo "To check: Both apps should show ☁️  Production Database in the environment indicator"
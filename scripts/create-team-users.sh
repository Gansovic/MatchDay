#!/bin/bash

# Script to create team management users in current Supabase system
# These users are for team assignments, not for login

echo "🔧 Creating team management users in current Supabase system..."

# Use same Supabase configuration as the working system
SUPABASE_URL="https://twkipeacdamypppxmmhe.supabase.co"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3a2lwZWFjZGFteXBwcHhtbWhlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTMwMzU5MiwiZXhwIjoyMDcwODc5NTkyfQ.ofH3TT43tYwpz5tIYfvrt_XvjW84OBC8cBFu5oCyKFg"

# Team users to create (email:password:display_name:role)
declare -a TEAM_USERS=(
  "teamuser1@matchday.com:simple123:Team User 1:player"
  "teamuser2@matchday.com:simple123:Team User 2:player"
)

echo "📍 Using Supabase Cloud: $SUPABASE_URL"
echo ""

# Function to create a team user
create_team_user() {
  local user_data=$1
  IFS=':' read -r email password display_name role <<< "$user_data"
  
  echo "👤 Creating team user: $email"
  
  response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST "${SUPABASE_URL}/auth/v1/admin/users" \
    -H "Content-Type: application/json" \
    -H "apikey: ${SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
    -d "{
      \"email\": \"$email\",
      \"password\": \"$password\",
      \"email_confirm\": true,
      \"user_metadata\": {
        \"full_name\": \"$display_name\",
        \"display_name\": \"$display_name\",
        \"role\": \"$role\"
      }
    }")
  
  # Extract HTTP status code
  http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
  body=$(echo $response | sed -e 's/HTTPSTATUS:.*//g')
  
  if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
    echo "   ✅ Success: Team user $email created and confirmed"
    
    # Extract user ID for profile creation
    user_id=$(echo "$body" | jq -r '.id')
    echo "   🆔 User ID: $user_id"
    
    # Create user profile (this might fail if profile already exists, which is OK)
    echo "   📝 Creating user profile..."
    profile_response=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/user_profiles" \
      -H "Content-Type: application/json" \
      -H "apikey: ${SERVICE_ROLE_KEY}" \
      -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
      -H "Prefer: return=minimal" \
      -d "{
        \"id\": \"$user_id\",
        \"display_name\": \"$display_name\",
        \"full_name\": \"$display_name\",
        \"role\": \"$role\",
        \"created_at\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
        \"updated_at\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
      }")
    
    echo "   📝 Profile creation attempted (may already exist)"
    
  elif [ "$http_code" -eq 422 ] && (echo "$body" | grep -q "already registered" || echo "$body" | grep -q "email_exists"); then
    echo "   ℹ️  Info: User $email already exists"
  else
    echo "   ❌ Error: HTTP $http_code"
    echo "   📄 Response: $body"
  fi
  
  echo ""
}

# Create all team users
for user_data in "${TEAM_USERS[@]}"; do
  create_team_user "$user_data"
  sleep 1  # Small delay between requests
done

echo "🎉 Team user creation completed!"
echo ""
echo "📋 Created team management users:"
echo "   👤 teamuser1@matchday.com (Team User 1)"
echo "   👤 teamuser2@matchday.com (Team User 2)"
echo ""
echo "💡 These users are for team assignments only - not for login testing"
echo "🔗 Continue using knezevicoluka@gmail.com for actual login"
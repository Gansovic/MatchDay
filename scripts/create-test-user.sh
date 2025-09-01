#!/bin/bash

# Script to create test users in Supabase Cloud Auth
# Updated to work with cloud Supabase instance

echo "🔧 Creating test users in Supabase Cloud Auth..."

# Supabase Cloud Configuration
SUPABASE_URL="https://twkipeacdamypppxmmhe.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3a2lwZWFjZGFteXBwcHhtbWhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzMDM1OTIsImV4cCI6MjA3MDg3OTU5Mn0.O8W36cCRgI07ZVsArbi-deRRDBJxpt0d7HioR3M9kx4"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3a2lwZWFjZGFteXBwcHhtbWhlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTMwMzU5MiwiZXhwIjoyMDcwODc5NTkyfQ.ofH3TT43tYwpz5tIYfvrt_XvjW84OBC8cBFu5oCyKFg"

# Array of test users to create
declare -a TEST_USERS=(
  "player@matchday.com:player123!:Player User:player"
  "admin@matchday.com:admin123!:Admin User:admin" 
  "captain@matchday.com:admin123!:Team Captain:captain"
  "member@matchday.com:admin123!:Team Member:player"
)

echo "📍 Using Supabase Cloud: $SUPABASE_URL"
echo ""

# Function to create a single user with admin API (bypasses email confirmation)
create_user() {
  local user_data=$1
  IFS=':' read -r email password full_name role <<< "$user_data"
  
  echo "👤 Creating user: $email ($role)"
  
  response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST "${SUPABASE_URL}/auth/v1/admin/users" \
    -H "Content-Type: application/json" \
    -H "apikey: ${SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
    -d "{
      \"email\": \"$email\",
      \"password\": \"$password\",
      \"email_confirm\": true,
      \"user_metadata\": {
        \"full_name\": \"$full_name\",
        \"display_name\": \"$full_name\",
        \"role\": \"$role\"
      }
    }")
  
  # Extract HTTP status code
  http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
  body=$(echo $response | sed -e 's/HTTPSTATUS:.*//g')
  
  if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
    echo "   ✅ Success: User $email created and confirmed"
  elif [ "$http_code" -eq 422 ] && (echo "$body" | grep -q "already registered" || echo "$body" | grep -q "email_exists"); then
    echo "   ℹ️  Info: User $email already exists - attempting to confirm..."
    confirm_existing_user "$email"
  else
    echo "   ❌ Error: HTTP $http_code"
    echo "   📄 Response: $body"
  fi
  
  echo ""
}

# Function to confirm existing unconfirmed users
confirm_existing_user() {
  local email=$1
  
  echo "   🔧 Attempting to confirm existing user: $email"
  
  # Get user by email to find their ID
  echo "   🔍 Fetching user data for: $email"
  user_response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X GET "${SUPABASE_URL}/auth/v1/admin/users" \
    -H "apikey: ${SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${SERVICE_ROLE_KEY}")
  
  user_http_code=$(echo $user_response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
  user_body=$(echo $user_response | sed -e 's/HTTPSTATUS:.*//g')
  
  echo "   📊 User fetch response - HTTP: $user_http_code"
  
  if [ "$user_http_code" -eq 200 ]; then
    # Find the specific user by email in the response
    user_data=$(echo "$user_body" | jq -r ".users[] | select(.email == \"$email\")")
    
    if [ -n "$user_data" ] && [ "$user_data" != "null" ]; then
      user_id=$(echo "$user_data" | jq -r '.id')
      email_confirmed=$(echo "$user_data" | jq -r '.email_confirmed_at')
      
      echo "   📄 Found user data for $email"
      echo "   📧 Current email_confirmed_at: $email_confirmed"
    else
      echo "   ❌ No user found with email: $email"
      return
    fi
    
    echo "   🆔 Extracted user ID: $user_id"
    
    if [ -n "$user_id" ] && [ "$user_id" != "null" ]; then
      # Update user to confirm email
      echo "   🔄 Updating user $user_id to confirm email..."
      confirm_response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X PUT "${SUPABASE_URL}/auth/v1/admin/users/${user_id}" \
        -H "Content-Type: application/json" \
        -H "apikey: ${SERVICE_ROLE_KEY}" \
        -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
        -d "{\"email_confirm\": true}")
      
      confirm_http_code=$(echo $confirm_response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
      confirm_body=$(echo $confirm_response | sed -e 's/HTTPSTATUS:.*//g')
      
      echo "   📊 Confirm response - HTTP: $confirm_http_code"
      echo "   📄 Confirm body: $confirm_body"
      
      if [ "$confirm_http_code" -eq 200 ]; then
        echo "   ✅ Success: User $email confirmed"
      else
        echo "   ❌ Failed to confirm user $email - HTTP $confirm_http_code"
      fi
    else
      echo "   ❌ Could not extract user ID for $email"
    fi
  else
    echo "   ❌ Could not find user $email - HTTP $user_http_code"
  fi
}

# Create all test users
for user_data in "${TEST_USERS[@]}"; do
  create_user "$user_data"
  sleep 1  # Small delay between requests
done

echo "🎉 Test user creation completed!"
echo ""
echo "📋 Available test accounts:"
echo "   👤 player@matchday.com / player123!"
echo "   🛡️  admin@matchday.com / admin123!" 
echo "   👨‍💼 captain@matchday.com / admin123!"
echo "   👩‍💼 member@matchday.com / admin123!"
echo ""
echo "🌐 Access dev login at: http://localhost:3000/dev-login"
echo "🔗 Or regular login at: http://localhost:3000/auth/login"
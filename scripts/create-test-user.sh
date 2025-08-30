#!/bin/bash

# Script to create a test user directly in Supabase Auth (GoTrue)

echo "🔧 Creating test user in Supabase Auth..."

# Test user credentials
EMAIL="admin@matchday.com"
PASSWORD="admin123"

# Create user using GoTrue admin API
echo "Creating user: $EMAIL"

# First, let's try to sign up the user
curl -X POST "http://localhost:8000/auth/v1/signup" \
  -H "Content-Type: application/json" \
  -H "apikey: wmIL9fNxipY7cwMtkAA6TGKvIB17LNZweLAlnttuyvc=" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\",
    \"data\": {
      \"full_name\": \"Admin User\",
      \"role\": \"admin\"
    }
  }"

echo ""
echo "✅ User creation attempted. Now try logging in with:"
echo "   Email: $EMAIL"
echo "   Password: $PASSWORD"
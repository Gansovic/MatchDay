#!/bin/bash

# Script to fix Kong CORS configuration
# This ensures Kong properly applies CORS settings including X-Client-Info header

echo "🔧 Fixing Kong CORS configuration..."

# Check if Kong container is running
if ! docker ps | grep -q kong; then
    echo "❌ Kong container is not running. Please start your Supabase stack first."
    exit 1
fi

# Get Kong container name
KONG_CONTAINER=$(docker ps --format "table {{.Names}}" | grep kong | head -1)

if [ -z "$KONG_CONTAINER" ]; then
    echo "❌ Could not find Kong container"
    exit 1
fi

echo "📦 Found Kong container: $KONG_CONTAINER"

# Clear browser cache warning
echo ""
echo "⚠️  IMPORTANT: Clear your browser cache to remove cached CORS responses!"
echo "   Chrome/Edge: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows/Linux)"
echo "   Safari: Cmd+Option+E then Cmd+R"
echo "   Firefox: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows/Linux)"
echo ""

# Reload Kong configuration
echo "🔄 Reloading Kong configuration..."
docker exec $KONG_CONTAINER kong reload

# Verify CORS configuration
echo "✅ Verifying CORS configuration..."
curl -s -X OPTIONS "http://localhost:8000/auth/v1/token?grant_type=password" \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: X-Client-Info,Content-Type,Authorization,apikey" \
  -I | grep -i "access-control-allow-headers"

echo ""
echo "✅ Kong CORS configuration updated!"
echo ""
echo "Next steps:"
echo "1. Clear your browser cache (very important!)"
echo "2. Restart your Next.js dev server: npm run dev"
echo "3. Try logging in again"
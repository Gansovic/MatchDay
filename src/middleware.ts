/**
 * Next.js Middleware for CORS handling
 * 
 * Allows cross-origin requests from the admin app to the player app APIs
 */

import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Handle CORS for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Get origin from environment or default to admin app
    const adminAppUrl = process.env.NEXT_PUBLIC_ADMIN_APP_URL || 'http://localhost:3002';
    
    // Create headers object
    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', adminAppUrl);
    headers.set('Access-Control-Allow-Credentials', 'true');
    headers.set('Access-Control-Allow-Methods', 'GET,DELETE,PATCH,POST,PUT,OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers });
    }

    // For non-preflight requests, continue to the API route with CORS headers
    const response = NextResponse.next();
    headers.forEach((value, key) => {
      response.headers.set(key, value);
    });
    
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
/**
 * Next.js Middleware for MatchDay Authentication
 * 
 * Handles route protection, authentication state, and redirects.
 * Optimized for Next.js 15 App Router with Supabase Auth.
 * 
 * Protected routes:
 * - /dashboard/* - Requires authentication
 * - /profile/* - Requires authentication
 * - /leagues/create - Requires authentication
 * - /admin/* - Requires admin role
 * 
 * Public routes:
 * - /auth/* - Authentication pages
 * - / - Landing page
 * - /leagues - Public league browsing
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Protected route patterns
const PROTECTED_ROUTES = [
  '/dashboard',
  '/profile',
  '/settings',
  '/leagues/create',
  '/leagues/manage',
  '/teams/create',
  '/teams/manage'
];

// Admin-only route patterns
const ADMIN_ROUTES = [
  '/admin'
];

// Public auth routes (redirect if already authenticated)
const AUTH_ROUTES = [
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password'
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  // Create Supabase client for server-side auth check
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });

  // Get auth token from cookies
  const token = request.cookies.get('sb-access-token')?.value;
  let user = null;

  if (token) {
    try {
      const { data: { user: authUser }, error } = await supabase.auth.getUser(token);
      if (!error && authUser) {
        user = authUser;
      }
    } catch (error) {
      // Token is invalid, user will be null
      console.warn('Invalid auth token:', error);
    }
  }

  // Check if current path is protected
  const isProtectedRoute = PROTECTED_ROUTES.some(route => 
    pathname.startsWith(route)
  );
  
  const isAdminRoute = ADMIN_ROUTES.some(route => 
    pathname.startsWith(route)
  );
  
  const isAuthRoute = AUTH_ROUTES.some(route => 
    pathname.startsWith(route)
  );

  // Handle protected routes
  if (isProtectedRoute || isAdminRoute) {
    if (!user) {
      // Redirect to login with return URL
      const returnUrl = encodeURIComponent(pathname + request.nextUrl.search);
      return NextResponse.redirect(
        new URL(`/auth/login?returnUrl=${returnUrl}`, request.url)
      );
    }

    // Check admin permissions for admin routes
    if (isAdminRoute) {
      const isAdmin = user.user_metadata?.role === 'admin';
      if (!isAdmin) {
        // Redirect to dashboard with access denied message
        return NextResponse.redirect(
          new URL('/dashboard?error=access_denied', request.url)
        );
      }
    }
  }

  // Handle auth routes (redirect if already authenticated)
  if (isAuthRoute && user) {
    // Check for return URL
    const returnUrl = request.nextUrl.searchParams.get('returnUrl');
    if (returnUrl) {
      try {
        // Validate the return URL is from the same origin
        const returnUrlObj = new URL(returnUrl, request.url);
        if (returnUrlObj.origin === request.nextUrl.origin) {
          return NextResponse.redirect(returnUrlObj);
        }
      } catch {
        // Invalid return URL, fallback to dashboard
      }
    }
    
    // Default redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Handle auth callback
  if (pathname === '/auth/callback') {
    const code = request.nextUrl.searchParams.get('code');
    
    if (code) {
      try {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        
        if (error) {
          // Redirect to login with error
          return NextResponse.redirect(
            new URL('/auth/login?error=callback_error', request.url)
          );
        }

        // Check for return URL in state
        const returnUrl = request.nextUrl.searchParams.get('state');
        if (returnUrl) {
          try {
            const returnUrlObj = new URL(returnUrl, request.url);
            if (returnUrlObj.origin === request.nextUrl.origin) {
              return NextResponse.redirect(returnUrlObj);
            }
          } catch {
            // Invalid return URL, fallback to dashboard
          }
        }

        // Successful callback, redirect to dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url));
      } catch (error) {
        console.error('Auth callback error:', error);
        return NextResponse.redirect(
          new URL('/auth/login?error=callback_error', request.url)
        );
      }
    }
  }

  // Add auth headers for client-side use
  const response = NextResponse.next();
  
  if (user) {
    response.headers.set('x-user-id', user.id);
    response.headers.set('x-user-email', user.email || '');
    response.headers.set('x-user-role', user.user_metadata?.role || 'user');
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
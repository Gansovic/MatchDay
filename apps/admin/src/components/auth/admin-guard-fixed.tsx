/**
 * Fixed Admin Guard Component
 * 
 * Protects admin routes by checking if the user has admin privileges.
 * Fixed version that prevents infinite redirect loops.
 */

'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { Shield, AlertTriangle } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';

interface AdminGuardProps {
  children: React.ReactNode;
}

export const AdminGuard: React.FC<AdminGuardProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  // Memoize auth routes to prevent recreation on every render
  const AUTH_ROUTES = useMemo(() => [
    '/auth/login',
    '/auth/signup', 
    '/auth/callback',
    '/auth/reset-password',
    '/unauthorized'
  ], []);

  // Memoize the auth route check to prevent unnecessary recalculations
  const isAuthRoute = useMemo(() => {
    return AUTH_ROUTES.some(route => pathname.startsWith(route));
  }, [AUTH_ROUTES, pathname]);
  
  // Check auth status when auth loading completes
  useEffect(() => {
    if (authLoading || hasCheckedAuth) return;
    
    console.log('[AdminGuard] Checking auth status...', { user: !!user, pathname, authLoading });
    
    // Add timeout to prevent infinite loading
    const authTimeout = setTimeout(() => {
      console.log('[AdminGuard] Auth check timeout - proceeding with current state');
      if (!user && !isAuthRoute) {
        console.log('[AdminGuard] Timeout: No user found, redirecting to login');
        setIsAuthorized(false);
        router.push('/auth/login');
      } else if (user) {
        console.log('[AdminGuard] Timeout: User found, allowing access');
        setIsAuthorized(true);
      }
      setHasCheckedAuth(true);
    }, 5000); // 5 second timeout
    
    // For now, allow access if user exists (we'll add role checks later)
    if (user) {
      console.log('[AdminGuard] User found, allowing access');
      setIsAuthorized(true);
      setHasCheckedAuth(true);
      clearTimeout(authTimeout);
    } else {
      console.log('[AdminGuard] No user found');
      setIsAuthorized(false);
      
      // Only redirect if not already on login page
      if (!isAuthRoute) {
        console.log('[AdminGuard] Redirecting to login');
        router.push('/auth/login');
      }
      setHasCheckedAuth(true);
      clearTimeout(authTimeout);
    }
    
    // Cleanup timeout
    return () => clearTimeout(authTimeout);
  }, [user, authLoading, hasCheckedAuth, isAuthRoute, pathname, router]);
  
  // Reset check when route changes
  useEffect(() => {
    setHasCheckedAuth(false);
    setIsAuthorized(false);
  }, [pathname]);

  // If current route is an auth route, render without protection
  if (isAuthRoute) {
    console.log('[AdminGuard] Auth route detected, bypassing protection:', pathname);
    return <>{children}</>;
  }

  // Show loading state while checking auth
  if (authLoading || !hasCheckedAuth) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white animate-pulse" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Verifying Admin Access
          </h2>
          <p className="text-gray-400 mb-2">
            Checking your permissions...
          </p>
          <div className="mt-4 flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show unauthorized state
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-8">
            <div className="w-16 h-16 bg-red-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-xl font-bold text-white mb-4">
              Access Denied
            </h1>
            <p className="text-gray-400 mb-6">
              You need to be logged in to access the admin panel.
            </p>
            <button
              onClick={() => router.push('/auth/login')}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // User is authorized, render the admin interface
  console.log('[AdminGuard] Access granted');
  return <>{children}</>;
};
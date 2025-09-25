/**
 * Admin Guard Component
 * 
 * Protects admin routes by checking if the user has admin privileges.
 * Immediately redirects unauthorized users to login without loading screens.
 * Excludes auth routes to prevent infinite redirect loops.
 */

'use client';

import React, { useMemo } from 'react';
import { Shield, AlertTriangle } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useAdminAccess } from '@/lib/hooks/use-role-guard';

interface AdminGuardProps {
  children: React.ReactNode;
}

export const AdminGuard: React.FC<AdminGuardProps> = ({ children }) => {
  const pathname = usePathname();
  
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
  
  // ALWAYS call hooks first to satisfy React's rules of hooks
  const { isLoading, hasAccess, error } = useAdminAccess();
  
  // If current route is an auth route, render without protection
  if (isAuthRoute) {
    return <>{children}</>;
  }

  // For non-auth routes, apply admin protection

  // Show loading state only while actively checking auth (max 3 seconds)
  if (isLoading) {
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
          <p className="text-xs text-gray-500">
            This should complete within 3 seconds
          </p>
          <div className="mt-4 flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-8">
            <div className="w-16 h-16 bg-red-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-xl font-bold text-white mb-4">
              Authentication Error
            </h1>
            <p className="text-gray-400 mb-6">
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If no access, the redirect happens in the hook - return null to prevent rendering
  if (!hasAccess) {
    return null;
  }

  // User has admin access, render the admin interface
  return <>{children}</>;
};
/**
 * Admin Guard Component
 * 
 * Simple admin route protection using direct user role checking.
 * Redirects unauthorized users to login immediately.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';

interface AdminGuardProps {
  children: React.ReactNode;
}

export const AdminGuard: React.FC<AdminGuardProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [hasRedirected, setHasRedirected] = useState(false);
  
  // Skip auth protection for auth routes to prevent infinite redirects
  const isAuthRoute = pathname.startsWith('/auth') || pathname.startsWith('/unauthorized');

  useEffect(() => {
    // Don't redirect if we're already on an auth route or already redirected
    if (isAuthRoute || hasRedirected) {
      return;
    }

    // Wait for auth loading to complete
    if (isLoading) {
      return;
    }

    // No user - redirect to login
    if (!user) {
      setHasRedirected(true);
      router.push('/auth/login');
      return;
    }

    // Check if user has league admin role (simple role check)
    const userRole = user.app_metadata?.role || user.user_metadata?.role;
    const isAdmin = userRole === 'league_admin';
    
    if (!isAdmin) {
      setHasRedirected(true);
      router.push('/auth/login');
      return;
    }

    // User is authorized admin - no action needed
  }, [user, isLoading, isAuthRoute, hasRedirected, router]);

  // Always render auth routes
  if (isAuthRoute) {
    return <>{children}</>;
  }

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto mb-2"></div>
          <p className="text-gray-400 text-sm">Checking access...</p>
        </div>
      </div>
    );
  }

  // Don't render anything while redirecting
  if (hasRedirected || !user) {
    return null;
  }

  // Check role again before rendering (simple check)
  const userRole = user.app_metadata?.role || user.user_metadata?.role;
  const isAdmin = userRole === 'league_admin';
  
  if (!isAdmin) {
    return null;
  }

  // User is authorized - render admin interface
  return <>{children}</>;
};
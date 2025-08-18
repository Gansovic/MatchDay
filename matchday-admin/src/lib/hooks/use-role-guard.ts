/**
 * Role Guard Hook
 * 
 * Custom hook for protecting routes and components based on user roles.
 * Provides loading states and automatic redirects for unauthorized access.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RoleService, RoleCheckResult } from '@/lib/auth/role.service';
import { UserRole } from '@/lib/types/database.types';
import { useAuth } from '@/components/auth/auth-provider';

interface UseRoleGuardOptions {
  allowedRoles: UserRole[];
  redirectTo?: string;
  redirectOnUnauthorized?: boolean;
}

interface UseRoleGuardResult {
  isLoading: boolean;
  hasAccess: boolean;
  userRole: UserRole | null;
  error: string | null;
}

export function useRoleGuard({
  allowedRoles,
  redirectTo,
  redirectOnUnauthorized = true
}: UseRoleGuardOptions): UseRoleGuardResult {
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasRedirected, setHasRedirected] = useState(false);
  const [timeoutReached, setTimeoutReached] = useState(false);
  
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  // Convert allowedRoles array to stable string to prevent infinite re-renders
  const allowedRolesKey = allowedRoles.sort().join(',');

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let isCancelled = false;

    async function checkRole() {
      try {
        console.log('[RoleGuard] Starting role check...', { 
          user: !!user, 
          authLoading, 
          allowedRoles,
          timeoutReached 
        });
        
        setIsLoading(true);
        setError(null);

        // Set a maximum timeout of 3 seconds for role verification
        timeoutId = setTimeout(() => {
          if (!isCancelled) {
            console.warn('[RoleGuard] Role verification timeout reached - failing open for admin access');
            setTimeoutReached(true);
            setIsLoading(false);
            // For admin routes, fail open on timeout to prevent lockout
            if (allowedRoles.includes('league_admin') || allowedRoles.includes('app_admin')) {
              setHasAccess(true);
              setUserRole('league_admin'); // Assume admin access on timeout
            } else {
              setHasAccess(false);
            }
          }
        }, 3000);

        // Wait for auth to complete, but don't wait forever
        if (authLoading) {
          console.log('[RoleGuard] Waiting for auth to complete...');
          return;
        }

        // If no user, redirect immediately to login
        if (!user) {
          console.log('[RoleGuard] No user found, redirecting to login');
          clearTimeout(timeoutId);
          setHasAccess(false);
          setIsLoading(false);
          if (redirectOnUnauthorized && !hasRedirected) {
            setHasRedirected(true);
            window.location.href = '/auth/login';
          }
          return;
        }

        console.log('[RoleGuard] Checking user role...');
        const result: RoleCheckResult = await Promise.race([
          RoleService.hasRole(allowedRoles),
          new Promise<RoleCheckResult>((_, reject) => 
            setTimeout(() => reject(new Error('Role check timeout')), 2000)
          )
        ]);
        
        if (isCancelled) return;
        
        clearTimeout(timeoutId);
        console.log('[RoleGuard] Role check complete:', result);
        
        setHasAccess(result.hasAccess);
        setUserRole(result.userRole);
        setIsLoading(false);

        // Handle unauthorized access with immediate redirect
        if (!result.hasAccess && redirectOnUnauthorized && !hasRedirected) {
          setHasRedirected(true);
          const targetRedirect = redirectTo || result.redirectTo || '/unauthorized';
          console.log('[RoleGuard] Redirecting unauthorized user to:', targetRedirect);
          window.location.href = targetRedirect;
        }

      } catch (err) {
        if (isCancelled) return;
        
        clearTimeout(timeoutId);
        console.error('[RoleGuard] Error checking user role:', err);
        setError('Failed to verify user permissions');
        setIsLoading(false);
        
        // For admin routes, fail open on error to prevent lockout
        if (allowedRoles.includes('league_admin') || allowedRoles.includes('app_admin')) {
          console.warn('[RoleGuard] Role verification failed - failing open for admin access');
          setHasAccess(true);
          setUserRole('league_admin');
        } else {
          setHasAccess(false);
        }
      }
    }

    // Only run role check if we haven't timed out yet
    if (!timeoutReached) {
      checkRole();
    }

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [user, authLoading, allowedRolesKey, redirectTo, redirectOnUnauthorized, hasRedirected, timeoutReached]);

  return {
    isLoading,
    hasAccess,
    userRole,
    error
  };
}

/**
 * Hook specifically for player app access
 */
export function usePlayerAccess() {
  return useRoleGuard({
    allowedRoles: ['player', 'captain', 'admin', 'league_admin', 'app_admin'],
    redirectTo: '/auth/login'
  });
}

/**
 * Hook specifically for admin app access
 */
export function useAdminAccess() {
  // Use a stable reference to prevent infinite re-renders
  const allowedRoles = React.useMemo(() => ['league_admin', 'app_admin'] as UserRole[], []);
  
  return useRoleGuard({
    allowedRoles,
    redirectTo: '/auth/login',
    redirectOnUnauthorized: true  // Auto-redirect unauthorized users to login
  });
}

/**
 * Hook for team management access
 */
export function useTeamManagementAccess(teamId?: string) {
  const [canManage, setCanManage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    async function checkTeamAccess() {
      if (!teamId || !user) {
        setCanManage(false);
        setIsLoading(false);
        return;
      }

      try {
        const hasAccess = await RoleService.canManageTeam(teamId);
        setCanManage(hasAccess);
      } catch (error) {
        console.error('Error checking team management access:', error);
        setCanManage(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkTeamAccess();
  }, [teamId, user]);

  return { canManage, isLoading };
}

/**
 * Hook for league management access
 */
export function useLeagueManagementAccess(leagueId?: string) {
  const [canManage, setCanManage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    async function checkLeagueAccess() {
      if (!leagueId || !user) {
        setCanManage(false);
        setIsLoading(false);
        return;
      }

      try {
        const hasAccess = await RoleService.canManageLeague(leagueId);
        setCanManage(hasAccess);
      } catch (error) {
        console.error('Error checking league management access:', error);
        setCanManage(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkLeagueAccess();
  }, [leagueId, user]);

  return { canManage, isLoading };
}
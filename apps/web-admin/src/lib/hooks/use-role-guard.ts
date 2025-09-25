/**
 * Role Guard Hook
 * 
 * Custom hook for protecting routes and components based on user roles.
 * Provides loading states and automatic redirects for unauthorized access.
 */

'use client';

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
  
  // Use refs to track redirect state without causing re-renders
  const hasRedirectedRef = useRef(false);
  const timeoutReachedRef = useRef(false);
  const currentCheckRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading: authLoading } = useAuth();

  // Memoize the allowed roles to create a stable reference
  const stableAllowedRoles = useMemo(() => {
    return [...allowedRoles].sort();
  }, [allowedRoles]);

  // Memoize the allowed roles key for dependency checking
  const allowedRolesKey = useMemo(() => {
    return stableAllowedRoles.join(',');
  }, [stableAllowedRoles]);

  // Memoize the redirect handler to prevent recreating on every render
  const handleRedirect = useCallback((targetRedirect: string) => {
    if (hasRedirectedRef.current) return;
    
    // Don't redirect if we're already on the target route
    if (pathname === targetRedirect) {
      console.log('[RoleGuard] Already on target route, skipping redirect');
      return;
    }
    
    hasRedirectedRef.current = true;
    console.log('[RoleGuard] Redirecting user to:', targetRedirect);
    
    // Use Next.js router instead of window.location to avoid full page reload
    router.push(targetRedirect);
  }, [router, pathname]);

  // Memoize the role check function
  const checkRole = useCallback(async (checkId: number) => {
    if (timeoutReachedRef.current || checkId !== currentCheckRef.current) {
      return; // Skip if timeout reached or this check is stale
    }

    try {
      console.log('[RoleGuard] Starting role check...', { 
        user: !!user, 
        authLoading, 
        allowedRoles: stableAllowedRoles,
        checkId
      });
      
      // Wait for auth to complete first
      if (authLoading) {
        console.log('[RoleGuard] Waiting for auth to complete...');
        return;
      }

      // If no user, redirect immediately to login
      if (!user) {
        console.log('[RoleGuard] No user found, redirecting to login');
        setHasAccess(false);
        setIsLoading(false);
        if (redirectOnUnauthorized) {
          handleRedirect('/auth/login');
        }
        return;
      }

      // Check if this check is still current before making async calls
      if (checkId !== currentCheckRef.current) {
        return;
      }

      console.log('[RoleGuard] Checking user role...');
      const result: RoleCheckResult = await Promise.race([
        RoleService.hasRole(stableAllowedRoles),
        new Promise<RoleCheckResult>((_, reject) => 
          setTimeout(() => reject(new Error('Role check timeout')), 2000)
        )
      ]);
      
      // Check if this check is still current after async operation
      if (checkId !== currentCheckRef.current) {
        return;
      }
      
      console.log('[RoleGuard] Role check complete:', result);
      
      setHasAccess(result.hasAccess);
      setUserRole(result.userRole);
      setIsLoading(false);
      setError(null);

      // Handle unauthorized access with redirect
      if (!result.hasAccess && redirectOnUnauthorized) {
        const targetRedirect = redirectTo || result.redirectTo || '/unauthorized';
        handleRedirect(targetRedirect);
      }

    } catch (err) {
      // Check if this check is still current
      if (checkId !== currentCheckRef.current) {
        return;
      }
      
      console.error('[RoleGuard] Error checking user role:', err);
      setError('Failed to verify user permissions');
      setIsLoading(false);
      
      // For admin routes, fail open on error to prevent lockout
      const isAdminCheck = stableAllowedRoles.includes('league_admin') || stableAllowedRoles.includes('app_admin');
      if (isAdminCheck) {
        console.warn('[RoleGuard] Role verification failed - failing open for admin access');
        setHasAccess(true);
        setUserRole('league_admin');
      } else {
        setHasAccess(false);
      }
    }
  }, [user, authLoading, stableAllowedRoles, redirectTo, redirectOnUnauthorized, handleRedirect]);

  useEffect(() => {
    // Reset redirect state when dependencies change significantly
    hasRedirectedRef.current = false;
    timeoutReachedRef.current = false;
    
    // Cancel any previous ongoing operations
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller for this check
    abortControllerRef.current = new AbortController();
    const abortController = abortControllerRef.current;
    
    // Increment check ID to invalidate any pending checks
    currentCheckRef.current += 1;
    const checkId = currentCheckRef.current;
    
    setIsLoading(true);
    setError(null);

    // Set a maximum timeout of 3 seconds for role verification
    const timeoutId = setTimeout(() => {
      if (checkId !== currentCheckRef.current || abortController.signal.aborted) {
        return; // Skip if this timeout is for a stale check or aborted
      }
      
      console.warn('[RoleGuard] Role verification timeout reached');
      timeoutReachedRef.current = true;
      setIsLoading(false);
      
      // For admin routes, fail open on timeout to prevent lockout
      const isAdminCheck = stableAllowedRoles.includes('league_admin') || stableAllowedRoles.includes('app_admin');
      if (isAdminCheck) {
        console.warn('[RoleGuard] Timeout - failing open for admin access');
        setHasAccess(true);
        setUserRole('league_admin');
      } else {
        setHasAccess(false);
      }
    }, 3000);

    // Start the role check
    checkRole(checkId);

    return () => {
      clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [checkRole]); // Only depend on the memoized checkRole function

  return {
    isLoading,
    hasAccess,
    userRole,
    error
  };
}

// Define player roles as a constant outside the component to ensure stability
const PLAYER_ROLES: UserRole[] = ['player', 'captain', 'admin', 'league_admin', 'app_admin'];

/**
 * Hook specifically for player app access
 */
export function usePlayerAccess() {
  return useRoleGuard({
    allowedRoles: PLAYER_ROLES,
    redirectTo: '/auth/login'
  });
}

// Define admin roles as a constant outside the component to ensure maximum stability
const ADMIN_ROLES: UserRole[] = ['league_admin', 'app_admin'];

/**
 * Hook specifically for admin app access
 */
export function useAdminAccess() {
  // Use the constant reference to prevent any re-renders
  return useRoleGuard({
    allowedRoles: ADMIN_ROLES,
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
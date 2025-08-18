/**
 * Role Guard Hook
 * 
 * Custom hook for protecting routes and components based on user roles.
 * Provides loading states and automatic redirects for unauthorized access.
 */

'use client';

import { useEffect, useState } from 'react';
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
  
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    async function checkRole() {
      try {
        setIsLoading(true);
        setError(null);

        // Wait for auth to complete
        if (authLoading) {
          return;
        }

        // If no user, redirect to login
        if (!user) {
          if (redirectOnUnauthorized) {
            router.push('/auth/login');
          }
          setHasAccess(false);
          setIsLoading(false);
          return;
        }

        const result: RoleCheckResult = await RoleService.hasRole(allowedRoles);
        
        setHasAccess(result.hasAccess);
        setUserRole(result.userRole);

        // Handle unauthorized access
        if (!result.hasAccess && redirectOnUnauthorized) {
          const targetRedirect = redirectTo || result.redirectTo || '/unauthorized';
          router.push(targetRedirect);
        }

      } catch (err) {
        console.error('Error checking user role:', err);
        setError('Failed to verify user permissions');
        setHasAccess(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkRole();
  }, [user, authLoading, allowedRoles, redirectTo, redirectOnUnauthorized, router]);

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
  return useRoleGuard({
    allowedRoles: ['league_admin', 'app_admin'],
    redirectTo: '/unauthorized'
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
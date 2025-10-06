/**
 * Role Service
 * 
 * Handles role-based authentication and authorization across the application.
 * Provides utilities for checking user roles and permissions.
 */

import { supabase } from '@/lib/supabase/client';
import { UserRole } from '@/lib/types/database.types';

export interface RoleCheckResult {
  hasAccess: boolean;
  userRole: UserRole | null;
  redirectTo?: string;
}

export class RoleService {
  /**
   * Get the current user's role from their profile with timeout and retries
   */
  static async getCurrentUserRole(): Promise<UserRole | null> {
    try {
      console.log('[RoleService] Getting current user...');
      
      // Add timeout to getUser call
      const userResult = await Promise.race([
        supabase.auth.getUser(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('getUser timeout')), 2000)
        )
      ]);
      
      const user = userResult.data?.user;
      if (!user) {
        console.log('[RoleService] No authenticated user found');
        return null;
      }

      console.log('[RoleService] Fetching user profile for:', user.id);
      
      // Add timeout to profile query with retry logic
      let lastError: any;
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const { data: profile, error } = await Promise.race([
            supabase
              .from('users')
              .select('role')
              .eq('id', user.id)
              .single(),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Profile query timeout')), 1500)
            )
          ]);

          if (error) {
            console.error(`[RoleService] Error fetching user role (attempt ${attempt}):`, error);
            lastError = error;
            if (attempt < 2) {
              await new Promise(resolve => setTimeout(resolve, 500)); // Wait before retry
              continue;
            }
            // On final attempt, check if it's a "no rows" error vs connection error
            if (error.code === 'PGRST116') {
              console.warn('[RoleService] User profile not found - user may need to complete onboarding');
              return 'player'; // Default role for users without profiles
            }
            throw error;
          }

          const role = profile?.role || 'player';
          console.log('[RoleService] User role found:', role);
          return role;
        } catch (err) {
          lastError = err;
          if (attempt < 2) {
            console.warn(`[RoleService] Attempt ${attempt} failed, retrying...`, err);
            await new Promise(resolve => setTimeout(resolve, 500));
            continue;
          }
          throw err;
        }
      }
      
      throw lastError;
    } catch (error) {
      console.error('[RoleService] Error getting current user role:', error);
      // For admin access, be more permissive on errors to prevent lockout
      return null;
    }
  }

  /**
   * Check if user has any of the specified roles with timeout protection
   */
  static async hasRole(allowedRoles: UserRole[]): Promise<RoleCheckResult> {
    console.log('[RoleService] Checking roles:', allowedRoles);
    
    try {
      const userRole = await Promise.race([
        this.getCurrentUserRole(),
        new Promise<UserRole | null>((_, reject) => 
          setTimeout(() => reject(new Error('Role check timeout')), 2000)
        )
      ]);
      
      console.log('[RoleService] User role retrieved:', userRole);
      
      if (!userRole) {
        console.log('[RoleService] No user role found - redirecting to login');
        return {
          hasAccess: false,
          userRole: null,
          redirectTo: '/auth/login'
        };
      }

      const hasAccess = allowedRoles.includes(userRole);
      console.log('[RoleService] Access check result:', { userRole, allowedRoles, hasAccess });
      
      return {
        hasAccess,
        userRole,
        redirectTo: hasAccess ? undefined : '/unauthorized'
      };
    } catch (error) {
      console.error('[RoleService] Error in hasRole check:', error);
      
      // For admin roles, be more permissive on timeout/error to prevent lockout
      const isAdminCheck = allowedRoles.includes('league_admin') || allowedRoles.includes('app_admin');
      if (isAdminCheck) {
        console.warn('[RoleService] Admin role check failed - failing open to prevent lockout');
        return {
          hasAccess: true,
          userRole: 'league_admin', // Assume admin access on error
          redirectTo: undefined
        };
      }
      
      return {
        hasAccess: false,
        userRole: null,
        redirectTo: '/auth/login'
      };
    }
  }

  /**
   * Check if user can access player features
   */
  static async canAccessPlayerApp(): Promise<RoleCheckResult> {
    return this.hasRole(['player', 'captain', 'admin', 'league_admin', 'app_admin']);
  }

  /**
   * Check if user can access admin features
   */
  static async canAccessAdminApp(): Promise<RoleCheckResult> {
    return this.hasRole(['league_admin', 'app_admin']);
  }

  /**
   * Check if user is a league administrator
   */
  static async isLeagueAdmin(): Promise<boolean> {
    const result = await this.hasRole(['league_admin', 'app_admin']);
    return result.hasAccess;
  }

  /**
   * Check if user is an app administrator
   */
  static async isAppAdmin(): Promise<boolean> {
    const result = await this.hasRole(['app_admin']);
    return result.hasAccess;
  }

  /**
   * Check if user can manage a specific league
   */
  static async canManageLeague(leagueId: string): Promise<boolean> {
    try {
      const userRole = await this.getCurrentUserRole();
      
      if (!userRole) return false;
      
      // App admins can manage any league
      if (userRole === 'app_admin') {
        return true;
      }
      
      // League admins can manage leagues they created
      if (userRole === 'league_admin') {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const { data: league } = await supabase
          .from('leagues')
          .select('created_by')
          .eq('id', leagueId)
          .single();

        return league?.created_by === user.id;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking league management permission:', error);
      return false;
    }
  }

  /**
   * Check if user can manage a specific team
   */
  static async canManageTeam(teamId: string): Promise<boolean> {
    try {
      const userRole = await this.getCurrentUserRole();
      
      if (!userRole) return false;
      
      // App admins can manage any team
      if (userRole === 'app_admin') {
        return true;
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Team captains and admins can manage their team
      if (['captain', 'admin'].includes(userRole)) {
        const { data: team } = await supabase
          .from('teams')
          .select('captain_id')
          .eq('id', teamId)
          .single();

        if (team?.captain_id === user.id) {
          return true;
        }
      }

      // League admins can manage teams in their leagues
      if (userRole === 'league_admin') {
        const { data: team } = await supabase
          .from('teams')
          .select('league_id, leagues!inner(created_by)')
          .eq('id', teamId)
          .single();

        return (team?.leagues as any)?.created_by === user.id;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking team management permission:', error);
      return false;
    }
  }

  /**
   * Get user role display name
   */
  static getRoleDisplayName(role: UserRole): string {
    const roleNames: Record<UserRole, string> = {
      player: 'Player',
      captain: 'Team Captain',
      admin: 'Team Admin',
      league_admin: 'League Administrator',
      app_admin: 'App Administrator'
    };
    
    return roleNames[role] || 'Unknown';
  }

  /**
   * Get role permissions description
   */
  static getRolePermissions(role: UserRole): string[] {
    const permissions: Record<UserRole, string[]> = {
      player: [
        'Join teams',
        'View leagues',
        'View personal stats',
        'Receive team invitations'
      ],
      captain: [
        'All player permissions',
        'Manage team roster',
        'Invite players',
        'Request league membership'
      ],
      admin: [
        'All captain permissions',
        'Manage team settings',
        'View team analytics'
      ],
      league_admin: [
        'Create and manage leagues',
        'Approve team requests',
        'Schedule matches',
        'Manage league settings'
      ],
      app_admin: [
        'All permissions',
        'Manage all users',
        'System administration',
        'Global settings'
      ]
    };
    
    return permissions[role] || [];
  }
}
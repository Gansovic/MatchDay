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
   * Get the current user's role from their profile
   */
  static async getCurrentUserRole(): Promise<UserRole | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return null;
      }

      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        return null;
      }

      return profile?.role || null;
    } catch (error) {
      console.error('Error getting current user role:', error);
      return null;
    }
  }

  /**
   * Check if user has any of the specified roles
   */
  static async hasRole(allowedRoles: UserRole[]): Promise<RoleCheckResult> {
    const userRole = await this.getCurrentUserRole();
    
    if (!userRole) {
      return {
        hasAccess: false,
        userRole: null,
        redirectTo: '/auth/login'
      };
    }

    const hasAccess = allowedRoles.includes(userRole);
    
    return {
      hasAccess,
      userRole,
      redirectTo: hasAccess ? undefined : '/unauthorized'
    };
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

        return team?.leagues?.created_by === user.id;
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
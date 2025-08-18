/**
 * League Detail Service for MatchDay Admin
 * 
 * Handles comprehensive league-specific operations for admin dashboard:
 * - League detail information with real database connections
 * - Teams management using team_leagues junction table
 * - League statistics and standings
 * - Pending requests specific to a league
 * - Recent activity and metrics
 * 
 * Uses existing database architecture with multi-league support.
 */

import { supabase } from '@/lib/supabase/client';
import type {
  Database,
  League,
  ServiceResponse,
  ServiceError,
  TeamLeagueRequestWithDetails
} from '@/lib/types/database.types';

export interface LeagueTeam {
  team_id: string;
  team_name: string;
  team_color?: string;
  team_logo_url?: string;
  joined_at: string;
  is_active: boolean;
  member_count: number;
}

export interface LeagueStats {
  totalTeams: number;
  totalPlayers: number;
  totalMatches: number;
  completedMatches: number;
  avgPlayersPerTeam: number;
}

export interface LeagueActivity {
  id: string;
  type: 'team_joined' | 'request_approved' | 'match_scheduled' | 'team_left';
  description: string;
  timestamp: string;
  related_id?: string;
}

export interface LeagueDetailData {
  league: League;
  teams: LeagueTeam[];
  stats: LeagueStats;
  pendingRequests: TeamLeagueRequestWithDetails[];
  recentActivity: LeagueActivity[];
  standings?: Array<{
    position: number;
    team_id: string;
    team_name: string;
    games_played: number;
    wins: number;
    draws: number;
    losses: number;
    goals_for: number;
    goals_against: number;
    points: number;
  }>;
}

export class LeagueDetailService {
  private static instance: LeagueDetailService;
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  private constructor() {
    // Using the shared supabase client
  }

  static getInstance(): LeagueDetailService {
    if (!LeagueDetailService.instance) {
      LeagueDetailService.instance = new LeagueDetailService();
    }
    return LeagueDetailService.instance;
  }

  /**
   * Handle service errors consistently
   */
  private handleError(error: any, operation: string): ServiceError {
    console.error(`LeagueDetailService.${operation}:`, error);
    return {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'An unexpected error occurred',
      details: error.details || error,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Cache management utilities
   */
  private getCacheKey(operation: string, params: any): string {
    return `league_detail_service:${operation}:${JSON.stringify(params)}`;
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > cached.ttl * 1000) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data as T;
  }

  private setCache<T>(key: string, data: T, ttl = 300): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Get comprehensive league details for admin dashboard
   */
  async getLeagueDetails(
    leagueId: string,
    adminId?: string
  ): Promise<ServiceResponse<LeagueDetailData>> {
    try {
      const cacheKey = this.getCacheKey('getLeagueDetails', { leagueId });
      const cached = this.getFromCache<LeagueDetailData>(cacheKey);
      
      if (cached) {
        return { data: cached, error: null, success: true };
      }

      // Verify admin has access to this league
      if (adminId) {
        const accessCheck = await this.verifyAdminAccess(leagueId, adminId);
        if (!accessCheck.success) {
          return {
            data: null,
            error: accessCheck.error || { 
              code: 'ACCESS_DENIED', 
              message: 'You do not have permission to view this league',
              timestamp: new Date().toISOString()
            },
            success: false
          };
        }
      }

      // Get league basic information
      const { data: league, error: leagueError } = await supabase
        .from('leagues')
        .select('*')
        .eq('id', leagueId)
        .single();

      if (leagueError) {
        if (leagueError.code === 'PGRST116') {
          return {
            data: null,
            error: {
              code: 'LEAGUE_NOT_FOUND',
              message: 'League not found',
              timestamp: new Date().toISOString()
            },
            success: false
          };
        }
        throw leagueError;
      }

      // Get teams using the team_leagues junction table
      const teams = await this.getLeagueTeams(leagueId);
      if (!teams.success) {
        throw new Error(teams.error?.message || 'Failed to fetch league teams');
      }

      // Get league statistics
      const stats = await this.getLeagueStats(leagueId);
      if (!stats.success) {
        throw new Error(stats.error?.message || 'Failed to fetch league statistics');
      }

      // Get pending requests for this league
      const pendingRequests = await this.getLeaguePendingRequests(leagueId);
      if (!pendingRequests.success) {
        throw new Error(pendingRequests.error?.message || 'Failed to fetch pending requests');
      }

      // Get recent activity for this league
      const recentActivity = await this.getLeagueRecentActivity(leagueId);
      if (!recentActivity.success) {
        throw new Error(recentActivity.error?.message || 'Failed to fetch recent activity');
      }

      // Get league standings if teams exist
      let standings;
      if (teams.data && teams.data.length > 0) {
        const standingsResult = await this.getLeagueStandings(leagueId);
        standings = standingsResult.data || undefined;
      }

      const leagueDetailData: LeagueDetailData = {
        league,
        teams: teams.data || [],
        stats: stats.data || {
          totalTeams: 0,
          totalPlayers: 0,
          totalMatches: 0,
          completedMatches: 0,
          avgPlayersPerTeam: 0
        },
        pendingRequests: pendingRequests.data || [],
        recentActivity: recentActivity.data || [],
        standings
      };

      // Cache for 5 minutes
      this.setCache(cacheKey, leagueDetailData, 300);

      return { data: leagueDetailData, error: null, success: true };

    } catch (error) {
      return {
        data: null,
        error: this.handleError(error, 'getLeagueDetails'),
        success: false
      };
    }
  }

  /**
   * Verify admin has access to manage this league
   */
  private async verifyAdminAccess(
    leagueId: string,
    adminId: string
  ): Promise<ServiceResponse<boolean>> {
    try {
      // Check if user is the league creator
      const { data: league, error } = await supabase
        .from('leagues')
        .select('created_by')
        .eq('id', leagueId)
        .single();

      if (error) throw error;

      if (league.created_by === adminId) {
        return { data: true, error: null, success: true };
      }

      // Check if user has admin role
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', adminId)
        .single();

      if (profileError) throw profileError;

      const hasAdminAccess = ['admin', 'league_admin', 'app_admin'].includes(userProfile.role);

      return { data: hasAdminAccess, error: null, success: true };

    } catch (error) {
      return {
        data: false,
        error: this.handleError(error, 'verifyAdminAccess'),
        success: false
      };
    }
  }

  /**
   * Get teams in league using team_leagues junction table
   */
  private async getLeagueTeams(leagueId: string): Promise<ServiceResponse<LeagueTeam[]>> {
    try {
      // Use the database function we created for optimal performance
      const { data: teams, error } = await supabase
        .rpc('get_league_teams', { league_uuid: leagueId });

      if (error) throw error;

      const leagueTeams: LeagueTeam[] = (teams || []).map((team: any) => ({
        team_id: team.team_id,
        team_name: team.team_name,
        team_color: team.team_color,
        team_logo_url: team.team_logo_url,
        joined_at: team.joined_at,
        is_active: team.is_active,
        member_count: parseInt(team.member_count) || 0
      }));

      return { data: leagueTeams, error: null, success: true };

    } catch (error) {
      return {
        data: null,
        error: this.handleError(error, 'getLeagueTeams'),
        success: false
      };
    }
  }

  /**
   * Get league statistics
   */
  private async getLeagueStats(leagueId: string): Promise<ServiceResponse<LeagueStats>> {
    try {
      // Get team count from team_leagues
      const { count: teamCount, error: teamError } = await supabase
        .from('team_leagues')
        .select('*', { count: 'exact', head: true })
        .eq('league_id', leagueId)
        .eq('is_active', true);

      if (teamError) throw teamError;

      // Get total players count
      const { data: teamIds, error: teamIdsError } = await supabase
        .from('team_leagues')
        .select('team_id')
        .eq('league_id', leagueId)
        .eq('is_active', true);

      if (teamIdsError) throw teamIdsError;

      let totalPlayers = 0;
      if (teamIds && teamIds.length > 0) {
        const { count: playerCount, error: playerError } = await supabase
          .from('team_members')
          .select('*', { count: 'exact', head: true })
          .in('team_id', teamIds.map(t => t.team_id))
          .eq('is_active', true);

        if (playerError) throw playerError;
        totalPlayers = playerCount || 0;
      }

      // Get match counts
      const { count: totalMatches, error: matchError } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .eq('league_id', leagueId);

      if (matchError) throw matchError;

      const { count: completedMatches, error: completedError } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .eq('league_id', leagueId)
        .eq('status', 'completed');

      if (completedError) throw completedError;

      const stats: LeagueStats = {
        totalTeams: teamCount || 0,
        totalPlayers,
        totalMatches: totalMatches || 0,
        completedMatches: completedMatches || 0,
        avgPlayersPerTeam: (teamCount && teamCount > 0) ? Math.round(totalPlayers / teamCount) : 0
      };

      return { data: stats, error: null, success: true };

    } catch (error) {
      return {
        data: null,
        error: this.handleError(error, 'getLeagueStats'),
        success: false
      };
    }
  }

  /**
   * Get pending requests for this league
   */
  private async getLeaguePendingRequests(
    leagueId: string
  ): Promise<ServiceResponse<TeamLeagueRequestWithDetails[]>> {
    try {
      // Get basic request data first
      const { data: requests, error: requestsError } = await supabase
        .from('team_league_requests')
        .select(`
          *,
          team:teams(*),
          league:leagues(*)
        `)
        .eq('league_id', leagueId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;

      if (!requests || requests.length === 0) {
        return { data: [], error: null, success: true };
      }

      // Get user information manually for each request
      const enrichedRequests = await Promise.all(
        requests.map(async (request) => {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('email, full_name')
            .eq('id', request.requested_by)
            .single();

          return {
            ...request,
            requested_by_user: userData || { email: 'Unknown', full_name: 'Unknown User' }
          };
        })
      );

      return { data: enrichedRequests, error: null, success: true };

    } catch (error) {
      return {
        data: null,
        error: this.handleError(error, 'getLeaguePendingRequests'),
        success: false
      };
    }
  }

  /**
   * Get recent activity for this league
   */
  private async getLeagueRecentActivity(
    leagueId: string
  ): Promise<ServiceResponse<LeagueActivity[]>> {
    try {
      const activities: LeagueActivity[] = [];

      // Get recent team joins from team_leagues
      const { data: recentJoins, error: joinsError } = await supabase
        .from('team_leagues')
        .select(`
          team_id,
          joined_at,
          teams(name)
        `)
        .eq('league_id', leagueId)
        .eq('is_active', true)
        .order('joined_at', { ascending: false })
        .limit(10);

      if (joinsError) throw joinsError;

      // Convert to activity format
      (recentJoins || []).forEach((join: any) => {
        activities.push({
          id: `join_${join.team_id}_${join.joined_at}`,
          type: 'team_joined',
          description: `Team "${join.teams.name}" joined the league`,
          timestamp: join.joined_at,
          related_id: join.team_id
        });
      });

      // Get recent approved requests
      const { data: recentApprovals, error: approvalsError } = await supabase
        .from('team_league_requests')
        .select(`
          id,
          reviewed_at,
          team:teams(name)
        `)
        .eq('league_id', leagueId)
        .eq('status', 'approved')
        .not('reviewed_at', 'is', null)
        .order('reviewed_at', { ascending: false })
        .limit(10);

      if (approvalsError) throw approvalsError;

      (recentApprovals || []).forEach((approval: any) => {
        activities.push({
          id: `approval_${approval.id}`,
          type: 'request_approved',
          description: `Request from team "${approval.team.name}" was approved`,
          timestamp: approval.reviewed_at,
          related_id: approval.id
        });
      });

      // Sort all activities by timestamp (most recent first)
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return { data: activities.slice(0, 10), error: null, success: true };

    } catch (error) {
      return {
        data: null,
        error: this.handleError(error, 'getLeagueRecentActivity'),
        success: false
      };
    }
  }

  /**
   * Get league standings from the database view
   */
  private async getLeagueStandings(leagueId: string): Promise<ServiceResponse<any[]>> {
    try {
      const { data: standings, error } = await supabase
        .from('league_standings')
        .select('*')
        .eq('league_id', leagueId)
        .eq('season_year', new Date().getFullYear())
        .order('position', { ascending: true });

      if (error) throw error;

      return { data: standings || [], error: null, success: true };

    } catch (error) {
      return {
        data: null,
        error: this.handleError(error, 'getLeagueStandings'),
        success: false
      };
    }
  }

  /**
   * Clear cache
   */
  clearCache(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    const keys = Array.from(this.cache.keys());
    keys.forEach(key => {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    });
  }
}
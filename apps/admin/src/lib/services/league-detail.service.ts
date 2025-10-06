/**
 * League Detail Service for MatchDay Admin
 * 
 * Handles comprehensive league-specific operations for admin dashboard:
 * - League detail information with real database connections
 * - Teams management using direct league_id relationships
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
} from '@matchday/database';

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

export interface Season {
  id: string;
  name: string;
  display_name?: string;
  league_id: string;
  season_year: number;
  status: 'draft' | 'registration' | 'active' | 'completed' | 'cancelled';
  tournament_format: 'league' | 'knockout' | 'hybrid';
  start_date: string;
  end_date: string;
  registration_deadline?: string;
  min_teams?: number;
  max_teams?: number;
  registered_teams_count?: number;
  rounds?: number;
  points_for_win?: number;
  points_for_draw?: number;
  points_for_loss?: number;
  allow_draws?: boolean;
  home_away_balance?: boolean;
  fixtures_status: 'pending' | 'generating' | 'completed' | 'error';
  fixtures_generated_at?: string;
  total_matches_planned?: number;
  created_at: string;
  updated_at: string;
}

export interface LeagueDetailData {
  league: League;
  teams: LeagueTeam[];
  seasons: Season[];
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
    // Log detailed error information for debugging
    console.error(`LeagueDetailService.${operation}:`, {
      error,
      code: error?.code,
      message: error?.message,
      details: error?.details,
      hint: error?.hint,
      stack: error?.stack
    });

    // Provide meaningful error codes and messages based on the operation
    let code = error?.code || 'UNKNOWN_ERROR';
    let message = error?.message || 'An unexpected error occurred';
    
    // Handle common database errors
    switch (error?.code) {
      case 'PGRST116':
        code = 'NOT_FOUND';
        message = `Resource not found for operation: ${operation}`;
        break;
      case '42P01':
        code = 'TABLE_NOT_FOUND';
        message = `Database table or view not found for operation: ${operation}`;
        break;
      case '23503':
        code = 'FOREIGN_KEY_VIOLATION';
        message = `Referenced resource not found for operation: ${operation}`;
        break;
      case 'PGRST301':
        code = 'INSUFFICIENT_PERMISSIONS';
        message = `Insufficient permissions for operation: ${operation}`;
        break;
      default:
        // For empty objects or malformed errors, provide a more helpful message
        if (!error || typeof error !== 'object' || Object.keys(error).length === 0) {
          code = 'EMPTY_ERROR';
          message = `Operation ${operation} failed but no error details were provided. This may indicate a database connection issue or missing table/view.`;
        }
    }

    return {
      code,
      message,
      details: error?.details || (typeof error === 'object' ? JSON.stringify(error) : error),
      timestamp: new Date().toISOString(),
      operation
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

      // Get teams using direct league_id relationship
      const teams = await this.getLeagueTeams(leagueId);
      if (!teams.success) {
        throw new Error(teams.error?.message || 'Failed to fetch league teams');
      }

      // Seasons data is now provided via the realtime hook through API endpoint
      // This ensures proper permissions through the admin client

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
        seasons: [], // Populated by the realtime hook via API endpoint
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
   * Get teams in league using season-based architecture
   */
  private async getLeagueTeams(leagueId: string): Promise<ServiceResponse<LeagueTeam[]>> {
    try {
      // Get current season for this league
      const { data: currentSeason, error: seasonError } = await supabase
        .from('seasons')
        .select('id')
        .eq('league_id', leagueId)
        .eq('is_current', true)
        .single();

      if (seasonError && seasonError.code !== 'PGRST116') {
        throw seasonError;
      }

      if (!currentSeason) {
        // No current season exists for this league
        return { data: [], error: null, success: true };
      }

      // Get teams registered for the current season
      const { data: seasonTeams, error } = await supabase
        .from('season_teams')
        .select(`
          team:teams (
            id,
            name,
            team_color,
            created_at,
            is_archived,
            team_members (
              id,
              is_active
            )
          )
        `)
        .eq('season_id', currentSeason.id)
        .in('status', ['registered', 'confirmed']);

      if (error) throw error;

      if (!seasonTeams || seasonTeams.length === 0) {
        return { data: [], error: null, success: true };
      }

      // Transform the data to match LeagueTeam interface
      const leagueTeams: LeagueTeam[] = seasonTeams
        .map(st => st.team)
        .filter(team => team && !team.is_archived)
        .map((team: any) => {
          const activeMemberCount = team.team_members
            ?.filter((member: any) => member.is_active).length || 0;
          
          return {
            team_id: team.id,
            team_name: team.name,
            team_color: team.team_color || '#374151',
            team_logo_url: null, // Not storing logo URLs currently
            joined_at: team.created_at,
            is_active: !team.is_archived,
            member_count: activeMemberCount
          };
        });

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
   * Get league statistics using direct league_id relationships
   */
  private async getLeagueStats(leagueId: string): Promise<ServiceResponse<LeagueStats>> {
    try {
      // Get team count directly from teams table
      const { count: teamCount, error: teamError } = await supabase
        .from('teams')
        .select('*', { count: 'exact', head: true })
        .eq('league_id', leagueId)
        .eq('is_archived', false);

      if (teamError) throw teamError;

      // Get total players count via teams in this league
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('id')
        .eq('league_id', leagueId)
        .eq('is_archived', false);

      if (teamsError) throw teamsError;

      let totalPlayers = 0;
      if (teams && teams.length > 0) {
        const { count: playerCount, error: playerError } = await supabase
          .from('team_members')
          .select('*', { count: 'exact', head: true })
          .in('team_id', teams.map(t => t.id))
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
      // Step 1: First get all teams in this league using season-based architecture
      // Get current season for this league
      const { data: currentSeason, error: seasonError } = await supabase
        .from('seasons')
        .select('id')
        .eq('league_id', leagueId)
        .eq('is_current', true)
        .single();

      if (seasonError && seasonError.code !== 'PGRST116') {
        throw seasonError;
      }

      if (!currentSeason) {
        // No current season exists for this league
        return { data: [], error: null, success: true };
      }

      // Get teams registered for the current season
      const { data: seasonTeams, error: teamsError } = await supabase
        .from('season_teams')
        .select(`
          team:teams (
            id,
            name
          )
        `)
        .eq('season_id', currentSeason.id)
        .in('status', ['registered', 'confirmed']);

      if (teamsError && teamsError.message) {
        console.error('Failed to fetch teams for league:', teamsError);
        throw teamsError;
      }

      // Transform season teams to flat teams array
      const teams = seasonTeams?.map(st => st.team).filter(Boolean) || [];

      // If no teams in league, return empty array
      if (!teams || teams.length === 0) {
        return { data: [], error: null, success: true };
      }

      // Step 2: Get pending join requests for these teams (no joins)
      const teamIds = teams.map(t => t.id);
      const { data: joinRequests, error: requestsError } = await supabase
        .from('team_join_requests')
        .select(`
          id,
          team_id,
          status,
          created_at,
          message,
          user_id
        `)
        .in('team_id', teamIds)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (requestsError && requestsError.message) {
        console.error('Failed to fetch join requests:', requestsError);
        console.error('[LeagueDetail] Raw requests error object:', JSON.stringify(requestsError, null, 2));
        console.error('[LeagueDetail] Error details:', {
          message: requestsError.message,
          code: requestsError.code,
          details: requestsError.details,
          hint: requestsError.hint,
          isEmpty: !requestsError || Object.keys(requestsError).length === 0
        });
        throw requestsError;
      }

      if (!joinRequests || joinRequests.length === 0) {
        return { data: [], error: null, success: true };
      }

      // Step 3: Get user profiles for the requesters
      const userIds = [...new Set(joinRequests.map(r => r.user_id))];
      const { data: userProfiles, error: usersError } = await supabase
        .from('user_profiles')
        .select('id, display_name, full_name, email')
        .in('id', userIds);

      if (usersError) {
        console.error('Failed to fetch user profiles:', usersError);
        console.error('[LeagueDetail] Raw user profiles error object:', JSON.stringify(usersError, null, 2));
        console.error('[LeagueDetail] User profiles error details:', {
          message: usersError.message,
          code: usersError.code,
          details: usersError.details,
          hint: usersError.hint,
          isEmpty: !usersError || Object.keys(usersError).length === 0,
          userIds: userIds
        });
        // Don't throw - we can continue without user profile data
      }

      // Create lookup maps
      const teamsMap = teams.reduce((acc, team) => {
        acc[team.id] = team;
        return acc;
      }, {} as Record<string, any>);

      const usersMap = (userProfiles || []).reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {} as Record<string, any>);

      // Transform to expected format
      const transformedRequests: TeamLeagueRequestWithDetails[] = joinRequests.map(request => {
        const team = teamsMap[request.team_id];
        const user = usersMap[request.user_id];

        return {
          id: request.id,
          team_id: request.team_id,
          league_id: leagueId,
          requested_by: request.user_id,
          message: request.message || '',
          status: request.status as 'pending',
          created_at: request.created_at,
          reviewed_at: null,
          reviewed_by: null,
          response_message: null,
          team: {
            id: team?.id || request.team_id,
            name: team?.name || 'Unknown Team'
          },
          league: {
            id: leagueId,
            name: 'League' // We could fetch this if needed
          },
          requested_by_user: {
            email: user?.email || 'Unknown',
            full_name: user?.full_name || user?.display_name || 'Unknown User',
            display_name: user?.display_name || 'Unknown User'
          }
        };
      });

      return { data: transformedRequests, error: null, success: true };

    } catch (error) {
      console.error('getLeaguePendingRequests error:', error);
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

      // Get recent teams created in this league
      const { data: recentTeams, error: teamsError } = await supabase
        .from('teams')
        .select('id, name, created_at')
        .eq('league_id', leagueId)
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (teamsError) throw teamsError;

      // Convert to activity format
      (recentTeams || []).forEach((team: any) => {
        activities.push({
          id: `team_created_${team.id}`,
          type: 'team_joined',
          description: `Team "${team.name}" joined the league`,
          timestamp: team.created_at,
          related_id: team.id
        });
      });

      // Get recent approved team join requests for teams in this league
      // First get teams in the league, then get approved requests for those teams
      const { data: leagueTeams, error: leagueTeamsError } = await supabase
        .from('teams')
        .select('id')
        .eq('league_id', leagueId)
        .eq('is_archived', false);

      if (leagueTeamsError && leagueTeamsError.message) {
        console.error('Failed to fetch teams for recent activity:', leagueTeamsError);
        throw leagueTeamsError;
      }

      if (leagueTeams && leagueTeams.length > 0) {
        const teamIds = leagueTeams.map(t => t.id);
        const { data: recentApprovals, error: approvalsError } = await supabase
          .from('team_join_requests')
          .select(`
            id,
            team_id,
            created_at,
            team:teams(name)
          `)
          .in('team_id', teamIds)
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(10);

        if (approvalsError && approvalsError.message) {
          console.error('Failed to fetch recent approvals:', approvalsError);
          throw approvalsError;
        }

        (recentApprovals || []).forEach((approval: any) => {
          activities.push({
            id: `approval_${approval.id}`,
            type: 'request_approved',
            description: `Team join request for "${approval.team?.name || 'Unknown Team'}" was approved`,
            timestamp: approval.created_at, // Use created_at instead of non-existent updated_at
            related_id: approval.id
          });
        });
      }

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
      // First check if the league_standings view exists and has data
      const { data: standings, error } = await supabase
        .from('league_standings')
        .select(`
          id,
          team_id,
          league_id,
          season_year,
          games_played,
          wins,
          draws,
          losses,
          goals_for,
          goals_against,
          points,
          clean_sheets,
          team_name,
          team_color,
          league_name,
          sport_type,
          goal_difference,
          points_percentage,
          position
        `)
        .eq('league_id', leagueId)
        .eq('season_year', new Date().getFullYear())
        .order('position', { ascending: true });

      if (error) {
        // Handle specific database errors
        if (error.code === 'PGRST116' || error.code === '42P01') {
          // Table/view doesn't exist or no data found
          console.warn(`League standings view not found or no data for league ${leagueId}:`, error);
          return { data: [], error: null, success: true };
        }
        throw error;
      }

      // Return empty array if no standings exist (safe default)
      return { data: standings || [], error: null, success: true };

    } catch (error) {
      console.warn(`Failed to fetch league standings for league ${leagueId}:`, error);
      
      // Return empty array as safe fallback instead of throwing error
      // This ensures the dashboard doesn't break if standings aren't available
      return { 
        data: [], 
        error: null, // Don't return error to avoid breaking the dashboard
        success: true 
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
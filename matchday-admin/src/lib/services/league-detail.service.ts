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

import { supabase, createAdminClient } from '@/lib/supabase/client';
import type {
  Database,
  League,
  Season,
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
  seasons: Season[];
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
    // Ensure we have a valid error object to work with
    const errorObj = error || { message: 'Unknown error occurred' };

    // Log detailed error information for debugging (only if error has meaningful content)
    if (errorObj && (errorObj.message || errorObj.code || Object.keys(errorObj).length > 0)) {
      console.error(`LeagueDetailService.${operation}:`, {
        error: errorObj,
        code: errorObj?.code,
        message: errorObj?.message,
        details: errorObj?.details,
        hint: errorObj?.hint,
        stack: errorObj?.stack
      });
    } else {
      console.error(`LeagueDetailService.${operation}: Empty or undefined error object received`);
    }

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
          message = `Operation ${operation} failed but no error details were provided. This may indicate a database connection issue, missing table/view, or an async operation that resolved with undefined.`;
        }
    }

    return {
      code,
      message,
      details: errorObj?.details || (typeof errorObj === 'object' ? JSON.stringify(errorObj) : String(errorObj || 'No error details')),
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

      // Verify admin has access to this league (only if adminId is provided and valid)
      if (adminId && typeof adminId === 'string' && adminId.trim()) {
        console.log(`LeagueDetailService.getLeagueDetails: Verifying admin access for admin ${adminId} to league ${leagueId}`);
        const accessCheck = await this.verifyAdminAccess(leagueId, adminId);
        if (!accessCheck.success) {
          console.warn(`LeagueDetailService.getLeagueDetails: Admin access verification failed for admin ${adminId} to league ${leagueId}:`, accessCheck.error);
          return {
            data: null,
            error: accessCheck.error || {
              code: 'ACCESS_DENIED',
              message: 'You do not have permission to view this league',
              timestamp: new Date().toISOString(),
              operation: 'getLeagueDetails'
            },
            success: false
          };
        }
        console.log(`LeagueDetailService.getLeagueDetails: Admin access verified for admin ${adminId} to league ${leagueId}`);
      } else if (adminId !== undefined) {
        // If adminId is provided but invalid, log a warning but don't fail
        console.warn(`LeagueDetailService.getLeagueDetails: Invalid adminId provided (${adminId}), skipping admin access verification`);
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

      // Get all supplementary data with graceful degradation
      // Each operation is wrapped in try-catch to prevent total failure
      const warnings: string[] = [];

      // Get teams - critical operation
      const teams = await this.safeGetLeagueTeams(leagueId);
      if (!teams.success) {
        warnings.push(`Teams data unavailable: ${teams.error?.message}`);
      }

      // Get league statistics - non-critical
      const stats = await this.safeGetLeagueStats(leagueId);
      if (!stats.success) {
        warnings.push(`Statistics unavailable: ${stats.error?.message}`);
      }

      // Get pending requests - non-critical
      const pendingRequests = await this.safeGetLeaguePendingRequests(leagueId);
      if (!pendingRequests.success) {
        warnings.push(`Pending requests unavailable: ${pendingRequests.error?.message}`);
      }

      // Get recent activity - non-critical
      const recentActivity = await this.safeGetLeagueRecentActivity(leagueId);
      if (!recentActivity.success) {
        warnings.push(`Recent activity unavailable: ${recentActivity.error?.message}`);
      }

      // Get seasons - non-critical
      console.log(`LeagueDetailService.getLeagueDetails: Loading seasons for league ${leagueId}`);
      const seasons = await this.safeGetLeagueSeasons(leagueId);
      if (!seasons.success) {
        console.warn(`LeagueDetailService.getLeagueDetails: Seasons loading failed for league ${leagueId}:`, seasons.error);
        warnings.push(`Seasons unavailable: ${seasons.error?.message}`);
      } else {
        console.log(`LeagueDetailService.getLeagueDetails: Successfully loaded ${seasons.data?.length || 0} seasons for league ${leagueId}`);
      }

      // Get league standings - non-critical and depends on teams
      let standings;
      if (teams.data && teams.data.length > 0) {
        const standingsResult = await this.safeGetLeagueStandings(leagueId);
        if (standingsResult.success) {
          standings = standingsResult.data;
        } else {
          warnings.push(`Standings unavailable: ${standingsResult.error?.message}`);
        }
      }

      // Log warnings for debugging but don't fail
      if (warnings.length > 0) {
        console.warn(`LeagueDetailService.getLeagueDetails: Partial data loaded with warnings:`, warnings);
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
        seasons: seasons.data || [],
        standings
      };

      // Cache for 5 minutes
      this.setCache(cacheKey, leagueDetailData, 300);

      // Return with warnings if there were partial failures
      if (warnings.length > 0) {
        return {
          data: leagueDetailData,
          error: {
            code: 'PARTIAL_SUCCESS',
            message: `League data loaded with ${warnings.length} warning(s): ${warnings.join('; ')}`,
            timestamp: new Date().toISOString()
          },
          success: true // Still successful because core league data was retrieved
        };
      }

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
      // Validate inputs
      if (!leagueId || typeof leagueId !== 'string') {
        console.warn(`LeagueDetailService.verifyAdminAccess: Invalid leagueId provided: ${leagueId}`);
        return {
          data: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Invalid league ID provided',
            timestamp: new Date().toISOString(),
            operation: 'verifyAdminAccess'
          },
          success: false
        };
      }

      if (!adminId || typeof adminId !== 'string') {
        console.warn(`LeagueDetailService.verifyAdminAccess: Invalid adminId provided: ${adminId}`);
        return {
          data: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Invalid admin ID provided',
            timestamp: new Date().toISOString(),
            operation: 'verifyAdminAccess'
          },
          success: false
        };
      }

      console.log(`LeagueDetailService.verifyAdminAccess: Checking access for admin ${adminId} to league ${leagueId}`);

      // Check if user is the league creator
      const { data: league, error } = await supabase
        .from('leagues')
        .select('created_by')
        .eq('id', leagueId)
        .single();

      if (error) {
        console.error(`LeagueDetailService.verifyAdminAccess: Database error for league ${leagueId}:`, {
          error,
          code: error?.code,
          message: error?.message,
          details: error?.details
        });
        throw error;
      }

      if (!league) {
        console.warn(`LeagueDetailService.verifyAdminAccess: League ${leagueId} not found`);
        return {
          data: false,
          error: {
            code: 'LEAGUE_NOT_FOUND',
            message: 'League not found',
            timestamp: new Date().toISOString(),
            operation: 'verifyAdminAccess'
          },
          success: false
        };
      }

      const hasAccess = league.created_by === adminId;
      console.log(`LeagueDetailService.verifyAdminAccess: Access ${hasAccess ? 'granted' : 'denied'} for admin ${adminId} to league ${leagueId}`);

      if (hasAccess) {
        return { data: true, error: null, success: true };
      }

      // For now, only league creators have admin access
      // Future: Could add league_admins table check here if needed
      return { data: false, error: null, success: true };

    } catch (error) {
      console.error(`LeagueDetailService.verifyAdminAccess: Exception caught for league ${leagueId}, admin ${adminId}:`, error);
      return {
        data: false,
        error: this.handleError(error, 'verifyAdminAccess'),
        success: false
      };
    }
  }

  /**
   * Get teams in league using direct league relationship
   */
  private async getLeagueTeams(leagueId: string): Promise<ServiceResponse<LeagueTeam[]>> {
    try {
      // Get teams directly from teams table (teams belong directly to leagues)
      const { data: teams, error } = await supabase
        .from('teams')
        .select('id, name, team_color, created_at')
        .eq('league_id', leagueId);

      if (error) throw error;

      if (!teams || teams.length === 0) {
        return { data: [], error: null, success: true };
      }

      // Get member counts for each team
      const teamIds = teams.map((t: any) => t.id);
      const { data: memberCounts, error: memberError } = await supabase
        .from('team_members')
        .select('team_id')
        .in('team_id', teamIds)
        .eq('is_active', true);

      if (memberError) {
        console.warn('Failed to fetch member counts:', memberError);
      }

      // Count members per team
      const memberCountMap = new Map<string, number>();
      (memberCounts || []).forEach((member: any) => {
        const count = memberCountMap.get(member.team_id) || 0;
        memberCountMap.set(member.team_id, count + 1);
      });

      const leagueTeams: LeagueTeam[] = teams.map((team: any) => {
        return {
          team_id: team.id,
          team_name: team.name || 'Unknown Team',
          team_color: team.team_color || '#374151',
          team_logo_url: null, // Not storing logo URLs currently
          joined_at: team.created_at, // Use team creation as join date
          is_active: true, // All teams in the table are active
          member_count: memberCountMap.get(team.id) || 0
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
   * Get league statistics
   */
  private async getLeagueStats(leagueId: string): Promise<ServiceResponse<LeagueStats>> {
    try {
      // Get team count directly from teams table
      const { count: teamCount, error: teamError } = await supabase
        .from('teams')
        .select('*', { count: 'exact', head: true })
        .eq('league_id', leagueId);

      if (teamError) throw teamError;

      // Get total players count
      const { data: teamIds, error: teamIdsError } = await supabase
        .from('teams')
        .select('id')
        .eq('league_id', leagueId);

      if (teamIdsError) throw teamIdsError;

      let totalPlayers = 0;
      if (teamIds && teamIds.length > 0) {
        const { count: playerCount, error: playerError } = await supabase
          .from('team_members')
          .select('*', { count: 'exact', head: true })
          .in('team_id', teamIds.map(t => t.id))
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
      // Note: Temporarily returning empty data due to database schema conflicts
      // The team_join_requests table has conflicting schema definitions between
      // main schema (user_id field) and migration (league_id + requested_by fields)
      // TODO: Resolve schema conflicts and implement proper pending requests functionality

      return { data: [], error: null, success: true };

    } catch (error) {
      return {
        data: [],
        error: this.handleError(error, 'getLeaguePendingRequests'),
        success: false
      };
    }
  }

  /**
   * Get seasons for this league
   */
  private async getLeagueSeasons(leagueId: string): Promise<ServiceResponse<Season[]>> {
    try {
      // Validate input
      if (!leagueId || typeof leagueId !== 'string') {
        throw new Error(`Invalid leagueId provided: ${leagueId}`);
      }

      console.log(`LeagueDetailService.getLeagueSeasons: Starting query for league ${leagueId}`);

      // Use regular client first (admin client for debugging only)
      const { data: seasons, error } = await supabase
        .from('seasons')
        .select('*')
        .eq('league_id', leagueId)
        .order('created_at', { ascending: false });

      console.log(`LeagueDetailService.getLeagueSeasons: Query completed for league ${leagueId}`, {
        success: !error,
        seasonsCount: seasons?.length || 0,
        seasonIds: seasons?.map(s => s.id) || [],
        seasonNames: seasons?.map(s => s.display_name || s.name) || [],
        error: error
      });

      // Log detailed season information
      if (seasons && seasons.length > 0) {
        console.log(`LeagueDetailService.getLeagueSeasons: Season details for league ${leagueId}:`,
          seasons.map((season, index) => ({
            index: index + 1,
            id: season.id,
            name: season.display_name || season.name,
            status: season.status,
            created_at: season.created_at,
            start_date: season.start_date,
            end_date: season.end_date
          }))
        );
      }

      // If there's a database error, throw it to be caught and handled
      if (error) {
        console.error(`LeagueDetailService.getLeagueSeasons: Database error for league ${leagueId}:`, error);
        throw error;
      }

      // Debug: Also try admin client to compare permissions
      try {
        const adminClient = createAdminClient();
        const { data: adminSeasons, error: adminError } = await adminClient
          .from('seasons')
          .select('*')
          .eq('league_id', leagueId)
          .order('created_at', { ascending: false });

        console.log(`LeagueDetailService.getLeagueSeasons (ADMIN Debug): Found ${adminSeasons?.length || 0} seasons for league ${leagueId}`);

        if (adminSeasons && adminSeasons.length !== (seasons?.length || 0)) {
          console.warn(`LeagueDetailService.getLeagueSeasons: PERMISSION ISSUE DETECTED! Admin client vs regular client:`, {
            adminSeasons: adminSeasons.length,
            regularSeasons: seasons?.length || 0,
            adminSeasonsData: adminSeasons.map(s => ({ id: s.id, name: s.display_name || s.name })),
            regularSeasonsData: seasons?.map(s => ({ id: s.id, name: s.display_name || s.name })) || []
          });
        }

        if (adminError) {
          console.warn(`LeagueDetailService.getLeagueSeasons: Admin client also had error:`, adminError);
        }
      } catch (adminErr) {
        console.warn(`LeagueDetailService.getLeagueSeasons: Admin client exception:`, adminErr);
      }

      return { data: seasons || [], error: null, success: true };

    } catch (error) {
      console.error(`LeagueDetailService.getLeagueSeasons: Exception caught for league ${leagueId}:`, error);
      return {
        data: [],
        error: this.handleError(error, 'getLeagueSeasons'),
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

      // Get recent team creations from teams table (with graceful degradation)
      try {
        const { data: recentTeams, error: teamsError } = await supabase
          .from('teams')
          .select('id, name, created_at')
          .eq('league_id', leagueId)
          .order('created_at', { ascending: false })
          .limit(10);

        if (teamsError) {
          console.warn(`Failed to fetch recent teams for league ${leagueId}:`, teamsError);
        } else {
          // Convert to activity format
          (recentTeams || []).forEach((team: any) => {
            activities.push({
              id: `team_created_${team.id}_${team.created_at}`,
              type: 'team_joined',
              description: `Team "${team.name}" joined the league`,
              timestamp: team.created_at,
              related_id: team.id
            });
          });
        }
      } catch (teamsError) {
        console.warn(`Exception while fetching recent teams for league ${leagueId}:`, teamsError);
      }

      // Note: Removed team_join_requests query due to database schema conflicts
      // The team_join_requests table doesn't have a league_id field in the current schema
      // This prevents the console error while still providing useful activity data from team joins

      // Sort all activities by timestamp (most recent first)
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Always return successfully, even if empty (graceful degradation)
      return { data: activities.slice(0, 10), error: null, success: true };

    } catch (error) {
      // Fallback: return empty activities rather than failing
      console.warn(`getLeagueRecentActivity failed for league ${leagueId}, returning empty activities:`, error);
      return {
        data: [],
        error: null, // Don't return error to prevent breaking the dashboard
        success: true
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
   * Database schema validation utilities
   */
  private async validateTableExists(tableName: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(tableName)
        .select('*', { head: true, count: 'exact' })
        .limit(1);

      if (error) {
        // Check for table/view not found errors
        if (error.code === 'PGRST116' || error.code === '42P01' || error.code === '42501') {
          console.warn(`Table/view '${tableName}' does not exist or is not accessible:`, error);
          return false;
        }
        // Other errors don't necessarily mean the table doesn't exist
        console.warn(`Table validation warning for '${tableName}':`, error);
        return true; // Assume it exists but had other issues
      }

      return true;
    } catch (error) {
      console.warn(`Table validation failed for '${tableName}':`, error);
      return false;
    }
  }

  /**
   * Enhanced error handling for database operations
   */
  private handleDatabaseError(error: any, operation: string, tableName?: string): ServiceError {
    // Database schema related errors
    if (error?.code === 'PGRST116') {
      return {
        code: 'NOT_FOUND',
        message: tableName ? `Table/view '${tableName}' not found` : 'Resource not found',
        timestamp: new Date().toISOString()
      };
    }

    if (error?.code === '42P01') {
      return {
        code: 'TABLE_NOT_FOUND',
        message: tableName ? `Table '${tableName}' does not exist` : 'Required table does not exist',
        timestamp: new Date().toISOString()
      };
    }

    if (error?.code === '42501') {
      return {
        code: 'INSUFFICIENT_PRIVILEGE',
        message: tableName ? `Insufficient privileges to access '${tableName}'` : 'Insufficient database privileges',
        timestamp: new Date().toISOString()
      };
    }

    // Connection and authentication errors
    if (error?.code === 'ECONNREFUSED' || error?.code === 'ENOTFOUND') {
      return {
        code: 'DATABASE_CONNECTION_FAILED',
        message: 'Cannot connect to database',
        timestamp: new Date().toISOString()
      };
    }

    // Fallback to generic error handling
    return this.handleError(error, operation);
  }

  /**
   * Safe wrapper methods with graceful degradation
   */
  private async safeGetLeagueTeams(leagueId: string): Promise<ServiceResponse<LeagueTeam[]>> {
    try {
      return await this.getLeagueTeams(leagueId);
    } catch (error) {
      console.warn(`safeGetLeagueTeams failed for league ${leagueId}:`, error);
      return {
        data: [],
        error: this.handleDatabaseError(error, 'getLeagueTeams', 'teams'),
        success: false
      };
    }
  }

  private async safeGetLeagueStats(leagueId: string): Promise<ServiceResponse<LeagueStats>> {
    try {
      return await this.getLeagueStats(leagueId);
    } catch (error) {
      console.warn(`safeGetLeagueStats failed for league ${leagueId}:`, error);
      return {
        data: {
          totalTeams: 0,
          totalPlayers: 0,
          totalMatches: 0,
          completedMatches: 0,
          avgPlayersPerTeam: 0
        },
        error: this.handleDatabaseError(error, 'getLeagueStats', 'team_stats'),
        success: false
      };
    }
  }

  private async safeGetLeaguePendingRequests(leagueId: string): Promise<ServiceResponse<TeamLeagueRequestWithDetails[]>> {
    try {
      return await this.getLeaguePendingRequests(leagueId);
    } catch (error) {
      console.warn(`safeGetLeaguePendingRequests failed for league ${leagueId}:`, error);
      return {
        data: [],
        error: this.handleDatabaseError(error, 'getLeaguePendingRequests', 'team_join_requests'),
        success: false
      };
    }
  }

  private async safeGetLeagueRecentActivity(leagueId: string): Promise<ServiceResponse<LeagueActivity[]>> {
    try {
      return await this.getLeagueRecentActivity(leagueId);
    } catch (error) {
      console.warn(`safeGetLeagueRecentActivity failed for league ${leagueId}:`, error);
      return {
        data: [],
        error: this.handleDatabaseError(error, 'getLeagueRecentActivity', 'teams'),
        success: false
      };
    }
  }

  private async safeGetLeagueStandings(leagueId: string): Promise<ServiceResponse<any[]>> {
    try {
      return await this.getLeagueStandings(leagueId);
    } catch (error) {
      console.warn(`safeGetLeagueStandings failed for league ${leagueId}:`, error);
      return {
        data: [],
        error: this.handleDatabaseError(error, 'getLeagueStandings', 'league_standings'),
        success: false
      };
    }
  }

  private async safeGetLeagueSeasons(leagueId: string): Promise<ServiceResponse<Season[]>> {
    try {
      console.log(`LeagueDetailService.safeGetLeagueSeasons: Starting safe wrapper for league ${leagueId}`);
      const result = await this.getLeagueSeasons(leagueId);
      console.log(`LeagueDetailService.safeGetLeagueSeasons: Safe wrapper completed for league ${leagueId}`, {
        success: result.success,
        hasData: !!result.data,
        dataLength: result.data?.length || 0,
        hasError: !!result.error
      });
      return result;
    } catch (error) {
      console.error(`LeagueDetailService.safeGetLeagueSeasons: Exception in safe wrapper for league ${leagueId}:`, error);
      return {
        data: [],
        error: this.handleDatabaseError(error, 'getLeagueSeasons', 'seasons'),
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
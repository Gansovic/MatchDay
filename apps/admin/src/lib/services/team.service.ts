/**
 * Team Service for MatchDay
 * 
 * Handles comprehensive team-related operations with focus on:
 * - Team creation and management
 * - Team member management and join requests
 * - Team statistics and performance tracking
 * - Real-time team updates and notifications
 * 
 * Optimized for amateur sports leagues with proper error handling,
 * caching strategies, and authentication integration.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  Database,
  Team,
  TeamMember,
  InsertTeam,
  UpdateTeam,
  CreateTeamForm,
  ServiceResponse,
  ServiceError,
  PaginatedServiceResponse,
  TeamJoinRequest,
  JoinRequestStatus,
  UserProfile,
  League,
  CacheOptions,
  RealtimeSubscriptionOptions
} from '@matchday/database';

export interface TeamWithDetails extends Team {
  league: League | null;
  captain?: UserProfile;
  members: Array<TeamMember & { user_profile: UserProfile }>;
  memberCount: number;
  availableSpots: number;
  joinRequests?: TeamJoinRequest[];
  stats?: {
    wins: number;
    draws: number;
    losses: number;
    goals_for: number;
    goals_against: number;
    points: number;
    position: number;
    total_teams: number;
  };
  isOrphaned?: boolean;
  previousLeagueName?: string;
}

export interface TeamCreationOptions {
  auto_add_creator: boolean;
  initial_position?: string;
  initial_jersey_number?: number;
}

export class TeamService {
  private static instance: TeamService;
  private supabase: SupabaseClient<Database>;
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  private constructor(supabaseClient: SupabaseClient<Database>) {
    this.supabase = supabaseClient;
  }

  static getInstance(supabaseClient?: SupabaseClient<Database>): TeamService {
    if (!TeamService.instance) {
      if (!supabaseClient) {
        throw new Error('SupabaseClient required for first initialization');
      }
      TeamService.instance = new TeamService(supabaseClient);
    }
    return TeamService.instance;
  }

  /**
   * Handle service errors consistently
   */
  private handleError(error: any, operation: string): ServiceError {
    console.error(`TeamService.${operation}:`, error);
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
    return `team_service:${operation}:${JSON.stringify(params)}`;
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
   * Create a new team
   */
  async createTeam(
    captainId: string,
    teamData: CreateTeamForm,
    options: TeamCreationOptions = { auto_add_creator: true }
  ): Promise<ServiceResponse<TeamWithDetails>> {
    try {
      let league = null;
      
      // If league_id is provided, validate that the league exists and is active
      if (teamData.league_id) {
        const { data: leagueData, error: leagueError } = await this.supabase
          .from('leagues')
          .select('*')
          .eq('id', teamData.league_id)
          .eq('is_active', true)
          .single();

        if (leagueError) {
          if (leagueError.code === 'PGRST116') {
            return {
              data: null,
              error: {
                code: 'LEAGUE_NOT_FOUND',
                message: 'Selected league not found or is not active',
                timestamp: new Date().toISOString()
              },
              success: false
            };
          }
          throw leagueError;
        }
        league = leagueData;
      }

      // Check if team name is unique (globally if no league, within league if specified)
      let nameCheckQuery = this.supabase
        .from('teams')
        .select('id')
        .eq('name', teamData.name);
      
      // Only check within league if league_id is provided
      if (teamData.league_id) {
        nameCheckQuery = nameCheckQuery.eq('league_id', teamData.league_id);
      }
      
      const { data: existingTeam, error: nameCheckError } = await nameCheckQuery.single();

      if (nameCheckError && nameCheckError.code !== 'PGRST116') {
        throw nameCheckError;
      }

      if (existingTeam) {
        return {
          data: null,
          error: {
            code: 'TEAM_NAME_EXISTS',
            message: teamData.league_id 
              ? 'A team with this name already exists in the selected league'
              : 'A team with this name already exists',
            timestamp: new Date().toISOString()
          },
          success: false
        };
      }

      // Use a transaction-like approach: create team without captain first, then add member, then update captain
      // This avoids the chicken-and-egg problem with foreign key constraints
      
      // Step 1: Create team record without captain initially
      const teamInsert: InsertTeam = {
        league_id: teamData.league_id,
        name: teamData.name,
        team_color: teamData.team_color,
        captain_id: null, // Initially null to avoid FK constraint issues
        max_players: teamData.max_players || 22,
        min_players: teamData.min_players || 7,
        is_recruiting: true,
        team_bio: teamData.description || null
      };

      const { data: newTeam, error: teamError } = await this.supabase
        .from('teams')
        .insert(teamInsert)
        .select()
        .single();

      if (teamError) throw teamError;

      try {
        // Step 2: Add creator as team member
        if (options.auto_add_creator) {
          const { error: memberError } = await this.supabase
            .from('team_members')
            .insert({
              team_id: newTeam.id,
              user_id: captainId,
              position: options.initial_position || 'midfielder',
              jersey_number: options.initial_jersey_number || 1,
              is_active: true
            });

          if (memberError) throw memberError;

          // Step 3: Update team with captain_id only if member was added successfully
          const { error: updateError } = await this.supabase
            .from('teams')
            .update({ captain_id: captainId })
            .eq('id', newTeam.id);

          if (updateError) throw updateError;
        }

      } catch (error) {
        // If any step fails, clean up the team
        await this.supabase.from('teams').delete().eq('id', newTeam.id);
        throw error;
      }

      // Return the created team data directly without complex details lookup
      // to avoid potential infinite recursion during creation
      const basicTeamData: TeamWithDetails = {
        ...newTeam,
        captain_id: options.auto_add_creator ? captainId : null, // Only set captain if member was added
        league: null, // Will be populated later if needed
        captain: undefined,
        members: [],
        memberCount: options.auto_add_creator ? 1 : 0,
        availableSpots: (teamData.max_players || 22) - (options.auto_add_creator ? 1 : 0),
        isOrphaned: !teamData.league_id, // Team is orphaned if no league
        previousLeagueName: undefined
      };

      // Clear relevant caches
      this.clearCache('getUserTeams');

      return {
        data: basicTeamData,
        error: null,
        success: true
      };

    } catch (error) {
      return {
        data: null,
        error: this.handleError(error, 'createTeam'),
        success: false
      };
    }
  }

  /**
   * Get detailed team information
   */
  async getTeamDetails(
    teamId: string,
    options: CacheOptions = {}
  ): Promise<ServiceResponse<TeamWithDetails>> {
    try {
      const cacheKey = this.getCacheKey('getTeamDetails', { teamId });
      const cached = this.getFromCache<TeamWithDetails>(cacheKey);
      
      if (cached && !options.revalidateOnBackground) {
        return { data: cached, error: null, success: true };
      }

      // Get team with league and member details
      // Use left join for leagues since team might be orphaned
      const { data: team, error: teamError } = await this.supabase
        .from('teams')
        .select(`
          *,
          league:leagues(*),
          team_members(
            *,
            user_profile:users!inner(*)
          )
        `)
        .eq('id', teamId)
        .single();

      if (teamError) {
        if (teamError.code === 'PGRST116') {
          return {
            data: null,
            error: {
              code: 'TEAM_NOT_FOUND',
              message: 'Team not found',
              timestamp: new Date().toISOString()
            },
            success: false
          };
        }
        throw teamError;
      }

      // Get captain profile if exists
      let captain: UserProfile | undefined;
      if (team.captain_id) {
        const { data: captainProfile } = await this.supabase
          .from('users')
          .select('*')
          .eq('id', team.captain_id)
          .single();
        
        captain = captainProfile || undefined;
      }

      // Get team statistics
      const { data: teamStats } = await this.supabase
        .from('team_stats')
        .select('*')
        .eq('team_id', teamId)
        .eq('season_year', new Date().getFullYear())
        .single();

      // Calculate team position if stats exist and team has a league
      let stats;
      if (teamStats && team.league_id) {
        const { data: leagueTeams } = await this.supabase
          .from('team_stats')
          .select('team_id, points, goals_for, goals_against')
          .eq('league_id', team.league_id)
          .eq('season_year', new Date().getFullYear())
          .order('points', { ascending: false });

        const position = leagueTeams?.findIndex(t => t.team_id === teamId) + 1 || 1;
        
        stats = {
          wins: teamStats.wins || 0,
          draws: teamStats.draws || 0,
          losses: teamStats.losses || 0,
          goals_for: teamStats.goals_for || 0,
          goals_against: teamStats.goals_against || 0,
          points: teamStats.points || 0,
          position,
          total_teams: leagueTeams?.length || 1
        };
      } else if (teamStats) {
        // Team has stats but no league (orphaned team)
        stats = {
          wins: teamStats.wins || 0,
          draws: teamStats.draws || 0,
          losses: teamStats.losses || 0,
          goals_for: teamStats.goals_for || 0,
          goals_against: teamStats.goals_against || 0,
          points: teamStats.points || 0,
          position: 0,
          total_teams: 0
        };
      }

      const activeMembers = team.team_members?.filter((m: any) => m.is_active) || [];
      const teamWithDetails: TeamWithDetails = {
        ...team,
        league: team.league || null,
        captain,
        members: activeMembers,
        memberCount: activeMembers.length,
        availableSpots: Math.max(0, (team.max_players || 22) - activeMembers.length),
        stats,
        isOrphaned: !team.league_id,
        previousLeagueName: team.previous_league_name || undefined
      };

      // Cache for 5 minutes
      this.setCache(cacheKey, teamWithDetails, options.ttl || 300);

      return { data: teamWithDetails, error: null, success: true };

    } catch (error) {
      return {
        data: null,
        error: this.handleError(error, 'getTeamDetails'),
        success: false
      };
    }
  }

  /**
   * Get all teams for a user (where user is a member)
   */
  async getUserTeams(
    userId: string,
    options: { includeInactive?: boolean; limit?: number } = {}
  ): Promise<ServiceResponse<TeamWithDetails[]>> {
    try {
      const cacheKey = this.getCacheKey('getUserTeams', { userId, options });
      const cached = this.getFromCache<TeamWithDetails[]>(cacheKey);
      
      if (cached) {
        return { data: cached, error: null, success: true };
      }

      let memberQuery = this.supabase
        .from('team_members')
        .select(`
          *,
          team:teams!inner(
            *,
            league:leagues!inner(*)
          )
        `)
        .eq('user_id', userId);

      if (!options.includeInactive) {
        memberQuery = memberQuery.eq('is_active', true);
      }

      const { data: memberships, error: memberError } = await memberQuery
        .order('joined_at', { ascending: false })
        .limit(options.limit || 50);

      if (memberError) throw memberError;

      // Get detailed information for each team (avoid infinite recursion)
      const teamPromises = (memberships || []).map(async (membership) => {
        const teamDetails = await this.getTeamDetails(membership.team_id, { revalidateOnBackground: true });
        return teamDetails.data;
      });

      const teams = await Promise.all(teamPromises);
      const validTeams = teams.filter((team): team is TeamWithDetails => team !== null);

      // Cache for 5 minutes
      this.setCache(cacheKey, validTeams, 300);

      return { data: validTeams, error: null, success: true };

    } catch (error) {
      return {
        data: null,
        error: this.handleError(error, 'getUserTeams'),
        success: false
      };
    }
  }

  /**
   * Update team information
   */
  async updateTeam(
    teamId: string,
    captainId: string,
    updates: UpdateTeam
  ): Promise<ServiceResponse<Team>> {
    try {
      // Verify the user is the team captain
      const { data: team, error: verifyError } = await this.supabase
        .from('teams')
        .select('captain_id')
        .eq('id', teamId)
        .single();

      if (verifyError) throw verifyError;

      if (team.captain_id !== captainId) {
        return {
          data: null,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Only team captains can update team information',
            timestamp: new Date().toISOString()
          },
          success: false
        };
      }

      // Update team
      const { data: updatedTeam, error: updateError } = await this.supabase
        .from('teams')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', teamId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Clear caches
      this.clearCache('getTeamDetails');
      this.clearCache('getUserTeams');

      return { data: updatedTeam, error: null, success: true };

    } catch (error) {
      return {
        data: null,
        error: this.handleError(error, 'updateTeam'),
        success: false
      };
    }
  }

  /**
   * Find league by sport and location for team creation
   */
  async findLeagueByName(
    sport: string,
    leagueName: string
  ): Promise<ServiceResponse<League>> {
    try {
      const { data: league, error } = await this.supabase
        .from('leagues')
        .select('*')
        .eq('sport_type', sport.toLowerCase())
        .eq('name', leagueName)
        .eq('is_active', true)
        .eq('is_public', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            data: null,
            error: {
              code: 'LEAGUE_NOT_FOUND',
              message: 'No active league found with the specified name and sport',
              timestamp: new Date().toISOString()
            },
            success: false
          };
        }
        throw error;
      }

      return { data: league, error: null, success: true };

    } catch (error) {
      return {
        data: null,
        error: this.handleError(error, 'findLeagueByName'),
        success: false
      };
    }
  }

  /**
   * Search teams across leagues
   */
  async searchTeams(options: {
    query?: string;
    sport?: string;
    location?: string;
    hasAvailableSpots?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Promise<PaginatedServiceResponse<TeamWithDetails>> {
    try {
      let query = this.supabase
        .from('teams')
        .select(`
          *,
          league:leagues!inner(*)
        `, { count: 'exact' })
        .eq('league.is_active', true)
        .eq('league.is_public', true);

      if (options.query) {
        query = query.or(`name.ilike.%${options.query}%,team_bio.ilike.%${options.query}%`);
      }

      if (options.sport) {
        query = query.eq('league.sport_type', options.sport.toLowerCase());
      }

      if (options.location) {
        query = query.ilike('league.location', `%${options.location}%`);
      }

      if (options.hasAvailableSpots) {
        query = query.eq('is_recruiting', true);
      }

      const { data: teams, error, count } = await query
        .order('created_at', { ascending: false })
        .range(options.offset || 0, (options.offset || 0) + (options.limit || 20) - 1);

      if (error) throw error;

      // Get detailed information for each team
      const teamPromises = (teams || []).map(async (team) => {
        const teamDetails = await this.getTeamDetails(team.id);
        return teamDetails.data;
      });

      const detailedTeams = await Promise.all(teamPromises);
      const validTeams = detailedTeams.filter((team): team is TeamWithDetails => team !== null);

      // Filter by available spots if requested
      const filteredTeams = options.hasAvailableSpots 
        ? validTeams.filter(team => team.availableSpots > 0)
        : validTeams;

      const pagination = {
        page: Math.floor((options.offset || 0) / (options.limit || 20)) + 1,
        limit: options.limit || 20,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / (options.limit || 20)),
        hasNext: ((options.offset || 0) + (options.limit || 20)) < (count || 0),
        hasPrevious: (options.offset || 0) > 0
      };

      return {
        data: filteredTeams,
        error: null,
        success: true,
        pagination
      };

    } catch (error) {
      return {
        data: null,
        error: this.handleError(error, 'searchTeams'),
        success: false,
        pagination: {
          page: 1,
          limit: options.limit || 20,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrevious: false
        }
      };
    }
  }

  /**
   * Subscribe to real-time team updates
   */
  subscribeToTeamUpdates(
    teamId: string,
    callback: (payload: any) => void,
    options: RealtimeSubscriptionOptions = { table: 'teams', event: '*' }
  ) {
    return this.supabase
      .channel(`team-${teamId}-updates`)
      .on(
        'postgres_changes',
        {
          event: options.event,
          schema: options.schema || 'public',
          table: options.table,
          filter: options.filter || `id=eq.${teamId}`
        },
        callback
      )
      .subscribe();
  }

  /**
   * Clear cache for specific operations or all cache
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

  /**
   * Get all orphaned teams (teams without a league)
   */
  async getOrphanedTeams(options: {
    includeArchived?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Promise<PaginatedServiceResponse<TeamWithDetails>> {
    try {
      let query = this.supabase
        .from('teams')
        .select(`
          *,
          league:leagues(*),
          team_members(
            *,
            user_profile:users!inner(*)
          )
        `, { count: 'exact' })
        .is('league_id', null);

      if (!options.includeArchived) {
        query = query.eq('is_archived', false);
      }

      const { data: teams, error, count } = await query
        .order('updated_at', { ascending: false })
        .range(options.offset || 0, (options.offset || 0) + (options.limit || 20) - 1);

      if (error) throw error;

      // Get detailed information for each team
      const teamPromises = (teams || []).map(async (team) => {
        const teamDetails = await this.getTeamDetails(team.id);
        return teamDetails.data;
      });

      const detailedTeams = await Promise.all(teamPromises);
      const validTeams = detailedTeams.filter((team): team is TeamWithDetails => team !== null);

      const pagination = {
        page: Math.floor((options.offset || 0) / (options.limit || 20)) + 1,
        limit: options.limit || 20,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / (options.limit || 20)),
        hasNext: ((options.offset || 0) + (options.limit || 20)) < (count || 0),
        hasPrevious: (options.offset || 0) > 0
      };

      return {
        data: validTeams,
        error: null,
        success: true,
        pagination
      };

    } catch (error) {
      return {
        data: null,
        error: this.handleError(error, 'getOrphanedTeams'),
        success: false,
        pagination: {
          page: 1,
          limit: options.limit || 20,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrevious: false
        }
      };
    }
  }

  /**
   * Reassign an orphaned team to a new league
   */
  async reassignTeamToLeague(
    teamId: string,
    newLeagueId: string,
    userId: string
  ): Promise<ServiceResponse<TeamWithDetails>> {
    try {
      // Verify the user is the team captain
      const { data: team, error: verifyError } = await this.supabase
        .from('teams')
        .select('captain_id, name, league_id')
        .eq('id', teamId)
        .single();

      if (verifyError) throw verifyError;

      if (team.captain_id !== userId) {
        return {
          data: null,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Only team captains can reassign their team to a new league',
            timestamp: new Date().toISOString()
          },
          success: false
        };
      }

      // Verify the new league exists and is active
      const { data: league, error: leagueError } = await this.supabase
        .from('leagues')
        .select('*')
        .eq('id', newLeagueId)
        .eq('is_active', true)
        .single();

      if (leagueError) {
        if (leagueError.code === 'PGRST116') {
          return {
            data: null,
            error: {
              code: 'LEAGUE_NOT_FOUND',
              message: 'Selected league not found or is not active',
              timestamp: new Date().toISOString()
            },
            success: false
          };
        }
        throw leagueError;
      }

      // Check if team name is unique in the new league
      const { data: existingTeam, error: nameCheckError } = await this.supabase
        .from('teams')
        .select('id')
        .eq('league_id', newLeagueId)
        .eq('name', team.name)
        .neq('id', teamId)
        .single();

      if (nameCheckError && nameCheckError.code !== 'PGRST116') {
        throw nameCheckError;
      }

      if (existingTeam) {
        return {
          data: null,
          error: {
            code: 'TEAM_NAME_EXISTS',
            message: 'A team with this name already exists in the selected league',
            timestamp: new Date().toISOString()
          },
          success: false
        };
      }

      // Update the team
      const { data: updatedTeam, error: updateError } = await this.supabase
        .from('teams')
        .update({
          league_id: newLeagueId,
          previous_league_name: null,
          is_archived: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', teamId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Get the complete team details
      const teamDetails = await this.getTeamDetails(teamId);
      
      if (!teamDetails.success || !teamDetails.data) {
        throw new Error('Failed to retrieve updated team details');
      }

      // Clear caches
      this.clearCache('getTeamDetails');
      this.clearCache('getUserTeams');
      this.clearCache('getOrphanedTeams');

      return {
        data: teamDetails.data,
        error: null,
        success: true
      };

    } catch (error) {
      return {
        data: null,
        error: this.handleError(error, 'reassignTeamToLeague'),
        success: false
      };
    }
  }

  /**
   * Archive an orphaned team
   */
  async archiveTeam(
    teamId: string,
    userId: string
  ): Promise<ServiceResponse<Team>> {
    try {
      // Verify the user is the team captain
      const { data: team, error: verifyError } = await this.supabase
        .from('teams')
        .select('captain_id')
        .eq('id', teamId)
        .single();

      if (verifyError) throw verifyError;

      if (team.captain_id !== userId) {
        return {
          data: null,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Only team captains can archive their team',
            timestamp: new Date().toISOString()
          },
          success: false
        };
      }

      // Archive the team
      const { data: archivedTeam, error: updateError } = await this.supabase
        .from('teams')
        .update({
          is_archived: true,
          is_recruiting: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', teamId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Clear caches
      this.clearCache('getTeamDetails');
      this.clearCache('getUserTeams');
      this.clearCache('getOrphanedTeams');

      return { data: archivedTeam, error: null, success: true };

    } catch (error) {
      return {
        data: null,
        error: this.handleError(error, 'archiveTeam'),
        success: false
      };
    }
  }
}
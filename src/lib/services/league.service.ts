/**
 * League Service for MatchDay
 * 
 * Handles league discovery and joining operations with focus on:
 * - League discovery and filtering (read-only, no league creation)
 * - Advanced search and compatibility matching
 * - Join request management for teams within leagues
 * - Player's league membership tracking
 * 
 * Optimized for player-centric amateur sports league experience
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  Database,
  League,
  Team,
  LeagueDiscovery,
  LeagueFilters,
  ServiceResponse,
  ServiceError,
  PaginatedServiceResponse,
  TeamJoinRequest,
  JoinRequestStatus,
  SportType,
  LeagueType,
  CacheOptions,
  RealtimeSubscriptionOptions
} from '@/lib/types/database.types';

export interface LeagueCompatibilityScore {
  leagueId: string;
  score: number;
  factors: {
    skillMatch: number;
    locationProximity: number;
    scheduleCompatibility: number;
    teamAvailability: number;
    entryAffordability: number;
  };
  recommendations: string[];
}

export interface TeamAvailability {
  teamId: string;
  teamName: string;
  currentPlayers: number;
  maxPlayers: number;
  availableSpots: number;
  isRecruiting: boolean;
  requiredPositions: string[];
  captainContact?: {
    name: string;
    id: string;
  };
}

export class LeagueService {
  private static instance: LeagueService;
  private supabase: SupabaseClient<Database>;
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  private constructor(supabaseClient: SupabaseClient<Database>) {
    this.supabase = supabaseClient;
  }

  static getInstance(supabaseClient?: SupabaseClient<Database>): LeagueService {
    if (!LeagueService.instance) {
      if (!supabaseClient) {
        throw new Error('SupabaseClient required for first initialization');
      }
      LeagueService.instance = new LeagueService(supabaseClient);
    }
    return LeagueService.instance;
  }

  /**
   * Handle service errors consistently
   */
  private handleError(error: any, operation: string): ServiceError {
    console.error(`LeagueService.${operation}:`, error);
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
    return `league_service:${operation}:${JSON.stringify(params)}`;
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

  private setCache<T>(key: string, data: T, ttl = 600): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Discover available leagues with advanced filtering
   */
  async discoverLeagues(
    filters: LeagueFilters = {},
    options: {
      userId?: string;
      includeCompatibilityScore?: boolean;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<PaginatedServiceResponse<LeagueDiscovery>> {
    try {
      const cacheKey = this.getCacheKey('discoverLeagues', { filters, options: { ...options, userId: undefined } });
      const cached = this.getFromCache<LeagueDiscovery[]>(cacheKey);
      
      if (cached && !options.userId) {
        return { 
          data: cached, 
          error: null, 
          success: true,
          pagination: {
            page: Math.floor((options.offset || 0) / (options.limit || 20)) + 1,
            limit: options.limit || 20,
            total: cached.length,
            totalPages: Math.ceil(cached.length / (options.limit || 20)),
            hasNext: false,
            hasPrevious: false
          }
        };
      }

      // Build query with filters
      let query = this.supabase
        .from('leagues')
        .select(`
          *,
          teams (
            id,
            name,
            logo_url,
            team_color,
            captain_id,
            max_players,
            min_players,
            is_recruiting
          )
        `, { count: 'exact' })
        .eq('is_active', true)
        .eq('is_public', true);

      if (filters.sportType) {
        query = query.eq('sport_type', filters.sportType);
      }

      if (filters.leagueType) {
        query = query.eq('league_type', filters.leagueType);
      }

      if (filters.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }

      if (filters.entryFeeMax !== undefined) {
        query = query.lte('entry_fee', filters.entryFeeMax);
      }

      if (filters.seasonActive) {
        const now = new Date().toISOString();
        query = query.gte('season_end', now);
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data: leagues, error, count } = await query
        .order('created_at', { ascending: false })
        .range(options.offset || 0, (options.offset || 0) + (options.limit || 20) - 1);

      if (error) throw error;

      // Get user's current memberships if userId provided
      let userMemberships: string[] = [];
      if (options.userId) {
        const { data: memberships } = await this.supabase
          .from('team_members')
          .select(`
            team:teams!inner(league_id)
          `)
          .eq('user_id', options.userId)
          .eq('is_active', true);

        userMemberships = memberships?.map(m => m.team.league_id) || [];
      }

      // Process leagues into discovery format
      const discoveryLeagues: LeagueDiscovery[] = await Promise.all(
        (leagues || []).map(async (league) => {
          const teams = league.teams || [];
          const playerCount = await this.getLeaguePlayerCount(league.id);
          const availableSpots = await this.getLeagueAvailableSpots(league.id);
          
          let compatibilityScore;
          if (options.includeCompatibilityScore && options.userId) {
            const compatibility = await this.calculateCompatibilityScore(league.id, options.userId);
            compatibilityScore = compatibility.data?.score;
          }

          return {
            ...league,
            teams,
            teamCount: teams.length,
            playerCount: playerCount.data || 0,
            availableSpots: availableSpots.data || 0,
            isUserMember: userMemberships.includes(league.id),
            compatibilityScore
          };
        })
      );

      // Sort by compatibility score if available
      if (options.includeCompatibilityScore) {
        discoveryLeagues.sort((a, b) => (b.compatibilityScore || 0) - (a.compatibilityScore || 0));
      }

      // Cache results (without user-specific data)
      if (!options.userId) {
        this.setCache(cacheKey, discoveryLeagues, 600);
      }

      const pagination = {
        page: Math.floor((options.offset || 0) / (options.limit || 20)) + 1,
        limit: options.limit || 20,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / (options.limit || 20)),
        hasNext: ((options.offset || 0) + (options.limit || 20)) < (count || 0),
        hasPrevious: (options.offset || 0) > 0
      };

      return {
        data: discoveryLeagues,
        error: null,
        success: true,
        pagination
      };

    } catch (error) {
      return {
        data: null,
        error: this.handleError(error, 'discoverLeagues'),
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
   * Get detailed league information
   */
  async getLeagueDetails(
    leagueId: string,
    options: { userId?: string } = {}
  ): Promise<ServiceResponse<LeagueDiscovery>> {
    try {
      const cacheKey = this.getCacheKey('getLeagueDetails', { leagueId });
      const cached = this.getFromCache<LeagueDiscovery>(cacheKey);
      
      if (cached && !options.userId) {
        return { data: cached, error: null, success: true };
      }

      // Get league with teams
      const { data: league, error: leagueError } = await this.supabase
        .from('leagues')
        .select(`
          *,
          teams (
            *,
            team_members!inner (
              user_id,
              position,
              jersey_number,
              is_active
            )
          )
        `)
        .eq('id', leagueId)
        .eq('is_active', true)
        .single();

      if (leagueError) {
        if (leagueError.code === 'PGRST116') {
          return {
            data: null,
            error: { code: 'LEAGUE_NOT_FOUND', message: 'League not found', timestamp: new Date().toISOString() },
            success: false
          };
        }
        throw leagueError;
      }

      // Calculate additional metrics
      const teams = league.teams || [];
      const playerCount = teams.reduce((sum, team) => sum + (team.team_members?.length || 0), 0);
      const availableSpots = teams.reduce((sum, team) => {
        const currentPlayers = team.team_members?.filter(m => m.is_active)?.length || 0;
        return sum + Math.max(0, (team.max_players || 11) - currentPlayers);
      }, 0);

      // Check if user is member
      let isUserMember = false;
      let joinRequests: TeamJoinRequest[] = [];
      
      if (options.userId) {
        const { data: membership } = await this.supabase
          .from('team_members')
          .select('id')
          .eq('user_id', options.userId)
          .eq('is_active', true)
          .in('team_id', teams.map(t => t.id))
          .limit(1);

        isUserMember = (membership?.length || 0) > 0;

        // Get user's join requests for this league
        const { data: requests } = await this.supabase
          .from('team_join_requests')
          .select('*')
          .eq('user_id', options.userId)
          .in('team_id', teams.map(t => t.id))
          .in('status', ['pending', 'approved']);

        joinRequests = requests || [];
      }

      const leagueDiscovery: LeagueDiscovery = {
        ...league,
        teams,
        teamCount: teams.length,
        playerCount,
        availableSpots,
        isUserMember,
        joinRequests: options.userId ? joinRequests : undefined
      };

      // Cache if not user-specific
      if (!options.userId) {
        this.setCache(cacheKey, leagueDiscovery, 300);
      }

      return { data: leagueDiscovery, error: null, success: true };

    } catch (error) {
      return {
        data: null,
        error: this.handleError(error, 'getLeagueDetails'),
        success: false
      };
    }
  }

  /**
   * Calculate compatibility score between user and league
   */
  async calculateCompatibilityScore(
    leagueId: string,
    userId: string
  ): Promise<ServiceResponse<LeagueCompatibilityScore>> {
    try {
      const cacheKey = this.getCacheKey('calculateCompatibilityScore', { leagueId, userId });
      const cached = this.getFromCache<LeagueCompatibilityScore>(cacheKey);
      
      if (cached) {
        return { data: cached, error: null, success: true };
      }

      // Get league details
      const leagueResponse = await this.getLeagueDetails(leagueId);
      if (!leagueResponse.success || !leagueResponse.data) {
        throw new Error('League not found');
      }

      const league = leagueResponse.data;

      // Get user profile and stats
      const { data: userProfile, error: profileError } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      // Get user's cross-league stats
      const { data: userStats } = await this.supabase
        .from('player_cross_league_stats')
        .select('*')
        .eq('player_id', userId)
        .eq('season_year', new Date().getFullYear())
        .single();

      // Calculate compatibility factors
      const factors = {
        skillMatch: this.calculateSkillMatch(league, userStats),
        locationProximity: this.calculateLocationProximity(league, userProfile),
        scheduleCompatibility: this.calculateScheduleCompatibility(league),
        teamAvailability: this.calculateTeamAvailability(league),
        entryAffordability: this.calculateEntryAffordability(league, userProfile)
      };

      // Calculate overall score (weighted average)
      const weights = {
        skillMatch: 0.3,
        locationProximity: 0.2,
        scheduleCompatibility: 0.2,
        teamAvailability: 0.2,
        entryAffordability: 0.1
      };

      const score = Math.round(
        factors.skillMatch * weights.skillMatch +
        factors.locationProximity * weights.locationProximity +
        factors.scheduleCompatibility * weights.scheduleCompatibility +
        factors.teamAvailability * weights.teamAvailability +
        factors.entryAffordability * weights.entryAffordability
      );

      // Generate recommendations
      const recommendations = this.generateRecommendations(factors, league);

      const compatibility: LeagueCompatibilityScore = {
        leagueId,
        score,
        factors,
        recommendations
      };

      // Cache for 30 minutes
      this.setCache(cacheKey, compatibility, 1800);

      return { data: compatibility, error: null, success: true };

    } catch (error) {
      return {
        data: null,
        error: this.handleError(error, 'calculateCompatibilityScore'),
        success: false
      };
    }
  }

  /**
   * Get available teams in a league for joining
   */
  async getAvailableTeams(
    leagueId: string,
    options: { userId?: string } = {}
  ): Promise<ServiceResponse<TeamAvailability[]>> {
    try {
      const { data: teams, error } = await this.supabase
        .from('teams')
        .select(`
          *,
          team_members!inner (
            id,
            user_id,
            position,
            is_active
          )
        `)
        .eq('league_id', leagueId)
        .eq('is_recruiting', true);

      if (error) throw error;

      // Get captain details
      const captainIds = teams?.map(t => t.captain_id).filter(Boolean) || [];
      const { data: captains } = captainIds.length > 0 ? await this.supabase
        .from('user_profiles')
        .select('id, display_name')
        .in('id', captainIds) : { data: [] };

      const teamAvailabilities: TeamAvailability[] = (teams || []).map(team => {
        const activeMembers = team.team_members?.filter(m => m.is_active) || [];
        const captain = captains?.find(c => c.id === team.captain_id);
        
        // Calculate required positions (simplified - would need more complex logic)
        const requiredPositions = this.getRequiredPositions(team, activeMembers);

        return {
          teamId: team.id,
          teamName: team.name,
          currentPlayers: activeMembers.length,
          maxPlayers: team.max_players || 11,
          availableSpots: Math.max(0, (team.max_players || 11) - activeMembers.length),
          isRecruiting: team.is_recruiting,
          requiredPositions,
          captainContact: captain ? {
            name: captain.display_name,
            id: captain.id
          } : undefined
        };
      });

      // Filter out full teams
      const availableTeams = teamAvailabilities.filter(team => team.availableSpots > 0);

      return { data: availableTeams, error: null, success: true };

    } catch (error) {
      return {
        data: null,
        error: this.handleError(error, 'getAvailableTeams'),
        success: false
      };
    }
  }

  /**
   * Get player's league memberships
   */
  async getPlayerLeagueMemberships(
    userId: string
  ): Promise<ServiceResponse<Array<LeagueDiscovery & {
    teamMembership: {
      teamId: string;
      teamName: string;
      position?: string;
      jerseyNumber?: number;
      joinedAt: string;
    };
  }>>> {
    try {
      const cacheKey = this.getCacheKey('getPlayerLeagueMemberships', { userId });
      const cached = this.getFromCache<any>(cacheKey);
      
      if (cached) {
        return { data: cached, error: null, success: true };
      }

      const { data: memberships, error } = await this.supabase
        .from('team_members')
        .select(`
          *,
          team:teams!inner (
            *,
            league:leagues!inner (*)
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;

      // Process into league discovery format with membership details
      const leagueMemberships = await Promise.all(
        (memberships || []).map(async (membership) => {
          const league = membership.team.league;
          const playerCount = await this.getLeaguePlayerCount(league.id);
          const availableSpots = await this.getLeagueAvailableSpots(league.id);

          // Get all teams in the league
          const { data: allTeams } = await this.supabase
            .from('teams')
            .select('*')
            .eq('league_id', league.id);

          return {
            ...league,
            teams: allTeams || [],
            teamCount: allTeams?.length || 0,
            playerCount: playerCount.data || 0,
            availableSpots: availableSpots.data || 0,
            isUserMember: true,
            teamMembership: {
              teamId: membership.team_id,
              teamName: membership.team.name,
              position: membership.position,
              jerseyNumber: membership.jersey_number,
              joinedAt: membership.joined_at
            }
          };
        })
      );

      // Cache for 5 minutes
      this.setCache(cacheKey, leagueMemberships, 300);

      return { data: leagueMemberships, error: null, success: true };

    } catch (error) {
      return {
        data: null,
        error: this.handleError(error, 'getPlayerLeagueMemberships'),
        success: false
      };
    }
  }

  /**
   * Private helper methods
   */
  private async getLeaguePlayerCount(leagueId: string): Promise<ServiceResponse<number>> {
    try {
      const { data, error } = await this.supabase
        .rpc('get_league_player_count', { league_id: leagueId });

      if (error) throw error;
      return { data: data || 0, error: null, success: true };
    } catch (error) {
      return { data: null, error: this.handleError(error, 'getLeaguePlayerCount'), success: false };
    }
  }

  private async getLeagueAvailableSpots(leagueId: string): Promise<ServiceResponse<number>> {
    try {
      const { data, error } = await this.supabase
        .rpc('get_league_available_spots', { league_id: leagueId });

      if (error) throw error;
      return { data: data || 0, error: null, success: true };
    } catch (error) {
      return { data: null, error: this.handleError(error, 'getLeagueAvailableSpots'), success: false };
    }
  }

  private calculateSkillMatch(league: LeagueDiscovery, userStats: any): number {
    if (!userStats) return 50; // Neutral score for new players

    const avgGoalsPerGame = userStats.avg_goals_per_game || 0;
    const totalGames = userStats.total_games_played || 0;

    // Simple skill matching logic
    if (league.league_type === 'casual' && totalGames < 10) return 85;
    if (league.league_type === 'competitive' && avgGoalsPerGame > 0.5) return 80;
    if (league.league_type === 'friendly') return 75;
    
    return 60;
  }

  private calculateLocationProximity(league: LeagueDiscovery, userProfile: any): number {
    // Simplified location matching - would need geolocation in real implementation
    if (!league.location || !userProfile.location) return 50;
    
    const leagueLocation = league.location.toLowerCase();
    const userLocation = userProfile.location.toLowerCase();
    
    if (leagueLocation.includes(userLocation) || userLocation.includes(leagueLocation)) {
      return 90;
    }
    
    return 40;
  }

  private calculateScheduleCompatibility(league: LeagueDiscovery): number {
    const now = new Date();
    const seasonStart = new Date(league.season_start || now);
    const seasonEnd = new Date(league.season_end || now);
    
    // Check if season is upcoming or current
    if (seasonStart > now) return 85; // Upcoming season
    if (seasonEnd > now) return 70; // Current season
    
    return 30; // Past season
  }

  private calculateTeamAvailability(league: LeagueDiscovery): number {
    if (league.availableSpots === 0) return 0;
    if (league.availableSpots > 10) return 95;
    if (league.availableSpots > 5) return 80;
    return 60;
  }

  private calculateEntryAffordability(league: LeagueDiscovery, userProfile: any): number {
    const entryFee = league.entry_fee || 0;
    
    // Simplified affordability calculation
    if (entryFee === 0) return 100;
    if (entryFee < 50) return 85;
    if (entryFee < 100) return 70;
    return 50;
  }

  private generateRecommendations(factors: any, league: LeagueDiscovery): string[] {
    const recommendations: string[] = [];
    
    if (factors.skillMatch < 60) {
      recommendations.push('Consider improving your skills before joining this competitive league');
    }
    
    if (factors.locationProximity < 50) {
      recommendations.push('This league might be far from your location');
    }
    
    if (factors.teamAvailability < 50) {
      recommendations.push('Limited team spots available - apply soon');
    }
    
    if (factors.entryAffordability < 60) {
      recommendations.push('Entry fee might be higher than average');
    }
    
    return recommendations;
  }

  private getRequiredPositions(team: any, activeMembers: any[]): string[] {
    // Simplified position requirement logic
    const positions = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'];
    const occupiedPositions = activeMembers.map(m => m.position).filter(Boolean);
    
    return positions.filter(pos => !occupiedPositions.includes(pos));
  }

  /**
   * Subscribe to real-time league updates
   */
  subscribeToLeagueUpdates(
    leagueId: string,
    callback: (payload: any) => void,
    options: RealtimeSubscriptionOptions = { table: 'leagues', event: '*' }
  ) {
    return this.supabase
      .channel(`league-${leagueId}-updates`)
      .on(
        'postgres_changes',
        {
          event: options.event,
          schema: options.schema || 'public',
          table: options.table,
          filter: options.filter || `id=eq.${leagueId}`
        },
        callback
      )
      .subscribe();
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
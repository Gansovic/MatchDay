/**
 * Enhanced Player Service for MatchDay
 * 
 * Handles comprehensive player-related operations with focus on:
 * - Player profiles and cross-league statistics
 * - Achievement tracking and progress
 * - Performance analytics and rankings
 * - Team memberships and join requests
 * 
 * Optimized for amateur sports leagues with proper error handling,
 * caching strategies, and real-time updates.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { 
  Database, 
  UserProfile, 
  PlayerStats, 
  PlayerProfileExtended, 
  PlayerCrossLeagueStats,
  ServiceResponse,
  ServiceError,
  PaginatedServiceResponse,
  TeamJoinRequest,
  JoinRequestStatus,
  Achievement,
  UserAchievement,
  CacheOptions,
  RealtimeSubscriptionOptions
} from '@matchday/database';

export class PlayerService {
  private static instance: PlayerService;
  private supabase: SupabaseClient<Database>;
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  private constructor(supabaseClient: SupabaseClient<Database>) {
    this.supabase = supabaseClient;
  }

  static getInstance(supabaseClient?: SupabaseClient<Database>): PlayerService {
    if (!PlayerService.instance) {
      if (!supabaseClient) {
        throw new Error('SupabaseClient required for first initialization');
      }
      PlayerService.instance = new PlayerService(supabaseClient);
    }
    return PlayerService.instance;
  }

  /**
   * Handle service errors consistently
   */
  private handleError(error: any, operation: string): ServiceError {
    console.error(`PlayerService.${operation}:`, error);
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
    return `player_service:${operation}:${JSON.stringify(params)}`;
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
   * Get comprehensive player profile with all related data
   */
  async getPlayerProfile(userId: string, options: CacheOptions = {}): Promise<ServiceResponse<PlayerProfileExtended>> {
    try {
      const cacheKey = this.getCacheKey('getPlayerProfile', { userId });
      const cached = this.getFromCache<PlayerProfileExtended>(cacheKey);
      
      if (cached && !options.revalidateOnBackground) {
        return { data: cached, error: null, success: true };
      }

      // Get basic profile
      const { data: profile, error: profileError } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          return { 
            data: null, 
            error: { code: 'PLAYER_NOT_FOUND', message: 'Player not found', timestamp: new Date().toISOString() }, 
            success: false 
          };
        }
        throw profileError;
      }

      // Get team memberships with league details
      const { data: teamMemberships, error: teamsError } = await this.supabase
        .from('team_members')
        .select(`
          *,
          team:teams!inner(
            *,
            league:leagues!inner(*)
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true);

      if (teamsError) throw teamsError;

      // Get achievements
      const { data: userAchievements, error: achievementsError } = await this.supabase
        .from('user_achievements')
        .select(`
          *,
          achievement:achievements!inner(*)
        `)
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });

      if (achievementsError) throw achievementsError;

      // Get cross-league stats
      const { data: crossLeagueStats, error: crossStatsError } = await this.supabase
        .from('player_cross_league_stats')
        .select('*')
        .eq('player_id', userId)
        .eq('season_year', new Date().getFullYear())
        .single();

      // Don't throw error if no cross-league stats exist
      if (crossStatsError && crossStatsError.code !== 'PGRST116') {
        throw crossStatsError;
      }

      // Get global rankings
      const globalRankings = await this.getPlayerGlobalRankings(userId);

      const playerProfile: PlayerProfileExtended = {
        ...profile,
        teams: teamMemberships?.map(tm => ({
          team: tm.team as any,
          membership: tm
        })) || [],
        achievements: userAchievements?.map(ua => ({
          achievement: ua.achievement as Achievement,
          userAchievement: ua
        })) || [],
        crossLeagueStats: crossLeagueStats || null,
        globalRankings: globalRankings.data || {
          goals: null,
          assists: null,
          matches: null
        }
      };

      // Cache the result
      this.setCache(cacheKey, playerProfile, options.ttl || 300);

      return { data: playerProfile, error: null, success: true };

    } catch (error) {
      return {
        data: null,
        error: this.handleError(error, 'getPlayerProfile'),
        success: false
      };
    }
  }

  /**
   * Update player profile information
   */
  async updatePlayerProfile(
    userId: string, 
    updates: Partial<Database['public']['Tables']['user_profiles']['Update']>
  ): Promise<ServiceResponse<UserProfile>> {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      // Invalidate cache
      const cacheKey = this.getCacheKey('getPlayerProfile', { userId });
      this.cache.delete(cacheKey);

      return { data, error: null, success: true };

    } catch (error) {
      return {
        data: null,
        error: this.handleError(error, 'updatePlayerProfile'),
        success: false
      };
    }
  }

  /**
   * Get player's cross-league statistics aggregation
   */
  async getCrossLeagueStats(userId: string, seasonYear?: number): Promise<ServiceResponse<PlayerCrossLeagueStats>> {
    try {
      const year = seasonYear || new Date().getFullYear();
      const cacheKey = this.getCacheKey('getCrossLeagueStats', { userId, year });
      const cached = this.getFromCache<PlayerCrossLeagueStats>(cacheKey);
      
      if (cached) {
        return { data: cached, error: null, success: true };
      }

      const { data, error } = await this.supabase
        .from('player_cross_league_stats')
        .select('*')
        .eq('player_id', userId)
        .eq('season_year', year)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      // Cache for 10 minutes
      this.setCache(cacheKey, data, 600);

      return { data: data || null, error: null, success: true };

    } catch (error) {
      return {
        data: null,
        error: this.handleError(error, 'getCrossLeagueStats'),
        success: false
      };
    }
  }

  /**
   * Get player's global rankings across different stats
   */
  async getPlayerGlobalRankings(userId: string): Promise<ServiceResponse<{
    goals: { rank: number; total: number; percentile: number } | null;
    assists: { rank: number; total: number; percentile: number } | null;
    matches: { rank: number; total: number; percentile: number } | null;
  }>> {
    try {
      const cacheKey = this.getCacheKey('getPlayerGlobalRankings', { userId });
      const cached = this.getFromCache<any>(cacheKey);
      
      if (cached) {
        return { data: cached, error: null, success: true };
      }

      // Get rankings for different stats using stored procedures
      const [goalsRank, assistsRank, matchesRank] = await Promise.allSettled([
        this.supabase.rpc('get_player_global_rank', { 
          player_id: userId, 
          stat_column: 'total_goals' 
        }),
        this.supabase.rpc('get_player_global_rank', { 
          player_id: userId, 
          stat_column: 'total_assists' 
        }),
        this.supabase.rpc('get_player_global_rank', { 
          player_id: userId, 
          stat_column: 'total_games_played' 
        })
      ]);

      const rankings = {
        goals: goalsRank.status === 'fulfilled' && goalsRank.value.data ? {
          rank: goalsRank.value.data.rank,
          total: goalsRank.value.data.total_players,
          percentile: Math.round((1 - (goalsRank.value.data.rank / goalsRank.value.data.total_players)) * 100)
        } : null,
        assists: assistsRank.status === 'fulfilled' && assistsRank.value.data ? {
          rank: assistsRank.value.data.rank,
          total: assistsRank.value.data.total_players,
          percentile: Math.round((1 - (assistsRank.value.data.rank / assistsRank.value.data.total_players)) * 100)
        } : null,
        matches: matchesRank.status === 'fulfilled' && matchesRank.value.data ? {
          rank: matchesRank.value.data.rank,
          total: matchesRank.value.data.total_players,
          percentile: Math.round((1 - (matchesRank.value.data.rank / matchesRank.value.data.total_players)) * 100)
        } : null
      };

      // Cache for 30 minutes
      this.setCache(cacheKey, rankings, 1800);

      return { data: rankings, error: null, success: true };

    } catch (error) {
      return {
        data: null,
        error: this.handleError(error, 'getPlayerGlobalRankings'),
        success: false
      };
    }
  }

  /**
   * Get player's achievements with progress tracking
   */
  async getPlayerAchievements(userId: string, options: {
    category?: string;
    completed?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Promise<PaginatedServiceResponse<{
    achievement: Achievement;
    userAchievement: UserAchievement | null;
    progress?: {
      current: number;
      target: number;
      percentage: number;
    };
  }>> {
    try {
      let query = this.supabase
        .from('achievements')
        .select(`
          *,
          user_achievements!left(*)
        `)
        .eq('is_active', true);

      if (options.category) {
        query = query.eq('category', options.category);
      }

      if (options.completed !== undefined) {
        if (options.completed) {
          query = query.not('user_achievements', 'is', null);
        } else {
          query = query.is('user_achievements', null);
        }
      }

      const { data: achievements, error, count } = await query
        .order('sort_order')
        .range(options.offset || 0, (options.offset || 0) + (options.limit || 50) - 1);

      if (error) throw error;

      // Get current player stats for progress calculation
      const playerStats = await this.getCrossLeagueStats(userId);
      const stats = playerStats.data;

      const achievementData = achievements?.map(achievement => {
        const userAchievement = achievement.user_achievements?.find(
          (ua: any) => ua.user_id === userId
        );

        // Calculate progress if not completed
        let progress;
        if (!userAchievement && stats) {
          const requirements = achievement.requirements as any;
          let current = 0;
          let target = 0;

          if (requirements.goals) {
            current = stats.total_goals || 0;
            target = requirements.goals;
          } else if (requirements.assists) {
            current = stats.total_assists || 0;
            target = requirements.assists;
          } else if (requirements.matches_played) {
            current = stats.total_games_played || 0;
            target = requirements.matches_played;
          }

          if (target > 0) {
            progress = {
              current,
              target,
              percentage: Math.min(100, Math.round((current / target) * 100))
            };
          }
        }

        return {
          achievement,
          userAchievement: userAchievement || null,
          progress
        };
      }) || [];

      const pagination = {
        page: Math.floor((options.offset || 0) / (options.limit || 50)) + 1,
        limit: options.limit || 50,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / (options.limit || 50)),
        hasNext: ((options.offset || 0) + (options.limit || 50)) < (count || 0),
        hasPrevious: (options.offset || 0) > 0
      };

      return {
        data: achievementData,
        error: null,
        success: true,
        pagination
      };

    } catch (error) {
      return {
        data: null,
        error: this.handleError(error, 'getPlayerAchievements'),
        success: false
      };
    }
  }

  /**
   * Get player's team join requests
   */
  async getTeamJoinRequests(
    userId: string,
    options: { status?: JoinRequestStatus; limit?: number } = {}
  ): Promise<ServiceResponse<Array<TeamJoinRequest & {
    team: Database['public']['Tables']['teams']['Row'];
    league: Database['public']['Tables']['leagues']['Row'];
  }>>> {
    try {
      let query = this.supabase
        .from('team_join_requests')
        .select(`
          *,
          team:teams!inner(
            *,
            league:leagues!inner(*)
          )
        `)
        .eq('user_id', userId);

      if (options.status) {
        query = query.eq('status', options.status);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(options.limit || 50);

      if (error) throw error;

      return { data: data || [], error: null, success: true };

    } catch (error) {
      return {
        data: null,
        error: this.handleError(error, 'getTeamJoinRequests'),
        success: false
      };
    }
  }

  /**
   * Submit a team join request
   */
  async submitTeamJoinRequest(
    userId: string,
    teamId: string,
    options: {
      message?: string;
      preferredPosition?: string;
      requestedJerseyNumber?: number;
    } = {}
  ): Promise<ServiceResponse<TeamJoinRequest>> {
    try {
      // Check if user already has a pending request for this team
      const { data: existing, error: checkError } = await this.supabase
        .from('team_join_requests')
        .select('id')
        .eq('user_id', userId)
        .eq('team_id', teamId)
        .eq('status', 'pending')
        .single();

      if (checkError && checkError.code !== 'PGRST116') throw checkError;

      if (existing) {
        return {
          data: null,
          error: {
            code: 'DUPLICATE_REQUEST',
            message: 'You already have a pending request for this team',
            timestamp: new Date().toISOString()
          },
          success: false
        };
      }

      const { data, error } = await this.supabase
        .from('team_join_requests')
        .insert({
          user_id: userId,
          team_id: teamId,
          message: options.message,
          preferred_position: options.preferredPosition,
          requested_jersey_number: options.requestedJerseyNumber,
          status: 'pending',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        })
        .select()
        .single();

      if (error) throw error;

      return { data, error: null, success: true };

    } catch (error) {
      return {
        data: null,
        error: this.handleError(error, 'submitTeamJoinRequest'),
        success: false
      };
    }
  }

  /**
   * Withdraw a team join request
   */
  async withdrawTeamJoinRequest(userId: string, requestId: string): Promise<ServiceResponse<boolean>> {
    try {
      const { data, error } = await this.supabase
        .from('team_join_requests')
        .update({ status: 'withdrawn' })
        .eq('id', requestId)
        .eq('user_id', userId)
        .eq('status', 'pending')
        .select()
        .single();

      if (error) throw error;

      return { data: true, error: null, success: true };

    } catch (error) {
      return {
        data: null,
        error: this.handleError(error, 'withdrawTeamJoinRequest'),
        success: false
      };
    }
  }

  /**
   * Search for players across leagues
   */
  async searchPlayers(options: {
    query?: string;
    leagueId?: string;
    sportType?: string;
    minGames?: number;
    limit?: number;
    offset?: number;
  } = {}): Promise<PaginatedServiceResponse<PlayerCrossLeagueStats>> {
    try {
      let query = this.supabase
        .from('player_cross_league_stats')
        .select('*', { count: 'exact' })
        .eq('season_year', new Date().getFullYear());

      if (options.query) {
        query = query.ilike('display_name', `%${options.query}%`);
      }

      if (options.minGames) {
        query = query.gte('total_games_played', options.minGames);
      }

      const { data, error, count } = await query
        .order('total_goals', { ascending: false })
        .range(options.offset || 0, (options.offset || 0) + (options.limit || 20) - 1);

      if (error) throw error;

      const pagination = {
        page: Math.floor((options.offset || 0) / (options.limit || 20)) + 1,
        limit: options.limit || 20,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / (options.limit || 20)),
        hasNext: ((options.offset || 0) + (options.limit || 20)) < (count || 0),
        hasPrevious: (options.offset || 0) > 0
      };

      return {
        data: data || [],
        error: null,
        success: true,
        pagination
      };

    } catch (error) {
      return {
        data: null,
        error: this.handleError(error, 'searchPlayers'),
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
   * Subscribe to real-time updates for player data
   */
  subscribeToPlayerUpdates(
    userId: string,
    callback: (payload: any) => void,
    options: RealtimeSubscriptionOptions = { table: 'user_profiles', event: '*' }
  ) {
    return this.supabase
      .channel(`player-${userId}-updates`)
      .on(
        'postgres_changes',
        {
          event: options.event,
          schema: options.schema || 'public',
          table: options.table,
          filter: options.filter || `id=eq.${userId}`
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
}
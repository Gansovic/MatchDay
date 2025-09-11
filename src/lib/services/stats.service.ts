/**
 * Stats Service for MatchDay
 * 
 * Handles comprehensive performance analytics operations with focus on:
 * - Individual player statistics and trends
 * - Cross-league performance comparisons
 * - Global rankings and leaderboards
 * - Performance trend analysis and predictions
 * 
 * Optimized for providing deep insights into player performance across leagues
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  Database,
  PlayerStats,
  PlayerCrossLeagueStats,
  LeagueComparison,
  PerformanceTrend,
  GlobalRanking,
  ServiceResponse,
  ServiceError,
  PaginatedServiceResponse,
  SportType,
  LeagueType,
  CacheOptions,
  RealtimeSubscriptionOptions
} from '@/lib/types/database.types';

export interface StatsFilters {
  sportType?: SportType;
  leagueType?: LeagueType;
  seasonYear?: number;
  minGames?: number;
  position?: string;
  ageGroup?: 'under_18' | 'under_21' | 'under_25' | 'over_25' | 'all';
}

export interface PlayerPerformanceAnalysis {
  playerId: string;
  playerName: string;
  avatarUrl?: string;
  overallRating: number;
  strengths: string[];
  improvements: string[];
  trends: {
    goals: PerformanceTrend[];
    assists: PerformanceTrend[];
    overall: PerformanceTrend[];
  };
  comparisons: {
    vsLeagueAverage: {
      goals: number;
      assists: number;
      performance: number;
    };
    vsPositionAverage: {
      goals: number;
      assists: number;
      performance: number;
    };
    improvement: {
      last30Days: number;
      last3Months: number;
      season: number;
    };
  };
  predictions: {
    seasonEndGoals: number;
    seasonEndAssists: number;
    confidenceLevel: number;
  };
}

export interface LeagueAnalytics {
  leagueId: string;
  leagueName: string;
  sportType: SportType;
  totalPlayers: number;
  totalTeams: number;
  totalMatches: number;
  averageGoalsPerGame: number;
  competitiveness: {
    score: number;
    description: string;
  };
  topPerformers: {
    goals: GlobalRanking[];
    assists: GlobalRanking[];
    overall: GlobalRanking[];
  };
  trends: {
    playerGrowth: number;
    matchActivity: number;
    competitiveBalance: number;
  };
  insights: string[];
}

export interface CrossLeagueComparison {
  playerId: string;
  playerName: string;
  leagues: Array<{
    league: Database['public']['Tables']['leagues']['Row'];
    stats: PlayerStats;
    rank: {
      goals: number;
      assists: number;
      overall: number;
    };
    performance: {
      goalsPerGame: number;
      assistsPerGame: number;
      consistency: number;
      improvement: number;
    };
    adaptability: {
      score: number;
      factors: string[];
    };
  }>;
  overallAnalysis: {
    versatility: number;
    consistency: number;
    adaptability: number;
    growthPotential: number;
  };
  recommendations: string[];
}

export class StatsService {
  private static instance: StatsService;
  private supabase: SupabaseClient<Database>;
  private cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>();

  private constructor(supabaseClient: SupabaseClient<Database>) {
    this.supabase = supabaseClient;
  }

  static getInstance(supabaseClient?: SupabaseClient<Database>): StatsService {
    if (!StatsService.instance) {
      if (!supabaseClient) {
        throw new Error('SupabaseClient required for first initialization');
      }
      StatsService.instance = new StatsService(supabaseClient);
    }
    return StatsService.instance;
  }

  /**
   * Handle service errors consistently
   */
  private handleError(error: unknown, operation: string): ServiceError {
    console.error(`StatsService.${operation}:`, {
      error,
      errorType: typeof error,
      errorKeys: error ? Object.keys(error) : [],
      errorCode: error?.code,
      errorMessage: error?.message,
      stack: error?.stack
    });
    
    // Handle specific database errors
    if (error?.code === 'PGRST116') {
      return {
        code: 'NOT_FOUND',
        message: 'No data found for the requested user',
        details: { originalError: error, operation },
        timestamp: new Date().toISOString()
      };
    }
    
    // Handle empty error objects
    if (!error || (typeof error === 'object' && Object.keys(error).length === 0)) {
      return {
        code: 'EMPTY_ERROR',
        message: 'An unknown error occurred with no error details',
        details: { operation, receivedError: error },
        timestamp: new Date().toISOString()
      };
    }
    
    return {
      code: error?.code || 'UNKNOWN_ERROR',
      message: error?.message || 'An unexpected error occurred',
      details: error?.details || error,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Cache management utilities
   */
  private getCacheKey(operation: string, params: unknown): string {
    return `stats_service:${operation}:${JSON.stringify(params)}`;
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

  private setCache<T>(key: string, data: T, ttl = 900): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Get comprehensive player performance analysis
   */
  async getPlayerPerformanceAnalysis(
    userId: string,
    options: {
      seasonYear?: number;
      includeComparisons?: boolean;
      includePredictions?: boolean;
    } = {}
  ): Promise<ServiceResponse<PlayerPerformanceAnalysis>> {
    try {
      const cacheKey = this.getCacheKey('getPlayerPerformanceAnalysis', { userId, options });
      const cached = this.getFromCache<PlayerPerformanceAnalysis>(cacheKey);
      
      if (cached) {
        return { data: cached, error: null, success: true };
      }

      const seasonYear = options.seasonYear || new Date().getFullYear();

      // Get player profile
      const { data: profile, error: profileError } = await this.supabase
        .from('users')
        .select('display_name, avatar_url, preferred_position')
        .eq('id', userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') throw profileError;
      
      // If no profile exists, create a default one for the analysis
      const playerProfile = profile || {
        display_name: 'Unknown Player',
        avatar_url: null,
        preferred_position: null
      };

      // Try to get cross-league stats (table may not exist yet)
      let crossLeagueStats = null;
      try {
        const { data: stats, error: statsError } = await this.supabase
          .from('player_cross_league_stats')
          .select('*')
          .eq('player_id', userId)
          .eq('season_year', seasonYear)
          .single();

        if (statsError && statsError.code !== 'PGRST116') {
          console.warn('player_cross_league_stats table not found, will generate stats from player_stats');
        } else {
          crossLeagueStats = stats;
        }
      } catch (error) {
        console.warn('player_cross_league_stats table not available, using fallback approach');
      }

      // Get individual league stats for detailed analysis
      const { data: leagueStats, error: leagueError } = await this.supabase
        .from('player_stats')
        .select(`
          *,
          league:leagues!inner(*),
          team:teams!inner(*)
        `)
        .eq('player_id', userId)
        .eq('season_year', seasonYear);

      if (leagueError) throw leagueError;

      // If no cross-league stats, generate them from individual league stats
      if (!crossLeagueStats && leagueStats && leagueStats.length > 0) {
        crossLeagueStats = this.generateCrossLeagueStatsFromPlayerStats(leagueStats);
      }

      // Calculate performance trends (with error handling)
      let trends;
      try {
        trends = await this.calculatePerformanceTrends(userId, seasonYear);
      } catch (trendsError) {
        console.warn('Failed to calculate performance trends:', trendsError);
        trends = { data: { goals: [], assists: [], overall: [] }, error: null, success: false };
      }

      // Calculate overall rating
      const overallRating = this.calculateOverallRating(crossLeagueStats, leagueStats || []);

      // Analyze strengths and improvements
      const { strengths, improvements } = this.analyzePlayerStrengthsAndWeaknesses(
        crossLeagueStats,
        leagueStats || []
      );

      // Calculate comparisons if requested
      let comparisons;
      if (options.includeComparisons) {
        comparisons = await this.calculatePlayerComparisons(
          userId,
          playerProfile.preferred_position,
          crossLeagueStats,
          seasonYear
        );
      }

      // Calculate predictions if requested
      let predictions;
      if (options.includePredictions) {
        predictions = await this.calculateSeasonPredictions(userId, crossLeagueStats, trends.data);
      }

      const analysis: PlayerPerformanceAnalysis = {
        playerId: userId,
        playerName: playerProfile.display_name,
        avatarUrl: playerProfile.avatar_url,
        overallRating,
        strengths,
        improvements,
        trends: trends.data || {
          goals: [],
          assists: [],
          overall: []
        },
        comparisons: comparisons || {
          vsLeagueAverage: { goals: 0, assists: 0, performance: 0 },
          vsPositionAverage: { goals: 0, assists: 0, performance: 0 },
          improvement: { last30Days: 0, last3Months: 0, season: 0 }
        },
        predictions: predictions || {
          seasonEndGoals: crossLeagueStats?.total_goals || 0,
          seasonEndAssists: crossLeagueStats?.total_assists || 0,
          confidenceLevel: 50
        }
      };

      // Cache for 15 minutes
      this.setCache(cacheKey, analysis, 900);

      return { data: analysis, error: null, success: true };

    } catch (error) {
      return {
        data: null,
        error: this.handleError(error, 'getPlayerPerformanceAnalysis'),
        success: false
      };
    }
  }

  /**
   * Get global player rankings across different stats
   */
  async getGlobalRankings(
    statType: 'goals' | 'assists' | 'matches' | 'performance',
    filters: StatsFilters = {},
    options: { limit?: number; offset?: number } = {}
  ): Promise<PaginatedServiceResponse<GlobalRanking>> {
    try {
      const cacheKey = this.getCacheKey('getGlobalRankings', { statType, filters, options });
      const cached = this.getFromCache<GlobalRanking[]>(cacheKey);
      
      if (cached) {
        return {
          data: cached,
          error: null,
          success: true,
          pagination: {
            page: Math.floor((options.offset || 0) / (options.limit || 50)) + 1,
            limit: options.limit || 50,
            total: cached.length,
            totalPages: Math.ceil(cached.length / (options.limit || 50)),
            hasNext: false,
            hasPrevious: false
          }
        };
      }

      // Use RPC function for complex ranking calculation
      const { data: rankings, error } = await this.supabase
        .rpc('get_global_rankings', {
          stat_type: statType,
          sport_type_filter: filters.sportType || null,
          league_type_filter: filters.leagueType || null,
          season_year_filter: filters.seasonYear || new Date().getFullYear(),
          min_games_filter: filters.minGames || 1,
          position_filter: filters.position || null,
          limit_count: options.limit || 50,
          offset_count: options.offset || 0
        });

      if (error) throw error;

      const globalRankings: GlobalRanking[] = (rankings || []).map((entry, index) => ({
        playerId: entry.player_id,
        displayName: entry.display_name,
        avatarUrl: entry.avatar_url,
        rank: (options.offset || 0) + index + 1,
        statValue: entry.stat_value,
        trend: 'stable', // Would need historical data to calculate trend
        previousRank: entry.previous_rank
      }));

      // Cache for 30 minutes
      this.setCache(cacheKey, globalRankings, 1800);

      const pagination = {
        page: Math.floor((options.offset || 0) / (options.limit || 50)) + 1,
        limit: options.limit || 50,
        total: globalRankings.length,
        totalPages: Math.ceil(globalRankings.length / (options.limit || 50)),
        hasNext: globalRankings.length === (options.limit || 50),
        hasPrevious: (options.offset || 0) > 0
      };

      return {
        data: globalRankings,
        error: null,
        success: true,
        pagination
      };

    } catch (error) {
      return {
        data: null,
        error: this.handleError(error, 'getGlobalRankings'),
        success: false,
        pagination: {
          page: 1,
          limit: options.limit || 50,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrevious: false
        }
      };
    }
  }

  /**
   * Get cross-league performance comparison for a player
   */
  async getCrossLeagueComparison(
    userId: string,
    options: { seasonYear?: number; includeAnalysis?: boolean } = {}
  ): Promise<ServiceResponse<CrossLeagueComparison>> {
    try {
      const cacheKey = this.getCacheKey('getCrossLeagueComparison', { userId, options });
      const cached = this.getFromCache<CrossLeagueComparison>(cacheKey);
      
      if (cached) {
        return { data: cached, error: null, success: true };
      }

      const seasonYear = options.seasonYear || new Date().getFullYear();

      // Get player profile
      const { data: profile, error: profileError } = await this.supabase
        .from('users')
        .select('display_name')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      // Get player's stats across leagues
      const { data: playerStats, error: statsError } = await this.supabase
        .from('player_stats')
        .select(`
          *,
          league:leagues!inner(*),
          team:teams!inner(*)
        `)
        .eq('player_id', userId)
        .eq('season_year', seasonYear);

      if (statsError) throw statsError;

      // Process league comparisons
      const leagues = await Promise.all(
        (playerStats || []).map(async (stat) => {
          // Get league rankings for this player
          const rank = await this.getPlayerLeagueRank(userId, stat.league_id, seasonYear);
          
          // Calculate performance metrics
          const performance = {
            goalsPerGame: stat.games_played > 0 ? (stat.goals || 0) / stat.games_played : 0,
            assistsPerGame: stat.games_played > 0 ? (stat.assists || 0) / stat.games_played : 0,
            consistency: this.calculateConsistency(stat),
            improvement: 0 // Would need historical data
          };

          // Calculate adaptability
          const adaptability = this.calculateAdaptability(stat, stat.league);

          return {
            league: stat.league,
            stats: stat,
            rank: rank.data || { goals: 999, assists: 999, overall: 999 },
            performance,
            adaptability
          };
        })
      );

      // Calculate overall analysis
      const overallAnalysis = this.calculateOverallCrossLeagueAnalysis(leagues);
      
      // Generate recommendations
      const recommendations = this.generateCrossLeagueRecommendations(leagues, overallAnalysis);

      const comparison: CrossLeagueComparison = {
        playerId: userId,
        playerName: profile.display_name,
        leagues,
        overallAnalysis,
        recommendations
      };

      // Cache for 20 minutes
      this.setCache(cacheKey, comparison, 1200);

      return { data: comparison, error: null, success: true };

    } catch (error) {
      return {
        data: null,
        error: this.handleError(error, 'getCrossLeagueComparison'),
        success: false
      };
    }
  }

  /**
   * Get comprehensive league analytics
   */
  async getLeagueAnalytics(
    leagueId: string,
    options: { seasonYear?: number; includeInsights?: boolean } = {}
  ): Promise<ServiceResponse<LeagueAnalytics>> {
    try {
      const cacheKey = this.getCacheKey('getLeagueAnalytics', { leagueId, options });
      const cached = this.getFromCache<LeagueAnalytics>(cacheKey);
      
      if (cached) {
        return { data: cached, error: null, success: true };
      }

      const seasonYear = options.seasonYear || new Date().getFullYear();

      // Get league details
      const { data: league, error: leagueError } = await this.supabase
        .from('leagues')
        .select('*')
        .eq('id', leagueId)
        .single();

      if (leagueError) throw leagueError;

      // Get league statistics using RPC
      const { data: leagueStats, error: statsError } = await this.supabase
        .rpc('get_league_analytics', {
          league_id: leagueId,
          season_year: seasonYear
        });

      if (statsError) throw statsError;

      // Get top performers
      const topPerformers = await this.getLeagueTopPerformers(leagueId, seasonYear);

      // Calculate trends
      const trends = await this.calculateLeagueTrends(leagueId, seasonYear);

      // Generate insights
      let insights: string[] = [];
      if (options.includeInsights) {
        insights = this.generateLeagueInsights(leagueStats, topPerformers.data, trends.data);
      }

      const analytics: LeagueAnalytics = {
        leagueId,
        leagueName: league.name,
        sportType: league.sport_type as SportType,
        totalPlayers: leagueStats?.total_players || 0,
        totalTeams: leagueStats?.total_teams || 0,
        totalMatches: leagueStats?.total_matches || 0,
        averageGoalsPerGame: leagueStats?.average_goals_per_game || 0,
        competitiveness: {
          score: leagueStats?.competitiveness_score || 50,
          description: this.getCompetitivenessDescription(leagueStats?.competitiveness_score || 50)
        },
        topPerformers: topPerformers.data || {
          goals: [],
          assists: [],
          overall: []
        },
        trends: trends.data || {
          playerGrowth: 0,
          matchActivity: 0,
          competitiveBalance: 0
        },
        insights
      };

      // Cache for 1 hour
      this.setCache(cacheKey, analytics, 3600);

      return { data: analytics, error: null, success: true };

    } catch (error) {
      return {
        data: null,
        error: this.handleError(error, 'getLeagueAnalytics'),
        success: false
      };
    }
  }

  /**
   * Get performance trends for a player over time
   */
  async getPerformanceTrends(
    userId: string,
    options: {
      period: 'weekly' | 'monthly' | 'quarterly';
      statTypes: Array<'goals' | 'assists' | 'matches' | 'performance'>;
      seasonYear?: number;
    }
  ): Promise<ServiceResponse<{ [key: string]: PerformanceTrend[] }>> {
    try {
      const cacheKey = this.getCacheKey('getPerformanceTrends', { userId, options });
      const cached = this.getFromCache<{ [key: string]: PerformanceTrend[] }>(cacheKey);
      
      if (cached) {
        return { data: cached, error: null, success: true };
      }

      const trends = await this.calculatePerformanceTrends(
        userId,
        options.seasonYear || new Date().getFullYear(),
        options.period,
        options.statTypes
      );

      return trends;

    } catch (error) {
      return {
        data: null,
        error: this.handleError(error, 'getPerformanceTrends'),
        success: false
      };
    }
  }

  /**
   * Private helper methods
   */
  private generateCrossLeagueStatsFromPlayerStats(playerStats: PlayerStats[]): any {
    const totalGoals = playerStats.reduce((sum, stat) => sum + (stat.goals || 0), 0);
    const totalAssists = playerStats.reduce((sum, stat) => sum + (stat.assists || 0), 0);
    const totalGames = playerStats.reduce((sum, stat) => sum + (stat.games_played || 0), 0);
    const leaguesPlayed = new Set(playerStats.map(stat => stat.league_id)).size;
    const teamsPlayed = new Set(playerStats.map(stat => stat.team_id)).size;

    return {
      player_id: playerStats[0]?.player_id || '',
      display_name: 'Generated Stats',
      avatar_url: null,
      preferred_position: null,
      season_year: new Date().getFullYear(),
      leagues_played: leaguesPlayed,
      teams_played: teamsPlayed,
      total_games_played: totalGames,
      total_goals: totalGoals,
      total_assists: totalAssists,
      total_yellow_cards: playerStats.reduce((sum, stat) => sum + (stat.yellow_cards || 0), 0),
      total_red_cards: playerStats.reduce((sum, stat) => sum + (stat.red_cards || 0), 0),
      avg_goals_per_game: totalGames > 0 ? totalGoals / totalGames : 0,
      avg_contributions_per_game: totalGames > 0 ? (totalGoals + totalAssists) / totalGames : 0,
      goals_consistency: totalGames > 0 ? this.calculateGoalsConsistency(playerStats) : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  private calculateGoalsConsistency(playerStats: PlayerStats[]): number {
    if (playerStats.length === 0) return 0;
    
    const goalRates = playerStats.map(stat => 
      (stat.games_played || 0) > 0 ? (stat.goals || 0) / (stat.games_played || 1) : 0
    );
    
    const avgRate = goalRates.reduce((sum, rate) => sum + rate, 0) / goalRates.length;
    const variance = goalRates.reduce((sum, rate) => sum + Math.pow(rate - avgRate, 2), 0) / goalRates.length;
    
    return Math.sqrt(variance);
  }
  private async calculatePerformanceTrends(
    userId: string,
    seasonYear: number,
    period: 'weekly' | 'monthly' | 'quarterly' = 'monthly',
    statTypes: Array<'goals' | 'assists' | 'matches' | 'performance'> = ['goals', 'assists', 'performance']
  ): Promise<ServiceResponse<{ [key: string]: PerformanceTrend[] }>> {
    try {
      // Check if the RPC function exists first, if not return empty trends
      const { data: trendsData, error } = await this.supabase
        .rpc('calculate_performance_trends', {
          player_id: userId,
          season_year: seasonYear,
          period_type: period,
          stat_types: statTypes
        });

      // If RPC function doesn't exist or has error, return empty trends
      if (error) {
        console.warn('Performance trends RPC function not available:', error);
        const emptyTrends: { [key: string]: PerformanceTrend[] } = {};
        statTypes.forEach(statType => {
          emptyTrends[statType] = [];
        });
        return { data: emptyTrends, error: null, success: true };
      }

      // Process the trends data
      const trends: { [key: string]: PerformanceTrend[] } = {};
      statTypes.forEach(statType => {
        trends[statType] = trendsData?.filter((t: { stat_type: string }) => t.stat_type === statType).map((t: { period: string; goals?: number; assists?: number; matches?: number; performance?: number }) => ({
          period: t.period,
          goals: t.goals || 0,
          assists: t.assists || 0,
          matches: t.matches || 0,
          performance: t.performance || 0
        })) || [];
      });

      return { data: trends, error: null, success: true };

    } catch (error) {
      return {
        data: null,
        error: this.handleError(error, 'calculatePerformanceTrends'),
        success: false
      };
    }
  }

  private calculateOverallRating(
    crossLeagueStats: PlayerCrossLeagueStats | null,
    leagueStats: PlayerStats[]
  ): number {
    if (!crossLeagueStats || !leagueStats.length) return 50;

    // Simple rating calculation based on multiple factors
    const avgGoalsPerGame = crossLeagueStats.avg_goals_per_game || 0;
    const avgAssistsPerGame = crossLeagueStats.avg_contributions_per_game 
      ? crossLeagueStats.avg_contributions_per_game - avgGoalsPerGame 
      : 0;
    const consistency = crossLeagueStats.goals_consistency ? 100 - (crossLeagueStats.goals_consistency * 10) : 50;
    const leagueVariety = crossLeagueStats.leagues_played || 1;

    const rating = Math.min(100, Math.max(0,
      (avgGoalsPerGame * 20) +
      (avgAssistsPerGame * 15) +
      (consistency * 0.3) +
      (leagueVariety * 2) +
      30 // Base rating
    ));

    return Math.round(rating);
  }

  private analyzePlayerStrengthsAndWeaknesses(
    crossLeagueStats: PlayerCrossLeagueStats | null,
    leagueStats: PlayerStats[]
  ): { strengths: string[]; improvements: string[] } {
    const strengths: string[] = [];
    const improvements: string[] = [];

    if (!crossLeagueStats) {
      return { strengths: ['New player - building experience'], improvements: ['Play more matches to build statistics'] };
    }

    // Analyze strengths
    if (crossLeagueStats.avg_goals_per_game > 0.5) {
      strengths.push('Excellent goal scoring ability');
    }
    if (crossLeagueStats.avg_contributions_per_game > 0.7) {
      strengths.push('High overall contribution to team');
    }
    if (crossLeagueStats.leagues_played > 2) {
      strengths.push('Versatile across different leagues');
    }
    if (crossLeagueStats.total_games_played > 20) {
      strengths.push('Experienced and consistent player');
    }

    // Analyze improvements
    if (crossLeagueStats.avg_goals_per_game < 0.2) {
      improvements.push('Focus on creating more scoring opportunities');
    }
    if (crossLeagueStats.goals_consistency && crossLeagueStats.goals_consistency > 0.5) {
      improvements.push('Work on consistency in performance');
    }
    if (crossLeagueStats.leagues_played === 1) {
      improvements.push('Consider exploring different leagues for variety');
    }

    // Ensure we have at least some content
    if (strengths.length === 0) {
      strengths.push('Building experience and skills');
    }
    if (improvements.length === 0) {
      improvements.push('Continue developing match experience');
    }

    return { strengths, improvements };
  }

  private async calculatePlayerComparisons(
    userId: string,
    position: string | null,
    crossLeagueStats: PlayerCrossLeagueStats | null,
    seasonYear: number
  ) {
    // This would involve complex calculations comparing against league and position averages
    // Simplified implementation
    return {
      vsLeagueAverage: {
        goals: crossLeagueStats?.avg_goals_per_game || 0,
        assists: (crossLeagueStats?.avg_contributions_per_game || 0) - (crossLeagueStats?.avg_goals_per_game || 0),
        performance: 0
      },
      vsPositionAverage: {
        goals: crossLeagueStats?.avg_goals_per_game || 0,
        assists: (crossLeagueStats?.avg_contributions_per_game || 0) - (crossLeagueStats?.avg_goals_per_game || 0),
        performance: 0
      },
      improvement: {
        last30Days: 0,
        last3Months: 0,
        season: 0
      }
    };
  }

  private async calculateSeasonPredictions(
    userId: string,
    crossLeagueStats: PlayerCrossLeagueStats | null,
    trends: any
  ) {
    if (!crossLeagueStats) {
      return {
        seasonEndGoals: 0,
        seasonEndAssists: 0,
        confidenceLevel: 0
      };
    }

    // Simple prediction based on current performance
    const remainingWeeks = Math.max(0, 52 - new Date().getWeek());
    const currentRate = crossLeagueStats.avg_goals_per_game || 0;
    
    return {
      seasonEndGoals: Math.round((crossLeagueStats.total_goals || 0) + (currentRate * remainingWeeks * 0.5)),
      seasonEndAssists: Math.round((crossLeagueStats.total_assists || 0) + (currentRate * 0.7 * remainingWeeks * 0.5)),
      confidenceLevel: crossLeagueStats.total_games_played > 10 ? 75 : 45
    };
  }

  private async getPlayerLeagueRank(userId: string, leagueId: string, seasonYear: number): Promise<ServiceResponse<{
    goals: number;
    assists: number;
    overall: number;
  }>> {
    try {
      const { data, error } = await this.supabase
        .rpc('get_player_league_rank', {
          player_id: userId,
          league_id: leagueId,
          season_year: seasonYear
        });

      if (error) throw error;

      return {
        data: data || { goals: 999, assists: 999, overall: 999 },
        error: null,
        success: true
      };

    } catch (error) {
      return {
        data: null,
        error: this.handleError(error, 'getPlayerLeagueRank'),
        success: false
      };
    }
  }

  private calculateConsistency(stats: PlayerStats): number {
    // Simplified consistency calculation
    if (!stats.games_played || stats.games_played === 0) return 0;
    
    const goalConsistency = stats.goals ? (stats.goals / stats.games_played) * 100 : 0;
    const participationConsistency = stats.games_started ? (stats.games_started / stats.games_played) * 100 : 50;
    
    return Math.round((goalConsistency + participationConsistency) / 2);
  }

  private calculateAdaptability(stats: PlayerStats, league: any) {
    const factors: string[] = [];
    let score = 50;

    if (stats.games_played > 5) {
      score += 20;
      factors.push('Good match participation');
    }

    if (league.league_type === 'competitive' && (stats.goals || 0) > 0) {
      score += 15;
      factors.push('Performs well in competitive environment');
    }

    return {
      score: Math.min(100, score),
      factors
    };
  }

  private calculateOverallCrossLeagueAnalysis(leagues: any[]) {
    const numLeagues = leagues.length;
    
    return {
      versatility: Math.min(100, numLeagues * 25),
      consistency: numLeagues > 0 
        ? Math.round(leagues.reduce((sum, l) => sum + l.performance.consistency, 0) / numLeagues)
        : 0,
      adaptability: numLeagues > 0
        ? Math.round(leagues.reduce((sum, l) => sum + l.adaptability.score, 0) / numLeagues)
        : 0,
      growthPotential: 75 // Simplified calculation
    };
  }

  private generateCrossLeagueRecommendations(leagues: any[], overallAnalysis: any): string[] {
    const recommendations: string[] = [];

    if (leagues.length === 1) {
      recommendations.push('Consider joining additional leagues to showcase versatility');
    }

    if (overallAnalysis.consistency < 60) {
      recommendations.push('Focus on maintaining consistent performance across leagues');
    }

    if (overallAnalysis.adaptability < 70) {
      recommendations.push('Work on adapting your play style to different league formats');
    }

    return recommendations;
  }

  private async getLeagueTopPerformers(leagueId: string, seasonYear: number): Promise<ServiceResponse<{
    goals: GlobalRanking[];
    assists: GlobalRanking[];
    overall: GlobalRanking[];
  }>> {
    try {
      // Get top goal scorers
      const { data: goalScorers, error: goalError } = await this.supabase
        .from('player_leaderboard')
        .select('*')
        .eq('league_id', leagueId)
        .eq('season_year', seasonYear)
        .order('goals', { ascending: false })
        .limit(10);

      if (goalError) throw goalError;

      // Get top assists
      const { data: assistLeaders, error: assistError } = await this.supabase
        .from('player_leaderboard')
        .select('*')
        .eq('league_id', leagueId)
        .eq('season_year', seasonYear)
        .order('assists', { ascending: false })
        .limit(10);

      if (assistError) throw assistError;

      // Get overall performers (based on goals + assists)
      const { data: overallPerformers, error: overallError } = await this.supabase
        .from('player_leaderboard')
        .select('*')
        .eq('league_id', leagueId)
        .eq('season_year', seasonYear)
        .order('goal_contributions_per_game', { ascending: false })
        .limit(10);

      if (overallError) throw overallError;

      const data = {
        goals: (goalScorers || []).map((player, index) => ({
          playerId: player.player_id,
          displayName: player.display_name,
          avatarUrl: player.avatar_url,
          rank: index + 1,
          statValue: player.goals,
          trend: 'stable' as const
        })),
        assists: (assistLeaders || []).map((player, index) => ({
          playerId: player.player_id,
          displayName: player.display_name,
          avatarUrl: player.avatar_url,
          rank: index + 1,
          statValue: player.assists,
          trend: 'stable' as const
        })),
        overall: (overallPerformers || []).map((player, index) => ({
          playerId: player.player_id,
          displayName: player.display_name,
          avatarUrl: player.avatar_url,
          rank: index + 1,
          statValue: player.goals + player.assists,
          trend: 'stable' as const
        }))
      };

      return { data, error: null, success: true };

    } catch (error) {
      return {
        data: null,
        error: this.handleError(error, 'getLeagueTopPerformers'),
        success: false
      };
    }
  }

  private async calculateLeagueTrends(leagueId: string, seasonYear: number): Promise<ServiceResponse<{
    playerGrowth: number;
    matchActivity: number;
    competitiveBalance: number;
  }>> {
    try {
      // Get league statistics for trends calculation
      const { data: currentStats, error: currentError } = await this.supabase
        .from('league_standings')
        .select('*')
        .eq('league_id', leagueId)
        .eq('season_year', seasonYear);

      if (currentError) throw currentError;

      // Get previous year for comparison (if available)
      const { data: previousStats, error: previousError } = await this.supabase
        .from('league_standings')
        .select('*')
        .eq('league_id', leagueId)
        .eq('season_year', seasonYear - 1);

      // Calculate trends
      const currentPlayerCount = currentStats?.length || 0;
      const previousPlayerCount = previousStats?.length || 0;
      const playerGrowth = previousPlayerCount > 0 
        ? Math.round(((currentPlayerCount - previousPlayerCount) / previousPlayerCount) * 100)
        : 0;

      // Calculate match activity based on games played
      const totalGames = currentStats?.reduce((sum, team) => sum + (team.games_played || 0), 0) || 0;
      const expectedGames = currentPlayerCount * 10; // Assuming ~10 games per season
      const matchActivity = expectedGames > 0 
        ? Math.min(100, Math.round((totalGames / expectedGames) * 100))
        : 0;

      // Calculate competitive balance based on points distribution
      const points = currentStats?.map(team => team.points || 0) || [];
      const avgPoints = points.length > 0 ? points.reduce((a, b) => a + b, 0) / points.length : 0;
      const pointsVariance = points.length > 0 
        ? points.reduce((sum, points) => sum + Math.pow(points - avgPoints, 2), 0) / points.length
        : 0;
      const competitiveBalance = points.length > 0 
        ? Math.max(0, Math.min(100, 100 - (Math.sqrt(pointsVariance) / avgPoints * 100)))
        : 50;

      const data = {
        playerGrowth: Math.max(-100, Math.min(100, playerGrowth)),
        matchActivity: Math.max(0, Math.min(100, matchActivity)),
        competitiveBalance: Math.max(0, Math.min(100, Math.round(competitiveBalance)))
      };

      return { data, error: null, success: true };

    } catch (error) {
      return {
        data: {
          playerGrowth: 0,
          matchActivity: 0,
          competitiveBalance: 50
        },
        error: this.handleError(error, 'calculateLeagueTrends'),
        success: false
      };
    }
  }

  private generateLeagueInsights(leagueStats: any, topPerformers: any, trends: any): string[] {
    const insights: string[] = [];

    if (leagueStats?.competitiveness_score > 80) {
      insights.push('Highly competitive league with balanced teams');
    } else if (leagueStats?.competitiveness_score < 40) {
      insights.push('Consider strategies to improve competitive balance');
    }

    if (trends?.playerGrowth > 20) {
      insights.push('Strong player growth indicating healthy league development');
    }

    if (leagueStats?.average_goals_per_game > 3) {
      insights.push('High-scoring league with attacking play style');
    } else if (leagueStats?.average_goals_per_game < 1.5) {
      insights.push('Defensive-minded league with tight matches');
    }

    return insights;
  }

  private getCompetitivenessDescription(score: number): string {
    if (score >= 80) return 'Highly competitive with balanced teams';
    if (score >= 60) return 'Good competitive balance';
    if (score >= 40) return 'Moderate competitiveness';
    return 'Needs improvement in competitive balance';
  }

  /**
   * Subscribe to real-time stats updates
   */
  subscribeToStatsUpdates(
    userId: string,
    callback: (payload: any) => void,
    options: RealtimeSubscriptionOptions = { table: 'player_stats', event: '*' }
  ) {
    return this.supabase
      .channel(`stats-${userId}-updates`)
      .on(
        'postgres_changes',
        {
          event: options.event,
          schema: options.schema || 'public',
          table: options.table,
          filter: options.filter || `player_id=eq.${userId}`
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

// Extend Date prototype for week calculation (helper for predictions)
declare global {
  interface Date {
    getWeek(): number;
  }
}

Date.prototype.getWeek = function() {
  const date = new Date(this.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
};
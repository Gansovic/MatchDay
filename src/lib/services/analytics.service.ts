/**
 * Analytics Service for MatchDay
 * 
 * Handles cross-league comparisons and advanced statistics that make amateur
 * players feel professional. Provides comprehensive analytics across all leagues.
 * 
 * @example
 * ```typescript
 * const ranking = await AnalyticsService.getInstance().getGlobalPlayerRanking(userId);
 * const comparison = await AnalyticsService.getInstance().comparePlayerAcrossLeagues(userId);
 * ```
 * 
 * This service should be used for ALL analytics and comparison operations.
 */

import { Database } from '../types/database.types';

type PlayerStats = Database['public']['Tables']['player_stats']['Row'];
type TeamStats = Database['public']['Tables']['team_stats']['Row'];

export interface GlobalPlayerRanking {
  playerId: string;
  displayName: string;
  avatarUrl?: string;
  totalGoals: number;
  totalAssists: number;
  totalGames: number;
  totalMinutes: number;
  globalRank: number;
  percentileRank: number;
  leaguesPlayed: number;
  topLeague: string;
  achievements: number;
}

export interface CrossLeagueComparison {
  playerId: string;
  playerStats: {
    totalGoals: number;
    totalAssists: number;
    totalGames: number;
    averageGoalsPerGame: number;
    totalMinutes: number;
  };
  leagueBreakdown: Array<{
    leagueId: string;
    leagueName: string;
    sportType: string;
    goals: number;
    assists: number;
    games: number;
    rank: number;
    percentile: number;
  }>;
  globalComparison: {
    betterThanPercent: number;
    similarPlayers: Array<{
      playerId: string;
      displayName: string;
      goals: number;
      assists: number;
    }>;
  };
}

export interface GlobalLeaderboard {
  category: string;
  timeframe: string;
  sportType?: string;
  players: Array<{
    rank: number;
    playerId: string;
    displayName: string;
    avatarUrl?: string;
    value: number;
    leagues: string[];
    trend: 'up' | 'down' | 'same';
  }>;
}

export class AnalyticsService {
  private static instance: AnalyticsService;
  private supabase: any;
  
  private constructor() {}
  
  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }
  
  setSupabaseClient(client: any) {
    this.supabase = client;
  }
  
  /**
   * Get global player ranking across all leagues
   */
  async getGlobalPlayerRanking(playerId: string): Promise<GlobalPlayerRanking | null> {
    const { data, error } = await this.supabase.rpc('get_global_player_ranking', {
      player_id: playerId
    });
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Compare player performance across different leagues
   */
  async comparePlayerAcrossLeagues(playerId: string): Promise<CrossLeagueComparison> {
    // Get player stats across all leagues
    const { data: playerStats, error: statsError } = await this.supabase
      .from('player_stats')
      .select(`
        *,
        leagues(id, name, sport_type),
        teams(name)
      `)
      .eq('player_id', playerId);
    
    if (statsError) throw statsError;
    
    // Calculate aggregated stats
    const totalStats = playerStats.reduce((acc, stat) => ({
      totalGoals: acc.totalGoals + (stat.goals || 0),
      totalAssists: acc.totalAssists + (stat.assists || 0),
      totalGames: acc.totalGames + (stat.games_played || 0),
      totalMinutes: acc.totalMinutes + (stat.minutes_played || 0)
    }), { totalGoals: 0, totalAssists: 0, totalGames: 0, totalMinutes: 0 });
    
    // Get league-specific rankings
    const leagueBreakdown = await Promise.all(
      playerStats.map(async (stat) => {
        const { data: ranking } = await this.supabase.rpc('get_league_player_ranking', {
          league_id: stat.league_id,
          player_id: playerId
        });
        
        return {
          leagueId: stat.league_id,
          leagueName: stat.leagues.name,
          sportType: stat.leagues.sport_type,
          goals: stat.goals || 0,
          assists: stat.assists || 0,
          games: stat.games_played || 0,
          rank: ranking?.rank || 0,
          percentile: ranking?.percentile || 0
        };
      })
    );
    
    // Get global comparison data
    const { data: globalData } = await this.supabase.rpc('get_player_global_comparison', {
      player_id: playerId,
      total_goals: totalStats.totalGoals
    });
    
    return {
      playerId,
      playerStats: {
        ...totalStats,
        averageGoalsPerGame: totalStats.totalGames > 0 
          ? totalStats.totalGoals / totalStats.totalGames 
          : 0
      },
      leagueBreakdown,
      globalComparison: globalData || {
        betterThanPercent: 0,
        similarPlayers: []
      }
    };
  }
  
  /**
   * Get global leaderboards with various filters
   */
  async getGlobalLeaderboards(options: {
    category: 'goals' | 'assists' | 'games_played' | 'goals_per_game';
    timeframe: 'current_season' | 'all_time' | 'last_30_days';
    sportType?: string;
    limit?: number;
  }): Promise<GlobalLeaderboard> {
    const { data, error } = await this.supabase.rpc('get_global_leaderboard', {
      stat_category: options.category,
      time_frame: options.timeframe,
      sport_filter: options.sportType,
      result_limit: options.limit || 50
    });
    
    if (error) throw error;
    
    return {
      category: options.category,
      timeframe: options.timeframe,
      sportType: options.sportType,
      players: data || []
    };
  }
  
  /**
   * Get player performance trends over time
   */
  async getPlayerTrends(playerId: string, timeframe: 'season' | 'career' = 'season'): Promise<{
    goals: Array<{ period: string; value: number }>;
    assists: Array<{ period: string; value: number }>;
    gamesPlayed: Array<{ period: string; value: number }>;
  }> {
    const { data, error } = await this.supabase.rpc('get_player_trends', {
      player_id: playerId,
      time_frame: timeframe
    });
    
    if (error) throw error;
    return data || { goals: [], assists: [], gamesPlayed: [] };
  }
  
  /**
   * Compare teams across leagues
   */
  async compareTeamsAcrossLeagues(teamIds: string[]): Promise<Array<{
    teamId: string;
    teamName: string;
    leagueName: string;
    sportType: string;
    points: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    leagueRank: number;
    globalRank: number;
  }>> {
    const { data, error } = await this.supabase.rpc('compare_teams_across_leagues', {
      team_ids: teamIds
    });
    
    if (error) throw error;
    return data || [];
  }
  
  /**
   * Get league strength rankings
   */
  async getLeagueStrengthRankings(sportType?: string): Promise<Array<{
    leagueId: string;
    leagueName: string;
    sportType: string;
    strengthScore: number;
    avgGoalsPerGame: number;
    competitivenessIndex: number;
    totalPlayers: number;
    totalTeams: number;
  }>> {
    const { data, error } = await this.supabase.rpc('get_league_strength_rankings', {
      sport_filter: sportType
    });
    
    if (error) throw error;
    return data || [];
  }
  
  /**
   * Get player's achievement progress compared to others
   */
  async getAchievementComparison(playerId: string): Promise<{
    totalAchievements: number;
    globalRank: number;
    percentileRank: number;
    recentAchievements: Array<{
      achievementId: string;
      name: string;
      earnedAt: string;
      rarity: number; // Percentage of players who have this
    }>;
    recommendedAchievements: Array<{
      achievementId: string;
      name: string;
      description: string;
      progress: number; // 0-100
      requirements: any;
    }>;
  }> {
    const { data, error } = await this.supabase.rpc('get_achievement_comparison', {
      player_id: playerId
    });
    
    if (error) throw error;
    return data || {
      totalAchievements: 0,
      globalRank: 0,
      percentileRank: 0,
      recentAchievements: [],
      recommendedAchievements: []
    };
  }
  
  /**
   * Get comprehensive player profile for cross-league display
   */
  async getPlayerGlobalProfile(playerId: string): Promise<{
    basicInfo: {
      displayName: string;
      avatarUrl?: string;
      preferredPosition?: string;
      location?: string;
    };
    globalStats: {
      totalGoals: number;
      totalAssists: number;
      totalGames: number;
      totalMinutes: number;
      leaguesPlayed: number;
      achievementsEarned: number;
    };
    rankings: {
      globalGoalsRank: number;
      globalAssistsRank: number;
      globalGamesRank: number;
      overallRank: number;
    };
    leagueHistory: Array<{
      leagueId: string;
      leagueName: string;
      sportType: string;
      season: string;
      teamName: string;
      stats: {
        goals: number;
        assists: number;
        games: number;
        rank: number;
      };
    }>;
    similarPlayers: Array<{
      playerId: string;
      displayName: string;
      similarityScore: number;
      commonLeagues: string[];
    }>;
  }> {
    const { data, error } = await this.supabase.rpc('get_player_global_profile', {
      player_id: playerId
    });
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Search and filter players across all leagues
   */
  async searchPlayersGlobally(options: {
    query?: string;
    sportType?: string;
    position?: string;
    minGoals?: number;
    minGames?: number;
    leagueIds?: string[];
    limit?: number;
  }): Promise<Array<{
    playerId: string;
    displayName: string;
    avatarUrl?: string;
    position?: string;
    totalGoals: number;
    totalAssists: number;
    totalGames: number;
    currentLeagues: string[];
    globalRank: number;
  }>> {
    const { data, error } = await this.supabase.rpc('search_players_globally', options);
    
    if (error) throw error;
    return data || [];
  }
}
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
export class AnalyticsService {
    constructor() { }
    static getInstance() {
        if (!AnalyticsService.instance) {
            AnalyticsService.instance = new AnalyticsService();
        }
        return AnalyticsService.instance;
    }
    setSupabaseClient(client) {
        this.supabase = client;
    }
    /**
     * Get global player ranking across all leagues
     */
    async getGlobalPlayerRanking(playerId) {
        const { data, error } = await this.supabase.rpc('get_global_player_ranking', {
            player_id: playerId
        });
        if (error)
            throw error;
        return data;
    }
    /**
     * Compare player performance across different leagues
     */
    async comparePlayerAcrossLeagues(playerId) {
        // Get player stats across all leagues
        const { data: playerStats, error: statsError } = await this.supabase
            .from('player_stats')
            .select(`
        *,
        leagues(id, name, sport_type),
        teams(name)
      `)
            .eq('player_id', playerId);
        if (statsError)
            throw statsError;
        // Calculate aggregated stats
        const totalStats = playerStats.reduce((acc, stat) => ({
            totalGoals: acc.totalGoals + (stat.goals || 0),
            totalAssists: acc.totalAssists + (stat.assists || 0),
            totalGames: acc.totalGames + (stat.games_played || 0),
            totalMinutes: acc.totalMinutes + (stat.minutes_played || 0)
        }), { totalGoals: 0, totalAssists: 0, totalGames: 0, totalMinutes: 0 });
        // Get league-specific rankings
        const leagueBreakdown = await Promise.all(playerStats.map(async (stat) => {
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
        }));
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
    async getGlobalLeaderboards(options) {
        const { data, error } = await this.supabase.rpc('get_global_leaderboard', {
            stat_category: options.category,
            time_frame: options.timeframe,
            sport_filter: options.sportType,
            result_limit: options.limit || 50
        });
        if (error)
            throw error;
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
    async getPlayerTrends(playerId, timeframe = 'season') {
        const { data, error } = await this.supabase.rpc('get_player_trends', {
            player_id: playerId,
            time_frame: timeframe
        });
        if (error)
            throw error;
        return data || { goals: [], assists: [], gamesPlayed: [] };
    }
    /**
     * Compare teams across leagues
     */
    async compareTeamsAcrossLeagues(teamIds) {
        const { data, error } = await this.supabase.rpc('compare_teams_across_leagues', {
            team_ids: teamIds
        });
        if (error)
            throw error;
        return data || [];
    }
    /**
     * Get league strength rankings
     */
    async getLeagueStrengthRankings(sportType) {
        const { data, error } = await this.supabase.rpc('get_league_strength_rankings', {
            sport_filter: sportType
        });
        if (error)
            throw error;
        return data || [];
    }
    /**
     * Get player's achievement progress compared to others
     */
    async getAchievementComparison(playerId) {
        const { data, error } = await this.supabase.rpc('get_achievement_comparison', {
            player_id: playerId
        });
        if (error)
            throw error;
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
    async getPlayerGlobalProfile(playerId) {
        const { data, error } = await this.supabase.rpc('get_player_global_profile', {
            player_id: playerId
        });
        if (error)
            throw error;
        return data;
    }
    /**
     * Search and filter players across all leagues
     */
    async searchPlayersGlobally(options) {
        const { data, error } = await this.supabase.rpc('search_players_globally', options);
        if (error)
            throw error;
        return data || [];
    }
}
//# sourceMappingURL=analytics.service.js.map
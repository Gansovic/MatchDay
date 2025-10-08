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
export declare class AnalyticsService {
    private static instance;
    private supabase;
    private constructor();
    static getInstance(): AnalyticsService;
    setSupabaseClient(client: any): void;
    /**
     * Get global player ranking across all leagues
     */
    getGlobalPlayerRanking(playerId: string): Promise<GlobalPlayerRanking | null>;
    /**
     * Compare player performance across different leagues
     */
    comparePlayerAcrossLeagues(playerId: string): Promise<CrossLeagueComparison>;
    /**
     * Get global leaderboards with various filters
     */
    getGlobalLeaderboards(options: {
        category: 'goals' | 'assists' | 'games_played' | 'goals_per_game';
        timeframe: 'current_season' | 'all_time' | 'last_30_days';
        sportType?: string;
        limit?: number;
    }): Promise<GlobalLeaderboard>;
    /**
     * Get player performance trends over time
     */
    getPlayerTrends(playerId: string, timeframe?: 'season' | 'career'): Promise<{
        goals: Array<{
            period: string;
            value: number;
        }>;
        assists: Array<{
            period: string;
            value: number;
        }>;
        gamesPlayed: Array<{
            period: string;
            value: number;
        }>;
    }>;
    /**
     * Compare teams across leagues
     */
    compareTeamsAcrossLeagues(teamIds: string[]): Promise<Array<{
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
    }>>;
    /**
     * Get league strength rankings
     */
    getLeagueStrengthRankings(sportType?: string): Promise<Array<{
        leagueId: string;
        leagueName: string;
        sportType: string;
        strengthScore: number;
        avgGoalsPerGame: number;
        competitivenessIndex: number;
        totalPlayers: number;
        totalTeams: number;
    }>>;
    /**
     * Get player's achievement progress compared to others
     */
    getAchievementComparison(playerId: string): Promise<{
        totalAchievements: number;
        globalRank: number;
        percentileRank: number;
        recentAchievements: Array<{
            achievementId: string;
            name: string;
            earnedAt: string;
            rarity: number;
        }>;
        recommendedAchievements: Array<{
            achievementId: string;
            name: string;
            description: string;
            progress: number;
            requirements: any;
        }>;
    }>;
    /**
     * Get comprehensive player profile for cross-league display
     */
    getPlayerGlobalProfile(playerId: string): Promise<{
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
    }>;
    /**
     * Search and filter players across all leagues
     */
    searchPlayersGlobally(options: {
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
    }>>;
}
//# sourceMappingURL=analytics.service.d.ts.map
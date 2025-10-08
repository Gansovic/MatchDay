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
import { Database, PlayerStats, PerformanceTrend, GlobalRanking, ServiceResponse, PaginatedServiceResponse, SportType, LeagueType, RealtimeSubscriptionOptions } from '@matchday/database';
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
export declare class StatsService {
    private static instance;
    private supabase;
    private cache;
    private constructor();
    static getInstance(supabaseClient?: SupabaseClient<Database>): StatsService;
    /**
     * Handle service errors consistently
     */
    private handleError;
    /**
     * Cache management utilities
     */
    private getCacheKey;
    private getFromCache;
    private setCache;
    /**
     * Get comprehensive player performance analysis
     */
    getPlayerPerformanceAnalysis(userId: string, options?: {
        seasonYear?: number;
        includeComparisons?: boolean;
        includePredictions?: boolean;
    }): Promise<ServiceResponse<PlayerPerformanceAnalysis>>;
    /**
     * Get global player rankings across different stats
     */
    getGlobalRankings(statType: 'goals' | 'assists' | 'matches' | 'performance', filters?: StatsFilters, options?: {
        limit?: number;
        offset?: number;
    }): Promise<PaginatedServiceResponse<GlobalRanking>>;
    /**
     * Get cross-league performance comparison for a player
     */
    getCrossLeagueComparison(userId: string, options?: {
        seasonYear?: number;
        includeAnalysis?: boolean;
    }): Promise<ServiceResponse<CrossLeagueComparison>>;
    /**
     * Get comprehensive league analytics
     */
    getLeagueAnalytics(leagueId: string, options?: {
        seasonYear?: number;
        includeInsights?: boolean;
    }): Promise<ServiceResponse<LeagueAnalytics>>;
    /**
     * Get performance trends for a player over time
     */
    getPerformanceTrends(userId: string, options: {
        period: 'weekly' | 'monthly' | 'quarterly';
        statTypes: Array<'goals' | 'assists' | 'matches' | 'performance'>;
        seasonYear?: number;
    }): Promise<ServiceResponse<{
        [key: string]: PerformanceTrend[];
    }>>;
    /**
     * Private helper methods
     */
    private generateCrossLeagueStatsFromPlayerStats;
    private calculateGoalsConsistency;
    private calculatePerformanceTrends;
    private calculateOverallRating;
    private analyzePlayerStrengthsAndWeaknesses;
    private calculatePlayerComparisons;
    private calculateSeasonPredictions;
    private getPlayerLeagueRank;
    private calculateConsistency;
    private calculateAdaptability;
    private calculateOverallCrossLeagueAnalysis;
    private generateCrossLeagueRecommendations;
    private getLeagueTopPerformers;
    private calculateLeagueTrends;
    private generateLeagueInsights;
    private getCompetitivenessDescription;
    /**
     * Subscribe to real-time stats updates
     */
    subscribeToStatsUpdates(userId: string, callback: (payload: any) => void, options?: RealtimeSubscriptionOptions): import("@supabase/supabase-js").RealtimeChannel;
    /**
     * Clear cache
     */
    clearCache(pattern?: string): void;
}
declare global {
    interface Date {
        getWeek(): number;
    }
}
//# sourceMappingURL=stats.service.d.ts.map
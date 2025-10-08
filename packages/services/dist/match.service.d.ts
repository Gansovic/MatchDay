/**
 * Match Service for MatchDay
 *
 * Handles match viewing and statistics operations with focus on:
 * - Player's upcoming and past matches
 * - Match events and statistics
 * - Live match tracking and real-time updates
 * - Performance metrics and match analysis
 *
 * Optimized for player-centric match experience with comprehensive statistics
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { Database, MatchEvent, MatchWithDetails, LiveMatchData, ActiveMatch, ServiceResponse, PaginatedServiceResponse, MatchStatus, EventType, RealtimeSubscriptionOptions } from '@matchday/database';
export interface MatchFilters {
    leagueId?: string;
    teamId?: string;
    status?: MatchStatus;
    dateFrom?: string;
    dateTo?: string;
    venue?: string;
    sportType?: string;
}
export interface PlayerMatchStats {
    matchId: string;
    playerId: string;
    playerName: string;
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
    minutesPlayed: number;
    position?: string;
    events: MatchEvent[];
    performance: {
        rating: number;
        keyPasses: number;
        successfulPasses: number;
        totalPasses: number;
        tackles: number;
        saves?: number;
    };
}
export interface MatchPrediction {
    matchId: string;
    homeWinProbability: number;
    drawProbability: number;
    awayWinProbability: number;
    expectedGoalsHome: number;
    expectedGoalsAway: number;
    keyFactors: string[];
    confidence: number;
}
export interface MatchAnalytics {
    matchId: string;
    duration: number;
    totalEvents: number;
    goalsByPeriod: {
        firstHalf: {
            home: number;
            away: number;
        };
        secondHalf: {
            home: number;
            away: number;
        };
        extraTime?: {
            home: number;
            away: number;
        };
    };
    cardsByTeam: {
        home: {
            yellow: number;
            red: number;
        };
        away: {
            yellow: number;
            red: number;
        };
    };
    topPerformers: {
        home: PlayerMatchStats[];
        away: PlayerMatchStats[];
    };
    matchMomentum: Array<{
        minute: number;
        homeScore: number;
        awayScore: number;
        eventType: EventType;
        momentum: number;
    }>;
}
export declare class MatchService {
    private static instance;
    private supabase;
    private cache;
    private constructor();
    static getInstance(supabaseClient?: SupabaseClient<Database>): MatchService;
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
     * Get player's matches with detailed information
     */
    getPlayerMatches(userId: string, filters?: MatchFilters, options?: {
        limit?: number;
        offset?: number;
        includeFutureMatches?: boolean;
        includeStats?: boolean;
    }): Promise<PaginatedServiceResponse<MatchWithDetails>>;
    /**
     * Get detailed match information
     */
    getMatchDetails(matchId: string, options?: {
        userId?: string;
        includeAnalytics?: boolean;
    }): Promise<ServiceResponse<MatchWithDetails & {
        analytics?: MatchAnalytics;
    }>>;
    /**
     * Get live match data with real-time updates
     */
    getLiveMatchData(matchId: string): Promise<ServiceResponse<LiveMatchData>>;
    /**
     * Get active/live matches
     */
    getActiveMatches(filters?: {
        leagueId?: string;
        sportType?: string;
    }, limit?: number): Promise<ServiceResponse<ActiveMatch[]>>;
    /**
     * Get match predictions based on team and player statistics
     */
    getMatchPrediction(matchId: string): Promise<ServiceResponse<MatchPrediction>>;
    /**
     * Get player's performance metrics for a specific match
     */
    getPlayerMatchPerformance(matchId: string, playerId: string): Promise<ServiceResponse<PlayerMatchStats>>;
    /**
     * Private helper methods
     */
    private calculateMatchPlayerStats;
    private calculateLiveStats;
    private generateMatchAnalytics;
    private calculateMatchPrediction;
    private calculateGoalsByPeriod;
    private calculateCardsByTeam;
    private calculateMatchMomentum;
    /**
     * Subscribe to real-time match updates
     */
    subscribeToMatchUpdates(matchId: string, callback: (payload: any) => void, options?: RealtimeSubscriptionOptions): import("@supabase/supabase-js").RealtimeChannel;
    /**
     * Create a new match between two teams
     */
    createMatch(data: {
        homeTeamId: string;
        awayTeamId: string;
        matchDate: string;
        venue?: string;
        leagueId?: string;
        matchType?: 'friendly' | 'league' | 'tournament' | 'regular_season';
    }): Promise<ServiceResponse<any>>;
    /**
     * Update match score and status
     */
    updateMatchScore(matchId: string, data: {
        homeScore: number;
        awayScore: number;
        status?: MatchStatus;
        duration?: number;
        notes?: string;
    }): Promise<ServiceResponse<any>>;
    /**
     * Get match participants
     */
    getMatchParticipants(matchId: string): Promise<ServiceResponse<{
        homeTeam: {
            id: string;
            name: string;
            participants: any[];
        };
        awayTeam: {
            id: string;
            name: string;
            participants: any[];
        };
    }>>;
    /**
     * Add participant to match
     */
    addMatchParticipant(data: {
        matchId: string;
        teamId: string;
        userId: string;
        position?: string;
        jerseyNumber?: number;
        isStarter?: boolean;
        isCaptain?: boolean;
    }): Promise<ServiceResponse<any>>;
    /**
     * Remove participant from match
     */
    removeMatchParticipant(participantId: string): Promise<ServiceResponse<void>>;
    /**
     * Clear cache
     */
    clearCache(pattern?: string): void;
}
//# sourceMappingURL=match.service.d.ts.map
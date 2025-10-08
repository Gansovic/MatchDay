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
import { Database, UserProfile, PlayerProfileExtended, PlayerCrossLeagueStats, ServiceResponse, PaginatedServiceResponse, TeamJoinRequest, JoinRequestStatus, Achievement, UserAchievement, CacheOptions, RealtimeSubscriptionOptions } from '@matchday/database';
export declare class PlayerService {
    private static instance;
    private supabase;
    private cache;
    private constructor();
    static getInstance(supabaseClient?: SupabaseClient<Database>): PlayerService;
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
     * Get comprehensive player profile with all related data
     */
    getPlayerProfile(userId: string, options?: CacheOptions): Promise<ServiceResponse<PlayerProfileExtended>>;
    /**
     * Update player profile information
     */
    updatePlayerProfile(userId: string, updates: Partial<Database['public']['Tables']['user_profiles']['Update']>): Promise<ServiceResponse<UserProfile>>;
    /**
     * Get player's cross-league statistics aggregation
     */
    getCrossLeagueStats(userId: string, seasonYear?: number): Promise<ServiceResponse<PlayerCrossLeagueStats>>;
    /**
     * Get player's global rankings across different stats
     */
    getPlayerGlobalRankings(userId: string): Promise<ServiceResponse<{
        goals: {
            rank: number;
            total: number;
            percentile: number;
        } | null;
        assists: {
            rank: number;
            total: number;
            percentile: number;
        } | null;
        matches: {
            rank: number;
            total: number;
            percentile: number;
        } | null;
    }>>;
    /**
     * Get player's achievements with progress tracking
     */
    getPlayerAchievements(userId: string, options?: {
        category?: string;
        completed?: boolean;
        limit?: number;
        offset?: number;
    }): Promise<PaginatedServiceResponse<{
        achievement: Achievement;
        userAchievement: UserAchievement | null;
        progress?: {
            current: number;
            target: number;
            percentage: number;
        };
    }>>;
    /**
     * Get player's team join requests
     */
    getTeamJoinRequests(userId: string, options?: {
        status?: JoinRequestStatus;
        limit?: number;
    }): Promise<ServiceResponse<Array<TeamJoinRequest & {
        team: Database['public']['Tables']['teams']['Row'];
        league: Database['public']['Tables']['leagues']['Row'];
    }>>>;
    /**
     * Submit a team join request
     */
    submitTeamJoinRequest(userId: string, teamId: string, options?: {
        message?: string;
        preferredPosition?: string;
        requestedJerseyNumber?: number;
    }): Promise<ServiceResponse<TeamJoinRequest>>;
    /**
     * Withdraw a team join request
     */
    withdrawTeamJoinRequest(userId: string, requestId: string): Promise<ServiceResponse<boolean>>;
    /**
     * Search for players across leagues
     */
    searchPlayers(options?: {
        query?: string;
        leagueId?: string;
        sportType?: string;
        minGames?: number;
        limit?: number;
        offset?: number;
    }): Promise<PaginatedServiceResponse<PlayerCrossLeagueStats>>;
    /**
     * Subscribe to real-time updates for player data
     */
    subscribeToPlayerUpdates(userId: string, callback: (payload: any) => void, options?: RealtimeSubscriptionOptions): import("@supabase/supabase-js").RealtimeChannel;
    /**
     * Clear cache for specific operations or all cache
     */
    clearCache(pattern?: string): void;
}
//# sourceMappingURL=player.service.d.ts.map
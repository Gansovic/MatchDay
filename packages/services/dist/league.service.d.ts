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
import { Database, League, LeagueDiscovery, LeagueFilters, ServiceResponse, PaginatedServiceResponse, RealtimeSubscriptionOptions } from '@matchday/database';
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
export interface PublishLeagueData {
    leagueId: string;
    isPublic: boolean;
    autoApproveTeams?: boolean;
    registrationDeadline?: string;
    maxTeams?: number;
    featured?: boolean;
}
export declare class LeagueService {
    private static instance;
    private supabase;
    private cache;
    private constructor();
    static getInstance(supabaseClient?: SupabaseClient<Database>): LeagueService;
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
     * Create a new league (Admin only)
     */
    createLeague(name: string, userId: string): Promise<ServiceResponse<League>>;
    /**
     * Publish or unpublish a league (Admin only)
     * Publishing makes a league discoverable to teams who can request to join
     */
    publishLeague(publishData: PublishLeagueData): Promise<ServiceResponse<League>>;
    /**
     * Get leagues created by a specific admin user
     * Returns both public and private leagues
     */
    getAdminLeagues(adminId: string, options?: {
        limit?: number;
        offset?: number;
    }): Promise<PaginatedServiceResponse<LeagueDiscovery>>;
    /**
     * Discover available leagues with advanced filtering
     */
    discoverLeagues(filters?: LeagueFilters, options?: {
        userId?: string;
        includeCompatibilityScore?: boolean;
        limit?: number;
        offset?: number;
    }): Promise<PaginatedServiceResponse<LeagueDiscovery>>;
    /**
     * Get detailed league information
     */
    getLeagueDetails(leagueId: string, options?: {
        userId?: string;
    }): Promise<ServiceResponse<LeagueDiscovery>>;
    /**
     * Calculate compatibility score between user and league
     */
    calculateCompatibilityScore(leagueId: string, userId: string): Promise<ServiceResponse<LeagueCompatibilityScore>>;
    /**
     * Get available teams in a league for joining
     */
    getAvailableTeams(leagueId: string, options?: {
        userId?: string;
    }): Promise<ServiceResponse<TeamAvailability[]>>;
    /**
     * Get player's league memberships
     */
    getPlayerLeagueMemberships(userId: string): Promise<ServiceResponse<Array<LeagueDiscovery & {
        teamMembership: {
            teamId: string;
            teamName: string;
            position?: string;
            jerseyNumber?: number;
            joinedAt: string;
        };
    }>>>;
    /**
     * Private helper methods
     */
    private getLeaguePlayerCount;
    private getLeagueAvailableSpots;
    private calculateSkillMatch;
    private calculateLocationProximity;
    private calculateScheduleCompatibility;
    private calculateTeamAvailability;
    private calculateEntryAffordability;
    private generateRecommendations;
    private getRequiredPositions;
    /**
     * Subscribe to real-time league updates
     */
    subscribeToLeagueUpdates(leagueId: string, callback: (payload: any) => void, options?: RealtimeSubscriptionOptions): import("@supabase/supabase-js").RealtimeChannel;
    /**
     * Clear cache
     */
    clearCache(pattern?: string): void;
}
//# sourceMappingURL=league.service.d.ts.map
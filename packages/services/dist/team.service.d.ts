/**
 * Team Service for MatchDay
 *
 * Handles comprehensive team-related operations with focus on:
 * - Team creation and management
 * - Team member management and join requests
 * - Team statistics and performance tracking
 * - Real-time team updates and notifications
 *
 * Optimized for amateur sports leagues with proper error handling,
 * caching strategies, and authentication integration.
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { Database, Team, TeamMember, UpdateTeam, CreateTeamForm, ServiceResponse, PaginatedServiceResponse, TeamJoinRequest, UserProfile, League, CacheOptions, RealtimeSubscriptionOptions } from '@matchday/database';
export interface TeamWithDetails extends Team {
    league: League | null;
    leagues: Array<{
        id: string;
        name: string;
        seasons: number[];
        isCurrent: boolean;
    }>;
    captain?: UserProfile;
    members: Array<TeamMember & {
        user_profile: UserProfile;
    }>;
    memberCount: number;
    availableSpots: number;
    joinRequests?: TeamJoinRequest[];
    stats?: {
        wins: number;
        draws: number;
        losses: number;
        goals_for: number;
        goals_against: number;
        points: number;
        position: number;
        total_teams: number;
    };
    isOrphaned?: boolean;
    previousLeagueName?: string;
}
export interface TeamCreationOptions {
    auto_add_creator: boolean;
    initial_position?: string;
    initial_jersey_number?: number;
}
export declare class TeamService {
    private static instance;
    private supabase;
    private cache;
    private constructor();
    static getInstance(supabaseClient?: SupabaseClient<Database>): TeamService;
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
     * Create a new team
     */
    createTeam(captainId: string, teamData: CreateTeamForm, options?: TeamCreationOptions): Promise<ServiceResponse<TeamWithDetails>>;
    /**
     * Get season year for a team by checking their actual match dates
     */
    private getTeamSeasonYear;
    /**
     * Get all leagues this team has participated in
     */
    private getTeamLeagues;
    /**
     * Get detailed team information
     */
    getTeamDetails(teamId: string, options?: CacheOptions): Promise<ServiceResponse<TeamWithDetails>>;
    /**
     * Get all teams for a user (where user is a member)
     */
    getUserTeams(userId: string, options?: {
        includeInactive?: boolean;
        limit?: number;
    }): Promise<ServiceResponse<TeamWithDetails[]>>;
    /**
     * Update team information
     */
    updateTeam(teamId: string, captainId: string, updates: UpdateTeam): Promise<ServiceResponse<Team>>;
    /**
     * Find league by sport and location for team creation
     */
    findLeagueByName(sport: string, leagueName: string): Promise<ServiceResponse<League>>;
    /**
     * Search teams across leagues
     */
    searchTeams(options?: {
        query?: string;
        sport?: string;
        location?: string;
        hasAvailableSpots?: boolean;
        limit?: number;
        offset?: number;
    }): Promise<PaginatedServiceResponse<TeamWithDetails>>;
    /**
     * Subscribe to real-time team updates
     */
    subscribeToTeamUpdates(teamId: string, callback: (payload: any) => void, options?: RealtimeSubscriptionOptions): import("@supabase/supabase-js").RealtimeChannel;
    /**
     * Clear cache for specific operations or all cache
     */
    clearCache(pattern?: string): void;
    /**
     * Get all orphaned teams (teams without a league)
     */
    getOrphanedTeams(options?: {
        includeArchived?: boolean;
        limit?: number;
        offset?: number;
    }): Promise<PaginatedServiceResponse<TeamWithDetails>>;
    /**
     * Reassign an orphaned team to a new league
     */
    reassignTeamToLeague(teamId: string, newLeagueId: string, userId: string): Promise<ServiceResponse<TeamWithDetails>>;
    /**
     * Archive an orphaned team
     */
    archiveTeam(teamId: string, userId: string): Promise<ServiceResponse<Team>>;
}
//# sourceMappingURL=team.service.d.ts.map
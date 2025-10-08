/**
 * Edge Functions Service for MatchDay
 *
 * Handles ALL server communication following the LEVER principle of server-side authority.
 * ALL business logic operations MUST go through Edge Functions to maintain data integrity,
 * security, and proper audit logging.
 *
 * @example
 * ```typescript
 * const result = await EdgeFunctionsService.getInstance().createLeague(leagueData);
 * const match = await EdgeFunctionsService.getInstance().recordMatchResult(matchData);
 * ```
 *
 * This service should be used for ALL write operations and complex business logic.
 */
export interface EdgeFunctionResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    auditLogId?: string;
}
export declare class EdgeFunctionsService {
    private static instance;
    private supabase;
    private constructor();
    static getInstance(): EdgeFunctionsService;
    setSupabaseClient(client: any): void;
    private invokeFunction;
    createLeague(leagueData: {
        name: string;
        description?: string;
        sport_type: string;
        league_type: string;
        location?: string;
        season_start: string;
        season_end: string;
        max_teams: number;
        entry_fee?: number;
    }): Promise<EdgeFunctionResponse>;
    updateLeague(leagueId: string, updates: any): Promise<EdgeFunctionResponse>;
    deleteLeague(leagueId: string): Promise<EdgeFunctionResponse>;
    createTeam(teamData: {
        league_id: string;
        name: string;
        logo_url?: string;
        team_color?: string;
    }): Promise<EdgeFunctionResponse>;
    joinTeam(teamId: string, playerData: {
        position?: string;
        jersey_number?: number;
    }): Promise<EdgeFunctionResponse>;
    leaveTeam(teamId: string): Promise<EdgeFunctionResponse>;
    updateTeamMember(teamId: string, userId: string, updates: {
        position?: string;
        jersey_number?: number;
        is_active?: boolean;
    }): Promise<EdgeFunctionResponse>;
    createMatch(matchData: {
        league_id: string;
        home_team_id: string;
        away_team_id: string;
        scheduled_date: string;
        venue?: string;
        match_day?: number;
    }): Promise<EdgeFunctionResponse>;
    recordMatchResult(matchId: string, result: {
        home_score: number;
        away_score: number;
        events?: Array<{
            team_id: string;
            player_id: string;
            event_type: string;
            event_time: number;
            description?: string;
        }>;
    }): Promise<EdgeFunctionResponse>;
    updateMatchStatus(matchId: string, status: string): Promise<EdgeFunctionResponse>;
    recalculatePlayerStats(playerId: string, leagueId?: string): Promise<EdgeFunctionResponse>;
    recalculateTeamStats(teamId: string): Promise<EdgeFunctionResponse>;
    checkAchievements(userId: string, context?: any): Promise<EdgeFunctionResponse>;
    generateLeagueSchedule(leagueId: string, options?: {
        rounds?: number;
        start_date?: string;
        days_between_matches?: number;
    }): Promise<EdgeFunctionResponse>;
    importPlayers(teamId: string, players: Array<{
        email: string;
        display_name: string;
        position?: string;
        jersey_number?: number;
    }>): Promise<EdgeFunctionResponse>;
    bulkCreateMatches(matches: Array<{
        league_id: string;
        home_team_id: string;
        away_team_id: string;
        scheduled_date: string;
        venue?: string;
        match_day?: number;
    }>): Promise<EdgeFunctionResponse>;
    updateUserProfile(updates: {
        display_name?: string;
        avatar_url?: string;
        preferred_position?: string;
        bio?: string;
        date_of_birth?: string;
        location?: string;
    }): Promise<EdgeFunctionResponse>;
    getCrossLeagueStats(userId: string): Promise<EdgeFunctionResponse>;
    getGlobalLeaderboards(options?: {
        stat_type?: string;
        sport_type?: string;
        time_period?: string;
        limit?: number;
    }): Promise<EdgeFunctionResponse>;
}
//# sourceMappingURL=edge-functions.service.d.ts.map
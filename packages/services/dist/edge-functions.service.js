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
export class EdgeFunctionsService {
    constructor() { }
    static getInstance() {
        if (!EdgeFunctionsService.instance) {
            EdgeFunctionsService.instance = new EdgeFunctionsService();
        }
        return EdgeFunctionsService.instance;
    }
    setSupabaseClient(client) {
        this.supabase = client;
    }
    async invokeFunction(functionName, payload) {
        try {
            const { data, error } = await this.supabase.functions.invoke(functionName, {
                body: payload
            });
            if (error) {
                throw error;
            }
            return data;
        }
        catch (error) {
            console.error(`Edge function ${functionName} failed:`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
    // League Management
    async createLeague(leagueData) {
        return this.invokeFunction('create-league', leagueData);
    }
    async updateLeague(leagueId, updates) {
        return this.invokeFunction('update-league', { leagueId, updates });
    }
    async deleteLeague(leagueId) {
        return this.invokeFunction('delete-league', { leagueId });
    }
    // Team Management
    async createTeam(teamData) {
        return this.invokeFunction('create-team', teamData);
    }
    async joinTeam(teamId, playerData) {
        return this.invokeFunction('join-team', { teamId, ...playerData });
    }
    async leaveTeam(teamId) {
        return this.invokeFunction('leave-team', { teamId });
    }
    async updateTeamMember(teamId, userId, updates) {
        return this.invokeFunction('update-team-member', { teamId, userId, updates });
    }
    // Match Management
    async createMatch(matchData) {
        return this.invokeFunction('create-match', matchData);
    }
    async recordMatchResult(matchId, result) {
        return this.invokeFunction('record-match-result', { matchId, ...result });
    }
    async updateMatchStatus(matchId, status) {
        return this.invokeFunction('update-match-status', { matchId, status });
    }
    // Statistics & Achievements
    async recalculatePlayerStats(playerId, leagueId) {
        return this.invokeFunction('recalculate-player-stats', { playerId, leagueId });
    }
    async recalculateTeamStats(teamId) {
        return this.invokeFunction('recalculate-team-stats', { teamId });
    }
    async checkAchievements(userId, context) {
        return this.invokeFunction('check-achievements', { userId, context });
    }
    // Schedule Generation
    async generateLeagueSchedule(leagueId, options) {
        return this.invokeFunction('generate-schedule', { leagueId, options });
    }
    // Batch Operations
    async importPlayers(teamId, players) {
        return this.invokeFunction('import-players', { teamId, players });
    }
    async bulkCreateMatches(matches) {
        return this.invokeFunction('bulk-create-matches', { matches });
    }
    // User Profile
    async updateUserProfile(updates) {
        return this.invokeFunction('update-user-profile', updates);
    }
    // Cross-League Analytics
    async getCrossLeagueStats(userId) {
        return this.invokeFunction('get-cross-league-stats', { userId });
    }
    async getGlobalLeaderboards(options) {
        return this.invokeFunction('get-global-leaderboards', options || {});
    }
}
//# sourceMappingURL=edge-functions.service.js.map
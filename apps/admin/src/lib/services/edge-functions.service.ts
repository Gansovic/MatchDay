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

export class EdgeFunctionsService {
  private static instance: EdgeFunctionsService;
  private supabase: any; // Will be injected
  
  private constructor() {}
  
  static getInstance(): EdgeFunctionsService {
    if (!EdgeFunctionsService.instance) {
      EdgeFunctionsService.instance = new EdgeFunctionsService();
    }
    return EdgeFunctionsService.instance;
  }
  
  setSupabaseClient(client: any) {
    this.supabase = client;
  }
  
  private async invokeFunction<T>(
    functionName: string, 
    payload: any
  ): Promise<EdgeFunctionResponse<T>> {
    try {
      const { data, error } = await this.supabase.functions.invoke(functionName, {
        body: payload
      });
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error(`Edge function ${functionName} failed:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
  
  // League Management
  async createLeague(leagueData: {
    name: string;
    description?: string;
    sport_type: string;
    league_type: string;
    location?: string;
    season_start: string;
    season_end: string;
    max_teams: number;
    entry_fee?: number;
  }): Promise<EdgeFunctionResponse> {
    return this.invokeFunction('create-league', leagueData);
  }
  
  async updateLeague(leagueId: string, updates: any): Promise<EdgeFunctionResponse> {
    return this.invokeFunction('update-league', { leagueId, updates });
  }
  
  async deleteLeague(leagueId: string): Promise<EdgeFunctionResponse> {
    return this.invokeFunction('delete-league', { leagueId });
  }
  
  // Team Management
  async createTeam(teamData: {
    league_id: string;
    name: string;
    logo_url?: string;
    team_color?: string;
  }): Promise<EdgeFunctionResponse> {
    return this.invokeFunction('create-team', teamData);
  }
  
  async joinTeam(teamId: string, playerData: {
    position?: string;
    jersey_number?: number;
  }): Promise<EdgeFunctionResponse> {
    return this.invokeFunction('join-team', { teamId, ...playerData });
  }
  
  async leaveTeam(teamId: string): Promise<EdgeFunctionResponse> {
    return this.invokeFunction('leave-team', { teamId });
  }
  
  async updateTeamMember(teamId: string, userId: string, updates: {
    position?: string;
    jersey_number?: number;
    is_active?: boolean;
  }): Promise<EdgeFunctionResponse> {
    return this.invokeFunction('update-team-member', { teamId, userId, updates });
  }
  
  // Match Management
  async createMatch(matchData: {
    league_id: string;
    home_team_id: string;
    away_team_id: string;
    scheduled_date: string;
    venue?: string;
    match_day?: number;
  }): Promise<EdgeFunctionResponse> {
    return this.invokeFunction('create-match', matchData);
  }
  
  async recordMatchResult(matchId: string, result: {
    home_score: number;
    away_score: number;
    events?: Array<{
      team_id: string;
      player_id: string;
      event_type: string;
      event_time: number;
      description?: string;
    }>;
  }): Promise<EdgeFunctionResponse> {
    return this.invokeFunction('record-match-result', { matchId, ...result });
  }
  
  async updateMatchStatus(matchId: string, status: string): Promise<EdgeFunctionResponse> {
    return this.invokeFunction('update-match-status', { matchId, status });
  }
  
  // Statistics & Achievements
  async recalculatePlayerStats(playerId: string, leagueId?: string): Promise<EdgeFunctionResponse> {
    return this.invokeFunction('recalculate-player-stats', { playerId, leagueId });
  }
  
  async recalculateTeamStats(teamId: string): Promise<EdgeFunctionResponse> {
    return this.invokeFunction('recalculate-team-stats', { teamId });
  }
  
  async checkAchievements(userId: string, context?: any): Promise<EdgeFunctionResponse> {
    return this.invokeFunction('check-achievements', { userId, context });
  }
  
  // Schedule Generation
  async generateLeagueSchedule(leagueId: string, options?: {
    rounds?: number;
    start_date?: string;
    days_between_matches?: number;
  }): Promise<EdgeFunctionResponse> {
    return this.invokeFunction('generate-schedule', { leagueId, options });
  }
  
  // Batch Operations
  async importPlayers(teamId: string, players: Array<{
    email: string;
    display_name: string;
    position?: string;
    jersey_number?: number;
  }>): Promise<EdgeFunctionResponse> {
    return this.invokeFunction('import-players', { teamId, players });
  }
  
  async bulkCreateMatches(matches: Array<{
    league_id: string;
    home_team_id: string;
    away_team_id: string;
    scheduled_date: string;
    venue?: string;
    match_day?: number;
  }>): Promise<EdgeFunctionResponse> {
    return this.invokeFunction('bulk-create-matches', { matches });
  }
  
  // User Profile
  async updateUserProfile(updates: {
    display_name?: string;
    avatar_url?: string;
    preferred_position?: string;
    bio?: string;
    date_of_birth?: string;
    location?: string;
  }): Promise<EdgeFunctionResponse> {
    return this.invokeFunction('update-user-profile', updates);
  }
  
  // Cross-League Analytics
  async getCrossLeagueStats(userId: string): Promise<EdgeFunctionResponse> {
    return this.invokeFunction('get-cross-league-stats', { userId });
  }
  
  async getGlobalLeaderboards(options?: {
    stat_type?: string; // 'goals', 'assists', 'games_played'
    sport_type?: string;
    time_period?: string; // 'current_season', 'all_time'
    limit?: number;
  }): Promise<EdgeFunctionResponse> {
    return this.invokeFunction('get-global-leaderboards', options || {});
  }
}
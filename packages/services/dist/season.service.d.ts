/**
 * Season Service for MatchDay
 *
 * Handles season management operations including:
 * - Season creation and management
 * - Team registration for seasons
 * - Match scheduling and fixture generation
 * - Season statistics and standings
 */
import { SupabaseClient } from '@supabase/supabase-js';
export interface Season {
    id: string;
    name: string;
    league_id: string;
    season_year: number;
    display_name?: string;
    status: 'draft' | 'registration' | 'active' | 'completed' | 'cancelled';
    tournament_format: 'league' | 'knockout' | 'hybrid';
    start_date: string;
    end_date: string;
    registration_deadline?: string;
    match_frequency?: number;
    preferred_match_time?: string;
    min_teams?: number;
    max_teams?: number;
    registered_teams_count?: number;
    rounds?: number;
    points_for_win?: number;
    points_for_draw?: number;
    points_for_loss?: number;
    allow_draws?: boolean;
    home_away_balance?: boolean;
    fixtures_status: 'pending' | 'generating' | 'completed' | 'error';
    fixtures_generated_at?: string;
    total_matches_planned?: number;
    rules?: any;
    settings?: any;
    metadata?: any;
    created_at: string;
    updated_at: string;
    created_by?: string;
    updated_by?: string;
}
export interface SeasonTeam {
    id: string;
    season_id: string;
    team_id: string;
    registration_date: string;
    status: 'registered' | 'confirmed' | 'withdrawn';
    team?: {
        id: string;
        name: string;
        team_color?: string;
        captain_id?: string;
    };
}
export interface Match {
    id: string;
    season_id: string;
    home_team_id: string;
    away_team_id: string;
    match_date?: string;
    round_number?: number;
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    home_score?: number;
    away_score?: number;
    venue?: string;
    home_team?: {
        id: string;
        name: string;
        team_color?: string;
    };
    away_team?: {
        id: string;
        name: string;
        team_color?: string;
    };
}
export interface ServiceResponse<T> {
    data: T | null;
    error: any | null;
    success: boolean;
    message?: string;
}
export declare class SeasonService {
    private static instance;
    private supabase;
    private constructor();
    static getInstance(supabaseClient?: SupabaseClient): SeasonService;
    /**
     * Get all seasons for a league
     */
    getSeasonsByLeague(leagueId: string): Promise<ServiceResponse<Season[]>>;
    /**
     * Get season details with teams
     */
    getSeasonDetails(seasonId: string): Promise<ServiceResponse<Season & {
        teams?: SeasonTeam[];
    }>>;
    /**
     * Create a new season
     */
    createSeason(seasonData: Partial<Season>): Promise<ServiceResponse<Season>>;
    /**
     * Update season
     */
    updateSeason(seasonId: string, updates: Partial<Season>): Promise<ServiceResponse<Season>>;
    /**
     * Register team for season
     */
    registerTeamForSeason(seasonId: string, teamId: string): Promise<ServiceResponse<SeasonTeam>>;
    /**
     * Generate round-robin fixtures for a season
     */
    generateFixtures(seasonId: string): Promise<ServiceResponse<Match[]>>;
    /**
     * Get matches for a season
     */
    getSeasonMatches(seasonId: string): Promise<ServiceResponse<Match[]>>;
    /**
     * Private helper methods
     */
    private updateRegisteredTeamsCount;
    private calculateTotalMatches;
    private generateRoundRobinFixtures;
    private assignMatchDates;
}
//# sourceMappingURL=season.service.d.ts.map
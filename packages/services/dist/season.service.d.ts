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
    match_day?: string;
    match_start_time?: string;
    match_end_time?: string;
    courts_available?: number;
    games_per_court?: number;
    rest_weeks_between_matches?: number;
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
    match_time?: string;
    matchday_number?: number;
    court_number?: number;
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
     * Get all match dates for a specific day of week within season
     * For amateur leagues: Returns all Thursdays (or specified day) within the season
     */
    private getMatchDatesForDay;
    /**
     * Assign match dates for amateur league scheduling
     * All games in a matchday happen at the SAME time on different courts
     *
     * Example: Thursday 19:00-21:00, 4 courts, 2 games per court = 8 games capacity
     * - Matchday 1: 8 games on Thursday Week 1 at 19:00, courts 1-4
     * - Matchday 2: 8 games on Thursday Week 2 at 19:00, courts 1-4
     */
    private assignMatchDatesAdvanced;
    /**
     * Generate round-robin fixtures for a season
     * @param seasonId The season to generate fixtures for
     * @param preview If true, returns preview without saving to database
     * @param seasonOverride Optional season data override (for preview with unsaved changes)
     */
    generateFixtures(seasonId: string, preview?: boolean, seasonOverride?: any): Promise<ServiceResponse<Match[]>>;
    /**
     * Get matches for a season
     */
    getSeasonMatches(seasonId: string): Promise<ServiceResponse<Match[]>>;
    /**
     * Private helper methods
     */
    private updateRegisteredTeamsCount;
    private calculateTotalMatches;
    /**
     * Validate fixture constraints:
     * 1. No team plays more than once on the same matchday
     *
     * Note: Courts can have multiple games on the same day at different times
     * (e.g., games_per_court = 2 means 2 sequential time slots on same court)
     */
    private validateFixtureConstraints;
    /**
     * Generate round-robin fixtures using the circle/polygon method
     * This ensures each team plays exactly once per round and proper distribution
     *
     * Circle Method Algorithm:
     * - Fix one team in position, rotate others clockwise
     * - For N teams, generates N-1 rounds (or N if odd, with byes)
     * - Each round has N/2 matches (or (N-1)/2 if odd)
     *
     * Example with 6 teams (A,B,C,D,E,F):
     * Round 1: A-F, B-E, C-D
     * Round 2: A-E, F-D, B-C
     * Round 3: A-D, E-C, F-B
     * etc.
     */
    private generateRoundRobinFixtures;
}
//# sourceMappingURL=season.service.d.ts.map
/**
 * League Standings Calculator Utility
 *
 * Utility functions for calculating league standings from match results
 * and updating standings automatically when matches are completed.
 */
export interface Match {
    id: string;
    league_id: string;
    home_team_id: string;
    home_team_name: string;
    away_team_id: string;
    away_team_name: string;
    home_score?: number;
    away_score?: number;
    status: 'scheduled' | 'live' | 'completed' | 'cancelled';
    match_date: string;
    match_week?: number;
}
export interface Team {
    id: string;
    name: string;
    team_color?: string;
    league_id: string;
}
export interface StandingsTeam {
    id: string;
    name: string;
    team_color?: string;
    position: number;
    previous_position?: number;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goals_for: number;
    goals_against: number;
    goal_difference: number;
    points: number;
    recent_form: ('W' | 'D' | 'L')[];
    form_trend?: 'improving' | 'declining' | 'stable';
}
export interface PointSystem {
    win: number;
    draw: number;
    loss: number;
}
export interface StandingsConfig {
    pointSystem?: PointSystem;
    tiebreakers?: ('goal_difference' | 'goals_for' | 'goals_against' | 'head_to_head')[];
    formLength?: number;
}
/**
 * Calculate league standings from match results
 */
export declare function calculateStandings(matches: Match[], teams: Team[], config?: StandingsConfig): StandingsTeam[];
/**
 * Get position changes from previous standings
 */
export declare function getPositionChanges(currentStandings: StandingsTeam[], previousStandings?: StandingsTeam[]): StandingsTeam[];
/**
 * Check if standings need update based on new match result
 */
export declare function shouldUpdateStandings(match: Match): boolean;
/**
 * Simulate standings update when match result changes
 */
export declare function updateStandingsFromMatch(currentStandings: StandingsTeam[], match: Match, teams: Team[], config?: StandingsConfig): StandingsTeam[];
/**
 * Get teams affected by standings update
 */
export declare function getAffectedTeams(match: Match): string[];
/**
 * Format standings for display
 */
export declare function formatStandingsForDisplay(standings: StandingsTeam[]): {
    standings: StandingsTeam[];
    summary: {
        totalTeams: number;
        totalMatches: number;
        totalGoals: number;
        averageGoalsPerGame: number;
    };
};
//# sourceMappingURL=standings-calculator.d.ts.map
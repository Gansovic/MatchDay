/**
 * Sample Data Generator for MatchDay
 *
 * Generates realistic sample data for demonstration purposes including:
 * - 4-team league with realistic Premier League team names
 * - Complete round-robin tournament schedule
 * - Randomized but realistic match results
 * - Player statistics and achievements
 */
export interface SampleTeam {
    id: string;
    name: string;
    team_color: string;
    short_name: string;
}
export interface SampleMatch {
    id: string;
    home_team_id: string;
    away_team_id: string;
    home_score: number;
    away_score: number;
    match_date: string;
    venue: string;
    status: 'completed';
    match_day: number;
}
export interface SamplePlayer {
    id: string;
    name: string;
    position: 'goalkeeper' | 'defender' | 'midfielder' | 'forward';
    team_id: string;
    jersey_number: number;
}
export interface SamplePlayerStat {
    player_id: string;
    match_id: string;
    goals: number;
    assists: number;
    yellow_cards: number;
    red_cards: number;
    minutes_played: number;
    clean_sheets: number;
}
export declare class SampleDataGenerator {
    private static readonly SAMPLE_TEAMS;
    private static readonly SAMPLE_PLAYERS;
    private static readonly VENUES;
    /**
     * Generate a complete round-robin tournament schedule for 4 teams
     * Each team plays every other team twice (home and away)
     */
    static generateMatches(): SampleMatch[];
    /**
     * Generate sample players for all teams
     */
    static generatePlayers(): SamplePlayer[];
    /**
     * Generate realistic player statistics based on matches
     */
    static generatePlayerStats(matches: SampleMatch[], players: SamplePlayer[]): SamplePlayerStat[];
    private static distributeGoals;
    private static assignGoalsToPlayers;
    /**
     * Generate a complete sample season data package
     */
    static generateSampleSeason(): {
        teams: SampleTeam[];
        matches: SampleMatch[];
        players: SamplePlayer[];
        playerStats: SamplePlayerStat[];
        seasonInfo: {
            name: string;
            display_name: string;
            season_year: number;
            status: string;
            start_date: string;
            end_date: string;
        };
    };
}
//# sourceMappingURL=sample-data-generator.d.ts.map
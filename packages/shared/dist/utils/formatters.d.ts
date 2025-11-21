/**
 * Number and Data Formatters for MatchDay
 *
 * Centralized formatting utilities following LEVER principles.
 * ALL number and data formatting MUST use these utilities.
 *
 * @example
 * ```typescript
 * import { NumberFormatters, DateFormatters } from '@/lib/utils/formatters';
 *
 * <span>{NumberFormatters.formatGoals(15)}</span>
 * <span>{DateFormatters.formatMatchDate(matchDate)}</span>
 * ```
 *
 * These formatters should be used for ALL data display.
 */
export declare class NumberFormatters {
    /**
     * Format goals with appropriate suffix
     */
    static formatGoals(goals: number): string;
    /**
     * Format assists with appropriate suffix
     */
    static formatAssists(assists: number): string;
    /**
     * Format match score
     */
    static formatScore(homeScore: number, awayScore: number): string;
    /**
     * Format win/loss record
     */
    static formatRecord(wins: number, draws: number, losses: number): string;
    /**
     * Format percentage with one decimal place
     */
    static formatPercentage(value: number, total: number): string;
    /**
     * Format win percentage
     */
    static formatWinPercentage(wins: number, totalGames: number): string;
    /**
     * Format goals per game average
     */
    static formatGoalsPerGame(goals: number, games: number): string;
    /**
     * Format league points
     */
    static formatPoints(points: number): string;
    /**
     * Format goal difference
     */
    static formatGoalDifference(goalsFor: number, goalsAgainst: number): string;
    /**
     * Format minutes played
     */
    static formatMinutes(minutes: number): string;
    /**
     * Format player position
     */
    static formatPosition(position: string | null): string;
    /**
     * Format jersey number
     */
    static formatJerseyNumber(number: number | null): string;
    /**
     * Format achievement points (with K/M suffixes for large numbers)
     */
    static formatAchievementPoints(points: number): string;
    /**
     * Format performance rating
     */
    static formatRating(rating: number): string;
    /**
     * Format currency values
     */
    static formatCurrency(value: number, currency?: string): string;
    /**
     * Format large numbers with appropriate suffixes
     */
    static formatNumber(value: number): string;
}
export declare class DateFormatters {
    /**
     * Format match date for display
     */
    static formatMatchDate(date: string | Date): string;
    /**
     * Format match time for live scores
     */
    static formatMatchTime(startTime: string | Date, status: string): string;
    /**
     * Format season period
     */
    static formatSeasonPeriod(startDate: string | Date, endDate: string | Date): string;
    /**
     * Format relative time (e.g., "2 hours ago")
     */
    static formatRelativeTime(date: string | Date): string;
    /**
     * Format age from birth date
     */
    static formatAge(birthDate: string | Date): string;
}
export declare class StatusFormatters {
    /**
     * Format match status for display
     */
    static formatMatchStatus(status: string): {
        text: string;
        color: string;
    };
    /**
     * Format league type for display
     */
    static formatLeagueType(type: string): string;
    /**
     * Format sport type for display
     */
    static formatSportType(sport: string): string;
}
//# sourceMappingURL=formatters.d.ts.map
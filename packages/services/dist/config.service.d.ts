/**
 * Configuration Service for MatchDay
 *
 * Manages all application configuration following the LEVER principle of
 * centralized configuration management. Provides hierarchical config loading:
 * 1. Memory cache
 * 2. Local storage
 * 3. Supabase database
 * 4. Default fallbacks
 *
 * @example
 * ```typescript
 * const config = await ConfigService.getInstance().getScoringRules();
 * const maxTeams = await ConfigService.getInstance().getLeagueSettings();
 * ```
 *
 * This service should be used for ALL configuration access.
 */
export declare class ConfigService {
    private static instance;
    private memoryCache;
    private supabase;
    private constructor();
    static getInstance(): ConfigService;
    setSupabaseClient(client: any): void;
    getConfig<T>(key: string): Promise<T>;
    private getDefault;
    getScoringRules(): Promise<{
        win: number;
        draw: number;
        loss: number;
    }>;
    getAchievementRules(): Promise<Record<string, {
        points: number;
    }>>;
    getLeagueSettings(): Promise<{
        max_teams_per_league: number;
        matches_per_season: number;
        min_players_per_team: number;
        max_players_per_team: number;
    }>;
    invalidateConfig(key?: string): void;
}
export declare const configService: ConfigService;
//# sourceMappingURL=config.service.d.ts.map
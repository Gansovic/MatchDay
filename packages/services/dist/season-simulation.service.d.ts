/**
 * Season Simulation Service
 *
 * Simulates complete seasons with realistic match results and player statistics.
 * Creates a new simulated season based on an existing season's teams and configuration.
 */
import { SupabaseClient } from '@supabase/supabase-js';
export interface ServiceResponse<T> {
    data: T | null;
    error: any | null;
    success: boolean;
    message?: string;
}
export declare class SeasonSimulationService {
    private static instance;
    private supabase;
    private seasonService;
    private constructor();
    static getInstance(supabaseClient?: SupabaseClient): SeasonSimulationService;
    /**
     * Simulate a complete season based on an existing season
     */
    simulateCompleteSeason(sourceSeasonId: string, userId?: string): Promise<ServiceResponse<{
        seasonId: string;
        matchesSimulated: number;
    }>>;
    /**
     * Get all players for given teams
     */
    private getTeamPlayers;
    /**
     * Simulate a single match with realistic scores and player stats
     */
    private simulateMatch;
    /**
     * Generate realistic match score (weighted toward lower scores)
     */
    private generateRealisticScore;
    /**
     * Generate player statistics for a team
     */
    private generatePlayerStats;
}
//# sourceMappingURL=season-simulation.service.d.ts.map
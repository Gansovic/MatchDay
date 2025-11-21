/**
 * Sponsor Service for MatchDay
 *
 * Handles all sponsor management operations including CRUD and logo uploads
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { Database, ServiceResponse } from '@matchday/database';
export interface SeasonSponsor {
    id: string;
    season_id: string;
    name: string;
    logo_media_id: string | null;
    logo_url?: string | null;
    website_url: string | null;
    display_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}
export interface CreateSponsorInput {
    season_id: string;
    name: string;
    website_url?: string;
    display_order?: number;
}
export interface UpdateSponsorInput {
    name?: string;
    website_url?: string;
    display_order?: number;
    is_active?: boolean;
}
export declare class SponsorService {
    private static instance;
    private supabase;
    private mediaService;
    private constructor();
    static getInstance(supabaseClient?: SupabaseClient<Database>): SponsorService;
    private handleError;
    /**
     * Get all sponsors for a season
     */
    getSeasonSponsors(seasonId: string): Promise<ServiceResponse<SeasonSponsor[]>>;
    /**
     * Get a single sponsor by ID
     */
    getSponsorById(sponsorId: string): Promise<ServiceResponse<SeasonSponsor>>;
    /**
     * Create a new sponsor
     */
    createSponsor(input: CreateSponsorInput): Promise<ServiceResponse<SeasonSponsor>>;
    /**
     * Update sponsor
     */
    updateSponsor(sponsorId: string, updates: UpdateSponsorInput): Promise<ServiceResponse<SeasonSponsor>>;
    /**
     * Upload sponsor logo
     */
    uploadSponsorLogo(sponsorId: string, seasonId: string, file: File, userId: string): Promise<ServiceResponse<string>>;
    /**
     * Delete sponsor
     */
    deleteSponsor(sponsorId: string): Promise<ServiceResponse<boolean>>;
    /**
     * Reorder sponsors
     */
    reorderSponsors(seasonId: string, sponsorOrders: {
        id: string;
        display_order: number;
    }[]): Promise<ServiceResponse<boolean>>;
}
//# sourceMappingURL=sponsor.service.d.ts.map
// @ts-nocheck
/**
 * Sponsor Service for MatchDay
 *
 * Handles all sponsor management operations including CRUD and logo uploads
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database, ServiceResponse, ServiceError } from '@matchday/database';
import { MediaService } from './media.service';

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

export class SponsorService {
  private static instance: SponsorService;
  private supabase: SupabaseClient<Database>;
  private mediaService: MediaService;

  private constructor(supabaseClient: SupabaseClient<Database>) {
    this.supabase = supabaseClient;
    this.mediaService = MediaService.getInstance(supabaseClient);
  }

  static getInstance(supabaseClient?: SupabaseClient<Database>): SponsorService {
    if (!SponsorService.instance) {
      if (!supabaseClient) {
        throw new Error('SupabaseClient required for first initialization');
      }
      SponsorService.instance = new SponsorService(supabaseClient);
    } else if (supabaseClient) {
      SponsorService.instance.supabase = supabaseClient;
      SponsorService.instance.mediaService = MediaService.getInstance(supabaseClient);
    }
    return SponsorService.instance;
  }

  private handleError(error: any, operation: string): ServiceError {
    console.error(`SponsorService.${operation}:`, error);
    return {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'An unexpected error occurred',
      details: error.details || error,
      timestamp: new Date().toISOString(),
      operation
    };
  }

  /**
   * Get all sponsors for a season
   */
  async getSeasonSponsors(seasonId: string): Promise<ServiceResponse<SeasonSponsor[]>> {
    try {
      const { data: sponsors, error } = await this.supabase
        .from('season_sponsors')
        .select('*')
        .eq('season_id', seasonId)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      // Fetch logo URLs for sponsors with logo_media_id
      const sponsorsWithUrls = await Promise.all(
        (sponsors || []).map(async (sponsor) => {
          let logo_url = null;
          if (sponsor.logo_media_id) {
            const mediaResponse = await this.mediaService.getMediaById(sponsor.logo_media_id);
            if (mediaResponse.success && mediaResponse.data) {
              logo_url = mediaResponse.data.url;
            }
          }
          return {
            ...sponsor,
            logo_url
          };
        })
      );

      return {
        data: sponsorsWithUrls,
        error: null,
        success: true
      };
    } catch (error) {
      return {
        data: null,
        error: this.handleError(error, 'getSeasonSponsors'),
        success: false
      };
    }
  }

  /**
   * Get a single sponsor by ID
   */
  async getSponsorById(sponsorId: string): Promise<ServiceResponse<SeasonSponsor>> {
    try {
      const { data: sponsor, error } = await this.supabase
        .from('season_sponsors')
        .select('*')
        .eq('id', sponsorId)
        .single();

      if (error) throw error;

      let logo_url = null;
      if (sponsor.logo_media_id) {
        const mediaResponse = await this.mediaService.getMediaById(sponsor.logo_media_id);
        if (mediaResponse.success && mediaResponse.data) {
          logo_url = mediaResponse.data.url;
        }
      }

      return {
        data: {
          ...sponsor,
          logo_url
        },
        error: null,
        success: true
      };
    } catch (error) {
      return {
        data: null,
        error: this.handleError(error, 'getSponsorById'),
        success: false
      };
    }
  }

  /**
   * Create a new sponsor
   */
  async createSponsor(input: CreateSponsorInput): Promise<ServiceResponse<SeasonSponsor>> {
    try {
      const { data: sponsor, error } = await this.supabase
        .from('season_sponsors')
        .insert({
          season_id: input.season_id,
          name: input.name,
          website_url: input.website_url || null,
          display_order: input.display_order ?? 0,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      return {
        data: sponsor,
        error: null,
        success: true
      };
    } catch (error) {
      return {
        data: null,
        error: this.handleError(error, 'createSponsor'),
        success: false
      };
    }
  }

  /**
   * Update sponsor
   */
  async updateSponsor(
    sponsorId: string,
    updates: UpdateSponsorInput
  ): Promise<ServiceResponse<SeasonSponsor>> {
    try {
      const { data: sponsor, error } = await this.supabase
        .from('season_sponsors')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', sponsorId)
        .select()
        .single();

      if (error) throw error;

      return {
        data: sponsor,
        error: null,
        success: true
      };
    } catch (error) {
      return {
        data: null,
        error: this.handleError(error, 'updateSponsor'),
        success: false
      };
    }
  }

  /**
   * Upload sponsor logo
   */
  async uploadSponsorLogo(
    sponsorId: string,
    seasonId: string,
    file: File,
    userId: string
  ): Promise<ServiceResponse<string>> {
    try {
      // Upload logo using MediaService with league_sponsor context
      const uploadResult = await this.mediaService.uploadMedia(
        file,
        {
          context_type: 'league_sponsor',
          season_id: seasonId,
          is_public: true
        },
        userId
      );

      if (!uploadResult.success || !uploadResult.data) {
        throw new Error(uploadResult.error?.message || 'Failed to upload logo');
      }

      // Update sponsor with logo_media_id
      const { error: updateError } = await this.supabase
        .from('season_sponsors')
        .update({
          logo_media_id: uploadResult.data.media.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', sponsorId);

      if (updateError) throw updateError;

      return {
        data: uploadResult.data.storageUrl,
        error: null,
        success: true
      };
    } catch (error) {
      return {
        data: null,
        error: this.handleError(error, 'uploadSponsorLogo'),
        success: false
      };
    }
  }

  /**
   * Delete sponsor
   */
  async deleteSponsor(sponsorId: string): Promise<ServiceResponse<boolean>> {
    try {
      // Get sponsor to check for logo
      const { data: sponsor } = await this.supabase
        .from('season_sponsors')
        .select('logo_media_id')
        .eq('id', sponsorId)
        .single();

      // Delete logo if exists
      if (sponsor?.logo_media_id) {
        const { data: { user } } = await this.supabase.auth.getUser();
        if (user) {
          await this.mediaService.deleteMedia(sponsor.logo_media_id, user.id);
        }
      }

      // Delete sponsor
      const { error } = await this.supabase
        .from('season_sponsors')
        .delete()
        .eq('id', sponsorId);

      if (error) throw error;

      return {
        data: true,
        error: null,
        success: true
      };
    } catch (error) {
      return {
        data: null,
        error: this.handleError(error, 'deleteSponsor'),
        success: false
      };
    }
  }

  /**
   * Reorder sponsors
   */
  async reorderSponsors(
    seasonId: string,
    sponsorOrders: { id: string; display_order: number }[]
  ): Promise<ServiceResponse<boolean>> {
    try {
      // Update all sponsors with new display orders
      const updates = sponsorOrders.map(({ id, display_order }) =>
        this.supabase
          .from('season_sponsors')
          .update({
            display_order,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .eq('season_id', seasonId)
      );

      await Promise.all(updates);

      return {
        data: true,
        error: null,
        success: true
      };
    } catch (error) {
      return {
        data: null,
        error: this.handleError(error, 'reorderSponsors'),
        success: false
      };
    }
  }
}

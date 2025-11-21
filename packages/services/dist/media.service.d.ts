/**
 * Media Service for MatchDay
 *
 * Handles all media upload, retrieval, and management operations
 * Integrates with Supabase Storage for file storage
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { Database, Media, MediaWithUrl, MediaUploadOptions, ServiceResponse, MediaFilters, MediaUploadResult } from '@matchday/database';
export declare class MediaService {
    private static instance;
    private supabase;
    private readonly MAX_IMAGE_SIZE;
    private readonly MAX_VIDEO_SIZE;
    private readonly ALLOWED_IMAGE_TYPES;
    private readonly ALLOWED_VIDEO_TYPES;
    private constructor();
    static getInstance(supabaseClient?: SupabaseClient<Database>): MediaService;
    private handleError;
    /**
     * Validate file before upload
     */
    private validateFile;
    /**
     * Generate storage path based on context
     */
    private generateStoragePath;
    /**
     * Upload media file
     */
    uploadMedia(file: File, options: MediaUploadOptions, userId: string): Promise<ServiceResponse<MediaUploadResult>>;
    /**
     * Get media by filters
     */
    getMedia(filters: MediaFilters): Promise<ServiceResponse<MediaWithUrl[]>>;
    /**
     * Get single media by ID
     */
    getMediaById(mediaId: string): Promise<ServiceResponse<MediaWithUrl>>;
    /**
     * Delete media
     */
    deleteMedia(mediaId: string, userId: string): Promise<ServiceResponse<boolean>>;
    /**
     * Update media metadata
     */
    updateMediaMetadata(mediaId: string, userId: string, updates: {
        tags?: string[];
        description?: string;
        is_public?: boolean;
    }): Promise<ServiceResponse<Media>>;
    /**
     * Get bucket name from context type
     */
    private getBucketFromContext;
    /**
     * Get league icon
     */
    getLeagueIcon(leagueId: string): Promise<ServiceResponse<MediaWithUrl | null>>;
    /**
     * Get season icon with automatic fallback to league icon
     */
    getSeasonIcon(seasonId: string, leagueId: string): Promise<ServiceResponse<MediaWithUrl | null>>;
    /**
     * Upload league icon
     */
    uploadLeagueIcon(file: File, leagueId: string, userId: string): Promise<ServiceResponse<MediaUploadResult>>;
    /**
     * Upload season icon
     */
    uploadSeasonIcon(file: File, seasonId: string, leagueId: string, userId: string): Promise<ServiceResponse<MediaUploadResult>>;
    /**
     * Delete league icon
     */
    deleteLeagueIcon(leagueId: string, userId: string): Promise<ServiceResponse<boolean>>;
    /**
     * Delete season icon
     */
    deleteSeasonIcon(seasonId: string, userId: string): Promise<ServiceResponse<boolean>>;
    /**
     * Get all media for a specific match
     */
    getMatchMedia(matchId: string, filters?: Partial<MediaFilters>): Promise<ServiceResponse<MediaWithUrl[]>>;
    /**
     * Upload media for a match (admin only - enforced by RLS)
     */
    uploadMatchMedia(file: File, matchId: string, userId: string, options?: {
        description?: string;
        tags?: string[];
        is_public?: boolean;
    }): Promise<ServiceResponse<MediaUploadResult>>;
    /**
     * Get all media for a specific player (personal uploads + reposts)
     */
    getPlayerMedia(playerId: string, filters?: Partial<MediaFilters>): Promise<ServiceResponse<MediaWithUrl[]>>;
    /**
     * Upload personal media for a player
     */
    uploadPlayerMedia(file: File, playerId: string, userId: string, options?: {
        description?: string;
        tags?: string[];
        is_public?: boolean;
    }): Promise<ServiceResponse<MediaUploadResult>>;
    /**
     * Repost existing media to player's gallery
     * This creates a reference to the original media without duplicating the file
     */
    repostMedia(originalMediaId: string, playerId: string, userId: string): Promise<ServiceResponse<MediaWithUrl>>;
}
//# sourceMappingURL=media.service.d.ts.map
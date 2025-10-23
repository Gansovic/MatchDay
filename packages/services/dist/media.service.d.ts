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
}
//# sourceMappingURL=media.service.d.ts.map
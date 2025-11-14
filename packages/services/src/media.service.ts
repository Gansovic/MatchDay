/**
 * Media Service for MatchDay
 *
 * Handles all media upload, retrieval, and management operations
 * Integrates with Supabase Storage for file storage
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  Database,
  Media,
  MediaWithUrl,
  MediaUploadOptions,
  MediaContextType,
  MediaType,
  ServiceResponse,
  ServiceError,
  MediaFilters,
  MediaUploadResult
} from '@matchday/database';

export class MediaService {
  private static instance: MediaService;
  private supabase: SupabaseClient<Database>;

  // File size limits in bytes
  private readonly MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

  // Allowed file types
  private readonly ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  private readonly ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];

  private constructor(supabaseClient: SupabaseClient<Database>) {
    this.supabase = supabaseClient;
  }

  static getInstance(supabaseClient?: SupabaseClient<Database>): MediaService {
    if (!MediaService.instance) {
      if (!supabaseClient) {
        throw new Error('SupabaseClient required for first initialization');
      }
      MediaService.instance = new MediaService(supabaseClient);
    } else if (supabaseClient) {
      MediaService.instance.supabase = supabaseClient;
    }
    return MediaService.instance;
  }

  private handleError(error: any, operation: string): ServiceError {
    console.error(`MediaService.${operation}:`, error);
    return {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'An unexpected error occurred',
      details: error.details || error,
      timestamp: new Date().toISOString(),
      operation
    };
  }

  /**
   * Validate file before upload
   */
  private validateFile(file: File, mediaType: MediaType): ServiceError | null {
    const allowedTypes = mediaType === 'image' ? this.ALLOWED_IMAGE_TYPES : this.ALLOWED_VIDEO_TYPES;
    const maxSize = mediaType === 'image' ? this.MAX_IMAGE_SIZE : this.MAX_VIDEO_SIZE;

    if (!allowedTypes.includes(file.type)) {
      return {
        code: 'INVALID_FILE_TYPE',
        message: `File type ${file.type} is not allowed for ${mediaType}s`,
        timestamp: new Date().toISOString()
      };
    }

    if (file.size > maxSize) {
      return {
        code: 'FILE_TOO_LARGE',
        message: `File size exceeds maximum of ${maxSize / (1024 * 1024)}MB`,
        timestamp: new Date().toISOString()
      };
    }

    return null;
  }

  /**
   * Generate storage path based on context
   */
  private generateStoragePath(
    contextType: MediaContextType,
    userId: string,
    filename: string
  ): { bucket: string; path: string } {
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');

    switch (contextType) {
      case 'team_logo':
        return {
          bucket: 'team-logos',
          path: `${userId}/${timestamp}-${sanitizedFilename}`
        };
      case 'user_profile':
        return {
          bucket: 'user-avatars',
          path: `${userId}/${timestamp}-${sanitizedFilename}`
        };
      case 'league_sponsor':
        return {
          bucket: 'league-sponsors',
          path: `${userId}/${timestamp}-${sanitizedFilename}`
        };
      case 'team_media':
        return {
          bucket: 'team-media',
          path: `${userId}/${timestamp}-${sanitizedFilename}`
        };
      case 'season_media':
        return {
          bucket: 'season-media',
          path: `${userId}/${timestamp}-${sanitizedFilename}`
        };
      case 'league_icon':
        return {
          bucket: 'league-icons',
          path: `${userId}/${timestamp}-${sanitizedFilename}`
        };
      case 'season_icon':
        return {
          bucket: 'season-icons',
          path: `${userId}/${timestamp}-${sanitizedFilename}`
        };
      default:
        throw new Error(`Unknown context type: ${contextType}`);
    }
  }

  /**
   * Upload media file
   */
  async uploadMedia(
    file: File,
    options: MediaUploadOptions,
    userId: string
  ): Promise<ServiceResponse<MediaUploadResult>> {
    try {
      const mediaType: MediaType = file.type.startsWith('video/') ? 'video' : 'image';

      // Validate file
      const validationError = this.validateFile(file, mediaType);
      if (validationError) {
        return {
          data: null,
          error: validationError,
          success: false
        };
      }

      // Generate storage path
      const { bucket, path } = this.generateStoragePath(
        options.context_type,
        userId,
        file.name
      );

      // Upload to Supabase Storage
      const { data: storageData, error: storageError } = await this.supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (storageError) throw storageError;

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from(bucket)
        .getPublicUrl(storageData.path);

      // Create media record in database
      const mediaRecord = {
        filename: path,
        original_filename: file.name,
        file_size: file.size,
        mime_type: file.type,
        storage_path: storageData.path,
        media_type: mediaType,
        context_type: options.context_type,
        uploaded_by: userId,
        team_id: options.team_id || null,
        league_id: options.league_id || null,
        season_id: options.season_id || null,
        is_public: options.is_public ?? true,
        tags: options.tags || [],
        description: options.description || null,
        metadata: {}
      };

      const { data: media, error: dbError } = await this.supabase
        .from('media')
        .insert(mediaRecord)
        .select()
        .single();

      if (dbError) {
        // Clean up uploaded file if database insert fails
        await this.supabase.storage.from(bucket).remove([storageData.path]);
        throw dbError;
      }

      const mediaWithUrl: MediaWithUrl = {
        ...media,
        url: urlData.publicUrl
      };

      return {
        data: {
          media: mediaWithUrl,
          storageUrl: urlData.publicUrl
        },
        error: null,
        success: true
      };

    } catch (error) {
      return {
        data: null,
        error: this.handleError(error, 'uploadMedia'),
        success: false
      };
    }
  }

  /**
   * Get media by filters
   */
  async getMedia(filters: MediaFilters): Promise<ServiceResponse<MediaWithUrl[]>> {
    try {
      let query = this.supabase
        .from('media')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.team_id) {
        query = query.eq('team_id', filters.team_id);
      }
      if (filters.league_id) {
        query = query.eq('league_id', filters.league_id);
      }
      if (filters.season_id) {
        query = query.eq('season_id', filters.season_id);
      }
      if (filters.context_type) {
        query = query.eq('context_type', filters.context_type);
      }
      if (filters.media_type) {
        query = query.eq('media_type', filters.media_type);
      }
      if (filters.is_public !== undefined) {
        query = query.eq('is_public', filters.is_public);
      }
      if (filters.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags);
      }

      const { data: mediaList, error } = await query
        .limit(filters.limit || 50)
        .range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 50) - 1);

      if (error) throw error;

      // Add public URLs to each media item
      const mediaWithUrls: MediaWithUrl[] = (mediaList || []).map(media => {
        const bucket = this.getBucketFromContext(media.context_type);
        const { data: urlData } = this.supabase.storage
          .from(bucket)
          .getPublicUrl(media.storage_path);

        return {
          ...media,
          url: urlData.publicUrl
        };
      });

      return {
        data: mediaWithUrls,
        error: null,
        success: true
      };

    } catch (error) {
      return {
        data: null,
        error: this.handleError(error, 'getMedia'),
        success: false
      };
    }
  }

  /**
   * Get single media by ID
   */
  async getMediaById(mediaId: string): Promise<ServiceResponse<MediaWithUrl>> {
    try {
      const { data: media, error } = await this.supabase
        .from('media')
        .select('*')
        .eq('id', mediaId)
        .single();

      if (error) throw error;

      const bucket = this.getBucketFromContext(media.context_type);
      const { data: urlData } = this.supabase.storage
        .from(bucket)
        .getPublicUrl(media.storage_path);

      const mediaWithUrl: MediaWithUrl = {
        ...media,
        url: urlData.publicUrl
      };

      return {
        data: mediaWithUrl,
        error: null,
        success: true
      };

    } catch (error) {
      return {
        data: null,
        error: this.handleError(error, 'getMediaById'),
        success: false
      };
    }
  }

  /**
   * Delete media
   */
  async deleteMedia(mediaId: string, userId: string): Promise<ServiceResponse<boolean>> {
    try {
      // Get media details
      const { data: media, error: fetchError } = await this.supabase
        .from('media')
        .select('*')
        .eq('id', mediaId)
        .single();

      if (fetchError) throw fetchError;

      // Verify user is authorized to delete
      if (media.uploaded_by !== userId) {
        return {
          data: null,
          error: {
            code: 'UNAUTHORIZED',
            message: 'You are not authorized to delete this media',
            timestamp: new Date().toISOString()
          },
          success: false
        };
      }

      // Delete from storage
      const bucket = this.getBucketFromContext(media.context_type);
      const { error: storageError } = await this.supabase.storage
        .from(bucket)
        .remove([media.storage_path]);

      if (storageError) {
        console.warn('Failed to delete from storage:', storageError);
      }

      // Delete from database
      const { error: dbError } = await this.supabase
        .from('media')
        .delete()
        .eq('id', mediaId);

      if (dbError) throw dbError;

      return {
        data: true,
        error: null,
        success: true
      };

    } catch (error) {
      return {
        data: null,
        error: this.handleError(error, 'deleteMedia'),
        success: false
      };
    }
  }

  /**
   * Update media metadata
   */
  async updateMediaMetadata(
    mediaId: string,
    userId: string,
    updates: {
      tags?: string[];
      description?: string;
      is_public?: boolean;
    }
  ): Promise<ServiceResponse<Media>> {
    try {
      const { data: media, error } = await this.supabase
        .from('media')
        .update(updates)
        .eq('id', mediaId)
        .eq('uploaded_by', userId)
        .select()
        .single();

      if (error) throw error;

      return {
        data: media,
        error: null,
        success: true
      };

    } catch (error) {
      return {
        data: null,
        error: this.handleError(error, 'updateMediaMetadata'),
        success: false
      };
    }
  }

  /**
   * Get bucket name from context type
   */
  private getBucketFromContext(contextType: MediaContextType): string {
    switch (contextType) {
      case 'team_logo': return 'team-logos';
      case 'user_profile': return 'user-avatars';
      case 'league_sponsor': return 'league-sponsors';
      case 'team_media': return 'team-media';
      case 'season_media': return 'season-media';
      case 'league_icon': return 'league-icons';
      case 'season_icon': return 'season-icons';
      default: throw new Error(`Unknown context type: ${contextType}`);
    }
  }

  /**
   * Get league icon
   */
  async getLeagueIcon(leagueId: string): Promise<ServiceResponse<MediaWithUrl | null>> {
    try {
      const { data: media, error } = await this.supabase
        .from('media')
        .select('*')
        .eq('league_id', leagueId)
        .eq('context_type', 'league_icon')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (!media) {
        return {
          data: null,
          error: null,
          success: true
        };
      }

      const bucket = this.getBucketFromContext(media.context_type);
      const { data: urlData } = this.supabase.storage
        .from(bucket)
        .getPublicUrl(media.storage_path);

      const mediaWithUrl: MediaWithUrl = {
        ...media,
        url: urlData.publicUrl
      };

      return {
        data: mediaWithUrl,
        error: null,
        success: true
      };

    } catch (error) {
      return {
        data: null,
        error: this.handleError(error, 'getLeagueIcon'),
        success: false
      };
    }
  }

  /**
   * Get season icon with automatic fallback to league icon
   */
  async getSeasonIcon(seasonId: string, leagueId: string): Promise<ServiceResponse<MediaWithUrl | null>> {
    try {
      // First try to get season-specific icon
      const { data: seasonMedia, error: seasonError } = await this.supabase
        .from('media')
        .select('*')
        .eq('season_id', seasonId)
        .eq('context_type', 'season_icon')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (seasonError) throw seasonError;

      if (seasonMedia) {
        const bucket = this.getBucketFromContext(seasonMedia.context_type);
        const { data: urlData } = this.supabase.storage
          .from(bucket)
          .getPublicUrl(seasonMedia.storage_path);

        return {
          data: {
            ...seasonMedia,
            url: urlData.publicUrl
          },
          error: null,
          success: true
        };
      }

      // Fallback to league icon
      return this.getLeagueIcon(leagueId);

    } catch (error) {
      return {
        data: null,
        error: this.handleError(error, 'getSeasonIcon'),
        success: false
      };
    }
  }

  /**
   * Upload league icon
   */
  async uploadLeagueIcon(
    file: File,
    leagueId: string,
    userId: string
  ): Promise<ServiceResponse<MediaUploadResult>> {
    try {
      // Delete existing league icon if any
      const existingIconResponse = await this.getLeagueIcon(leagueId);
      if (existingIconResponse.success && existingIconResponse.data) {
        await this.deleteMedia(existingIconResponse.data.id, userId);
      }

      // Upload new icon
      return this.uploadMedia(
        file,
        {
          context_type: 'league_icon',
          league_id: leagueId,
          is_public: true
        },
        userId
      );

    } catch (error) {
      return {
        data: null,
        error: this.handleError(error, 'uploadLeagueIcon'),
        success: false
      };
    }
  }

  /**
   * Upload season icon
   */
  async uploadSeasonIcon(
    file: File,
    seasonId: string,
    leagueId: string,
    userId: string
  ): Promise<ServiceResponse<MediaUploadResult>> {
    try {
      // Delete existing season icon if any
      const { data: existingMedia } = await this.supabase
        .from('media')
        .select('*')
        .eq('season_id', seasonId)
        .eq('context_type', 'season_icon')
        .maybeSingle();

      if (existingMedia) {
        await this.deleteMedia(existingMedia.id, userId);
      }

      // Upload new icon
      return this.uploadMedia(
        file,
        {
          context_type: 'season_icon',
          season_id: seasonId,
          league_id: leagueId,
          is_public: true
        },
        userId
      );

    } catch (error) {
      return {
        data: null,
        error: this.handleError(error, 'uploadSeasonIcon'),
        success: false
      };
    }
  }

  /**
   * Delete league icon
   */
  async deleteLeagueIcon(leagueId: string, userId: string): Promise<ServiceResponse<boolean>> {
    try {
      const iconResponse = await this.getLeagueIcon(leagueId);

      if (!iconResponse.success || !iconResponse.data) {
        return {
          data: false,
          error: {
            code: 'NOT_FOUND',
            message: 'No league icon found',
            timestamp: new Date().toISOString()
          },
          success: false
        };
      }

      return this.deleteMedia(iconResponse.data.id, userId);

    } catch (error) {
      return {
        data: null,
        error: this.handleError(error, 'deleteLeagueIcon'),
        success: false
      };
    }
  }

  /**
   * Delete season icon
   */
  async deleteSeasonIcon(seasonId: string, userId: string): Promise<ServiceResponse<boolean>> {
    try {
      const { data: seasonMedia } = await this.supabase
        .from('media')
        .select('*')
        .eq('season_id', seasonId)
        .eq('context_type', 'season_icon')
        .maybeSingle();

      if (!seasonMedia) {
        return {
          data: false,
          error: {
            code: 'NOT_FOUND',
            message: 'No season icon found',
            timestamp: new Date().toISOString()
          },
          success: false
        };
      }

      return this.deleteMedia(seasonMedia.id, userId);

    } catch (error) {
      return {
        data: null,
        error: this.handleError(error, 'deleteSeasonIcon'),
        success: false
      };
    }
  }
}

// @ts-nocheck
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
      case 'match_media':
        return {
          bucket: 'match-media',
          path: `${userId}/${timestamp}-${sanitizedFilename}`
        };
      case 'player_media':
        return {
          bucket: 'player-media',
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
      const mediaRecord: any = {
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
        // TODO: Add these fields once the database schema is updated
        // match_id: options.match_id || null,
        // player_id: options.player_id || null,
        is_public: options.is_public ?? true,
        tags: options.tags || [],
        description: options.description || null,
        metadata: {}
      };

      // Add match_id and player_id to metadata for now
      if (options.match_id) {
        mediaRecord.metadata.match_id = options.match_id;
      }
      if (options.player_id) {
        mediaRecord.metadata.player_id = options.player_id;
      }

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
      if (filters.match_id) {
        query = query.eq('match_id', filters.match_id);
      }
      if (filters.player_id) {
        query = query.eq('player_id', filters.player_id);
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

      console.log('📸 MediaService.getMedia - Query executed:', {
        filters,
        resultCount: mediaList?.length || 0,
        error,
        sampleResult: mediaList?.[0] || null
      });

      if (error) throw error;

      // Add public URLs to each media item
      const mediaWithUrls: MediaWithUrl[] = (mediaList || []).map(media => {
        const bucket = this.getBucketFromContext(media.context_type as MediaContextType);
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

      const bucket = this.getBucketFromContext(media.context_type as MediaContextType);
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
      const bucket = this.getBucketFromContext(media.context_type as MediaContextType);
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
      case 'match_media': return 'match-media';
      case 'player_media': return 'player-media';
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

      const bucket = this.getBucketFromContext(media.context_type as MediaContextType);
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
        const bucket = this.getBucketFromContext(seasonMedia.context_type as MediaContextType);
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

  /**
   * Get all media for a specific match
   */
  async getMatchMedia(matchId: string, filters?: Partial<MediaFilters>): Promise<ServiceResponse<MediaWithUrl[]>> {
    // For now, filter by context_type and use metadata
    // TODO: Update once match_id field is added to database
    return this.getMedia({
      // match_id: matchId,
      context_type: 'match_media',
      ...filters
    });
  }

  /**
   * Upload media for a match (admin only - enforced by RLS)
   */
  async uploadMatchMedia(
    file: File,
    matchId: string,
    userId: string,
    options?: { description?: string; tags?: string[]; is_public?: boolean }
  ): Promise<ServiceResponse<MediaUploadResult>> {
    return this.uploadMedia(file, {
      context_type: 'match_media',
      match_id: matchId,
      is_public: options?.is_public ?? true,
      description: options?.description,
      tags: options?.tags || []
    }, userId);
  }

  /**
   * Get all media for a specific player (personal uploads + reposts)
   */
  async getPlayerMedia(playerId: string, filters?: Partial<MediaFilters>): Promise<ServiceResponse<MediaWithUrl[]>> {
    // For now, filter by context_type and use metadata
    // TODO: Update once player_id field is added to database
    return this.getMedia({
      // player_id: playerId,
      context_type: 'player_media',
      ...filters
    });
  }

  /**
   * Upload personal media for a player
   */
  async uploadPlayerMedia(
    file: File,
    playerId: string,
    userId: string,
    options?: { description?: string; tags?: string[]; is_public?: boolean }
  ): Promise<ServiceResponse<MediaUploadResult>> {
    // Verify user is uploading to their own profile
    if (playerId !== userId) {
      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Can only upload to your own profile',
          timestamp: new Date().toISOString()
        },
        data: null
      };
    }

    return this.uploadMedia(file, {
      context_type: 'player_media',
      player_id: playerId,
      is_public: options?.is_public ?? true,
      description: options?.description,
      tags: options?.tags || []
    }, userId);
  }

  /**
   * Repost existing media to player's gallery
   * This creates a reference to the original media without duplicating the file
   */
  async repostMedia(
    originalMediaId: string,
    playerId: string,
    userId: string
  ): Promise<ServiceResponse<MediaWithUrl>> {
    // Verify user is reposting to their own profile
    if (playerId !== userId) {
      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Can only repost to your own profile',
          timestamp: new Date().toISOString()
        },
        data: null
      };
    }

    try {
      // Get original media
      const { data: originalMedia, error: fetchError } = await this.supabase
        .from('media')
        .select('*')
        .eq('id', originalMediaId)
        .single();

      if (fetchError || !originalMedia) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Original media not found',
            timestamp: new Date().toISOString()
          },
          data: null
        };
      }

      // Create repost entry
      const repostRecord: any = {
        filename: originalMedia.filename,
        original_filename: originalMedia.original_filename,
        file_size: originalMedia.file_size,
        mime_type: originalMedia.mime_type,
        storage_path: originalMedia.storage_path,
        media_type: originalMedia.media_type,
        context_type: 'player_media',
        uploaded_by: userId,
        player_id: playerId,
        original_media_id: originalMediaId,
        is_repost: true,
        is_public: true,
        tags: originalMedia.tags || [],
        description: originalMedia.description
      };

      const { data: repost, error: insertError } = await this.supabase
        .from('media')
        .insert(repostRecord)
        .select()
        .single();

      if (insertError || !repost) {
        return {
          success: false,
          error: {
            code: 'INSERT_ERROR',
            message: insertError?.message || 'Failed to create repost',
            timestamp: new Date().toISOString()
          },
          data: null
        };
      }

      // Get public URL from the original media's bucket
      const originalBucket = this.getBucketFromContext(originalMedia.context_type as MediaContextType);

      console.log('[MediaService] Repost - Getting URL:', {
        originalMediaId,
        originalContextType: originalMedia.context_type,
        originalBucket,
        storagePath: originalMedia.storage_path
      });

      // Note: getPublicUrl doesn't return an error, it always generates a URL
      const { data: urlData } = this.supabase.storage
        .from(originalBucket)
        .getPublicUrl(originalMedia.storage_path);

      console.log('[MediaService] Repost - URL generated:', urlData.publicUrl);

      return {
        success: true,
        data: {
          ...repost,
          url: urlData.publicUrl,
          created_at: repost.created_at || new Date().toISOString(),
          updated_at: repost.updated_at || new Date().toISOString()
        },
        error: null
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error, 'repostMedia'),
        data: null
      };
    }
  }
}

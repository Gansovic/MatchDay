/**
 * Media Service for MatchDay
 *
 * Handles all media upload, retrieval, and management operations
 * Integrates with Supabase Storage for file storage
 */
export class MediaService {
    constructor(supabaseClient) {
        // File size limits in bytes
        this.MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
        this.MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
        // Allowed file types
        this.ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        this.ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];
        this.supabase = supabaseClient;
    }
    static getInstance(supabaseClient) {
        if (!MediaService.instance) {
            if (!supabaseClient) {
                throw new Error('SupabaseClient required for first initialization');
            }
            MediaService.instance = new MediaService(supabaseClient);
        }
        else if (supabaseClient) {
            MediaService.instance.supabase = supabaseClient;
        }
        return MediaService.instance;
    }
    handleError(error, operation) {
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
    validateFile(file, mediaType) {
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
    generateStoragePath(contextType, userId, filename) {
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
            default:
                throw new Error(`Unknown context type: ${contextType}`);
        }
    }
    /**
     * Upload media file
     */
    async uploadMedia(file, options, userId) {
        try {
            const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
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
            const { bucket, path } = this.generateStoragePath(options.context_type, userId, file.name);
            // Upload to Supabase Storage
            const { data: storageData, error: storageError } = await this.supabase.storage
                .from(bucket)
                .upload(path, file, {
                cacheControl: '3600',
                upsert: false
            });
            if (storageError)
                throw storageError;
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
            const mediaWithUrl = {
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
        }
        catch (error) {
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
    async getMedia(filters) {
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
            if (error)
                throw error;
            // Add public URLs to each media item
            const mediaWithUrls = (mediaList || []).map(media => {
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
        }
        catch (error) {
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
    async getMediaById(mediaId) {
        try {
            const { data: media, error } = await this.supabase
                .from('media')
                .select('*')
                .eq('id', mediaId)
                .single();
            if (error)
                throw error;
            const bucket = this.getBucketFromContext(media.context_type);
            const { data: urlData } = this.supabase.storage
                .from(bucket)
                .getPublicUrl(media.storage_path);
            const mediaWithUrl = {
                ...media,
                url: urlData.publicUrl
            };
            return {
                data: mediaWithUrl,
                error: null,
                success: true
            };
        }
        catch (error) {
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
    async deleteMedia(mediaId, userId) {
        try {
            // Get media details
            const { data: media, error: fetchError } = await this.supabase
                .from('media')
                .select('*')
                .eq('id', mediaId)
                .single();
            if (fetchError)
                throw fetchError;
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
            if (dbError)
                throw dbError;
            return {
                data: true,
                error: null,
                success: true
            };
        }
        catch (error) {
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
    async updateMediaMetadata(mediaId, userId, updates) {
        try {
            const { data: media, error } = await this.supabase
                .from('media')
                .update(updates)
                .eq('id', mediaId)
                .eq('uploaded_by', userId)
                .select()
                .single();
            if (error)
                throw error;
            return {
                data: media,
                error: null,
                success: true
            };
        }
        catch (error) {
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
    getBucketFromContext(contextType) {
        switch (contextType) {
            case 'team_logo': return 'team-logos';
            case 'user_profile': return 'user-avatars';
            case 'league_sponsor': return 'league-sponsors';
            case 'team_media': return 'team-media';
            case 'season_media': return 'season-media';
            default: throw new Error(`Unknown context type: ${contextType}`);
        }
    }
}
//# sourceMappingURL=media.service.js.map
import { SupabaseClient } from '@supabase/supabase-js';
import { MediaUploadInput, MediaUploadOptions, MediaFilters, MediaWithUrl } from '../types/media.types';

export class MobileMediaService {
  private supabase: SupabaseClient;

  private readonly MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

  private readonly BUCKET_MAP: Record<string, string> = {
    'team_logo': 'team-logos',
    'team_media': 'team-media',
    'season_media': 'season-media',
    'user_profile': 'user-avatars',
    'league_sponsor': 'league-sponsors',
    'player_media': 'player-media',
    'match_media': 'match-media',
  };

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  async uploadMedia(
    files: MediaUploadInput[],
    options: MediaUploadOptions
  ): Promise<MediaWithUrl[]> {
    const userId = (await this.supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error('Not authenticated');

    const uploadedMedia: MediaWithUrl[] = [];

    for (const file of files) {
      const result = await this.uploadSingleFile(file, options, userId);
      uploadedMedia.push(result);
    }

    return uploadedMedia;
  }

  private async uploadSingleFile(
    file: MediaUploadInput,
    options: MediaUploadOptions,
    userId: string
  ): Promise<MediaWithUrl> {
    const bucket = this.BUCKET_MAP[options.context_type];
    if (!bucket) throw new Error(`Unknown context type: ${options.context_type}`);

    const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
    const maxSize = mediaType === 'image' ? this.MAX_IMAGE_SIZE : this.MAX_VIDEO_SIZE;

    if (file.fileSize && file.fileSize > maxSize) {
      throw new Error(`File exceeds ${maxSize / (1024 * 1024)}MB limit`);
    }

    const fileExt = file.filename.split('.').pop() || 'jpg';
    const storagePath = `${userId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

    // Upload to storage
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      name: file.filename,
      type: file.type,
    } as any);

    const { data: uploadData, error: uploadError } = await this.supabase.storage
      .from(bucket)
      .upload(storagePath, formData, {
        contentType: 'multipart/form-data',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Create database record
    const { data: mediaRecord, error: dbError } = await this.supabase
      .from('media')
      .insert({
        filename: storagePath,
        original_filename: file.filename,
        file_size: file.fileSize || 0,
        mime_type: file.type,
        storage_path: uploadData.path,
        media_type: mediaType,
        context_type: options.context_type,
        uploaded_by: userId,
        team_id: options.team_id || null,
        league_id: options.league_id || null,
        season_id: options.season_id || null,
        is_public: options.is_public ?? true,
        tags: options.tags || [],
        description: options.description || null,
      })
      .select()
      .single();

    if (dbError) {
      // Cleanup on failure
      await this.supabase.storage.from(bucket).remove([uploadData.path]);
      throw dbError;
    }

    // Get public URL
    const { data: urlData } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(uploadData.path);

    return {
      ...mediaRecord,
      url: `${urlData.publicUrl}?t=${Date.now()}`,
    };
  }

  async getMedia(filters: MediaFilters): Promise<MediaWithUrl[]> {
    let query = this.supabase
      .from('media')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.team_id) query = query.eq('team_id', filters.team_id);
    if (filters.league_id) query = query.eq('league_id', filters.league_id);
    if (filters.season_id) query = query.eq('season_id', filters.season_id);
    if (filters.context_type) query = query.eq('context_type', filters.context_type);
    if (filters.media_type) query = query.eq('media_type', filters.media_type);
    if (filters.is_public !== undefined) query = query.eq('is_public', filters.is_public);

    const { data: mediaList, error } = await query.limit(filters.limit || 50);

    if (error) throw error;

    // Add URLs
    return (mediaList || []).map(media => {
      const bucket = this.BUCKET_MAP[media.context_type] || 'team-media';
      const { data: urlData } = this.supabase.storage
        .from(bucket)
        .getPublicUrl(media.storage_path);

      return {
        ...media,
        url: urlData.publicUrl,
      };
    });
  }

  async deleteMedia(mediaId: string): Promise<void> {
    const userId = (await this.supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error('Not authenticated');

    const { data: media, error: fetchError } = await this.supabase
      .from('media')
      .select('*')
      .eq('id', mediaId)
      .single();

    if (fetchError) throw fetchError;

    if (media.uploaded_by !== userId) {
      throw new Error('Not authorized to delete this media');
    }

    const bucket = this.BUCKET_MAP[media.context_type];

    // Delete from storage
    await this.supabase.storage.from(bucket).remove([media.storage_path]);

    // Delete from database
    const { error: dbError } = await this.supabase
      .from('media')
      .delete()
      .eq('id', mediaId);

    if (dbError) throw dbError;
  }
}

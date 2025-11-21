import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { MediaUploadOptions, MediaUploadInput, MediaRecord } from '../types/media.types';

export const useMediaUpload = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const pickAndUploadMedia = async (
    options: MediaUploadOptions
  ): Promise<MediaRecord | null> => {
    setIsLoading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permission to access media library is required');
      }

      // Determine media types based on context
      const allowsVideo = ['match_media', 'player_media', 'team_media'].includes(
        options.context_type
      );
      const mediaTypes: ImagePicker.MediaTypeOptions = allowsVideo
        ? ImagePicker.MediaTypeOptions.All
        : ImagePicker.MediaTypeOptions.Images;

      // Pick media
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes,
        allowsEditing: !allowsVideo,
        aspect: options.context_type === 'team_logo' || options.context_type === 'profile_avatar' ? [1, 1] : undefined,
        quality: 0.8,
        videoMaxDuration: 60, // Max 60 seconds for videos
      });

      if (result.canceled) {
        setIsLoading(false);
        return null;
      }

      const asset = result.assets[0];
      if (!asset) {
        throw new Error('No media selected');
      }

      // Check file size (max 50MB for video, 10MB for images)
      const maxSize = asset.type === 'video' ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
      if (asset.fileSize && asset.fileSize > maxSize) {
        throw new Error(
          `File must be smaller than ${asset.type === 'video' ? '50MB' : '10MB'}`
        );
      }

      return await uploadMedia({
        uri: asset.uri,
        filename: asset.fileName || `${Date.now()}`,
        type: asset.mimeType || 'image/jpeg',
        fileSize: asset.fileSize,
      }, options);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to upload media';
      setError(errorMessage);
      console.error('Media upload error:', err);
      return null;
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  const uploadMedia = async (
    input: MediaUploadInput,
    options: MediaUploadOptions
  ): Promise<MediaRecord | null> => {
    try {
      const { uri, filename, type, fileSize } = input;

      // Determine bucket based on context_type
      let bucket = 'media'; // default

      switch (options.context_type) {
        case 'team_logo':
          bucket = 'team-logos';
          break;
        case 'profile_avatar':
        case 'user_profile':
          bucket = 'user-avatars';
          break;
        case 'match_media':
          bucket = 'match-media';
          break;
        case 'player_media':
          bucket = 'player-media';
          break;
        case 'season_media':
          bucket = 'season-media';
          break;
        case 'team_media':
          bucket = 'team-media';
          break;
        case 'league_sponsor':
          bucket = 'league-sponsors';
          break;
        case 'season_icon':
          bucket = 'season-icons';
          break;
        case 'league_icon':
          bucket = 'league-icons';
          break;
        default:
          bucket = 'media';
          break;
      }

      const fileExt = filename.split('.').pop()?.toLowerCase() || 'jpg';
      const isVideo = type.startsWith('video/');
      const mediaType = isVideo ? 'video' : 'image';

      const contextId = options.team_id || options.player_id || options.match_id || options.league_id || options.season_id;
      const filePath = contextId
        ? `${contextId}/${Date.now()}.${fileExt}`
        : `${Date.now()}.${fileExt}`;

      // Prepare file for upload
      const formData = new FormData();
      formData.append('file', {
        uri,
        name: filename,
        type,
      } as any);

      setUploadProgress(30);

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, formData, {
          contentType: 'multipart/form-data',
          upsert: false,
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error('Failed to upload file');
      }

      setUploadProgress(60);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Create media record
      const mediaRecord = {
        team_id: options.team_id || null,
        player_id: options.player_id || null,
        match_id: options.match_id || null,
        league_id: options.league_id || null,
        season_id: options.season_id || null,
        context_type: options.context_type,
        storage_path: uploadData.path,
        is_public: options.is_public ?? true,
        filename: filePath,
        original_filename: filename,
        file_size: fileSize || 0,
        mime_type: type,
        media_type: mediaType,
        uploaded_by: user.id,
        tags: options.tags || [],
        description: options.description || null,
        is_repost: false,
        original_media_id: null,
      };

      const { data: mediaData, error: mediaError } = await supabase
        .from('media')
        .insert(mediaRecord)
        .select()
        .single();

      if (mediaError) {
        console.error('Media record error:', mediaError);
        // Clean up uploaded file
        await supabase.storage.from(bucket).remove([uploadData.path]);
        throw new Error('Failed to save media record');
      }

      setUploadProgress(100);

      return mediaData as MediaRecord;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to upload media';
      setError(errorMessage);
      throw err;
    }
  };

  return {
    pickAndUploadMedia,
    uploadMedia,
    isLoading,
    error,
    uploadProgress,
    clearError: () => setError(null),
  };
};

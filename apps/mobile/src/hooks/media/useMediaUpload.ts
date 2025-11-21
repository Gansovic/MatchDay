import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { MediaWithUrl, MediaUploadOptions } from '../../types/media.types';
import { MobileMediaService } from '../../services/media.service';
import { supabase } from '../../../lib/supabase';

export const useMediaUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const service = new MobileMediaService(supabase);

  const pickAndUploadMedia = async (
    options: MediaUploadOptions
  ): Promise<MediaWithUrl[]> => {
    setIsUploading(true);
    setError(null);
    setProgress(0);

    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Media library permission required');
      }

      // Pick multiple images/videos
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 10,
      });

      if (result.canceled || !result.assets.length) {
        setIsUploading(false);
        return [];
      }

      // Validate and prepare files
      const files = result.assets.map(asset => ({
        uri: asset.uri,
        filename: asset.fileName || `media_${Date.now()}.${asset.uri.split('.').pop()}`,
        type: asset.type === 'video' ? `video/${asset.uri.split('.').pop()}` : `image/${asset.uri.split('.').pop()}`,
        fileSize: asset.fileSize,
      }));

      // Upload with progress
      const uploadedMedia = await service.uploadMedia(files, options);

      setProgress(100);
      return uploadedMedia;
    } catch (err: any) {
      setError(err.message || 'Upload failed');
      return [];
    } finally {
      setIsUploading(false);
    }
  };

  return {
    pickAndUploadMedia,
    isUploading,
    progress,
    error,
    clearError: () => setError(null),
  };
};

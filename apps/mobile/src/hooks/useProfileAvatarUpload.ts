import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';

export interface ProfileAvatarUploadResult {
  url: string;
  storagePath: string;
}

export const useProfileAvatarUpload = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickAndUploadAvatar = async (userId: string): Promise<ProfileAvatarUploadResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permission to access media library is required');
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) {
        setIsLoading(false);
        return null;
      }

      const asset = result.assets[0];
      if (!asset) {
        throw new Error('No image selected');
      }

      // Check file size (max 5MB for avatars)
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        throw new Error('Image must be smaller than 5MB');
      }

      // Generate unique filename
      const fileExt = asset.uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      // Prepare file for upload using FormData (React Native compatible)
      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        name: `${Date.now()}.${fileExt}`,
        type: `image/${fileExt}`,
      } as any);

      // Upload to user-avatars storage bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user-avatars')
        .upload(fileName, formData, {
          contentType: 'multipart/form-data',
          upsert: true, // Allow replacing existing avatars
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error('Failed to upload avatar');
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('user-avatars')
        .getPublicUrl(uploadData.path);

      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      return {
        url: publicUrl,
        storagePath: uploadData.path,
      };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to upload avatar';
      setError(errorMessage);
      console.error('Avatar upload error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { pickAndUploadAvatar, isLoading, error, clearError: () => setError(null) };
};

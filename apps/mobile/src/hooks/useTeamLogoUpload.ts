import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';

export interface TeamLogoUploadResult {
  url: string;
  mediaId: string;
  storagePath: string;
}

export const useTeamLogoUpload = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickAndUploadLogo = async (teamId: string): Promise<TeamLogoUploadResult | null> => {
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

      // Check file size (max 10MB)
      if (asset.fileSize && asset.fileSize > 10 * 1024 * 1024) {
        throw new Error('Image must be smaller than 10MB');
      }

      // Generate unique filename
      const fileExt = asset.uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${teamId}/${Date.now()}.${fileExt}`;

      // Prepare file for upload using FormData (React Native compatible)
      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        name: `${Date.now()}.${fileExt}`,
        type: `image/${fileExt}`,
      } as any);

      // Upload to storage using uploadToSignedUrl workaround or direct upload
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('team-logos')
        .upload(fileName, formData, {
          contentType: 'multipart/form-data',
          upsert: false,
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error('Failed to upload image');
      }

      // Create media record
      const originalFilename = `${Date.now()}.${fileExt}`;
      const mimeType = `image/${fileExt}`;
      const fileSize = asset.fileSize || 0;

      const { data: mediaData, error: mediaError } = await supabase
        .from('media')
        .insert({
          team_id: teamId,
          context_type: 'team_logo',
          storage_path: uploadData.path,
          is_public: true,
          filename: fileName,
          original_filename: originalFilename,
          file_size: fileSize,
          mime_type: mimeType,
          media_type: 'image',
        })
        .select()
        .single();

      if (mediaError) {
        console.error('Media record error:', mediaError);
        // Clean up uploaded file
        await supabase.storage.from('team-logos').remove([uploadData.path]);
        throw new Error('Failed to save image record');
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('team-logos')
        .getPublicUrl(uploadData.path);

      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      return {
        url: publicUrl,
        mediaId: mediaData.id,
        storagePath: uploadData.path,
      };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to upload logo';
      setError(errorMessage);
      console.error('Logo upload error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { pickAndUploadLogo, isLoading, error, clearError: () => setError(null) };
};

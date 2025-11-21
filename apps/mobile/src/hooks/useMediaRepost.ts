import { useState } from 'react';
import { supabase } from '../../lib/supabase';

/**
 * Helper to get bucket name from context type
 */
const getBucketFromContext = (contextType: string): string => {
  switch (contextType) {
    case 'team_logo':
      return 'team-logos';
    case 'user_profile':
    case 'profile_avatar':
      return 'user-avatars';
    case 'league_sponsor':
      return 'league-sponsors';
    case 'team_media':
      return 'team-media';
    case 'season_media':
      return 'season-media';
    case 'league_icon':
      return 'league-icons';
    case 'season_icon':
      return 'season-icons';
    case 'match_media':
      return 'match-media';
    case 'player_media':
      return 'player-media';
    default:
      return 'media';
  }
};

export const useMediaRepost = () => {
  const [isReposting, setIsReposting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const repostMedia = async (mediaId: string) => {
    setIsReposting(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // 1. Get original media
      const { data: originalMedia, error: fetchError } = await supabase
        .from('media')
        .select('*')
        .eq('id', mediaId)
        .single();

      if (fetchError || !originalMedia) {
        throw new Error('Original media not found');
      }

      // 2. Create repost record
      const repostRecord = {
        filename: originalMedia.filename,
        original_filename: originalMedia.original_filename,
        file_size: originalMedia.file_size,
        mime_type: originalMedia.mime_type,
        storage_path: originalMedia.storage_path, // Points to original file
        media_type: originalMedia.media_type,
        context_type: 'player_media', // New record is player_media
        uploaded_by: user.id,
        player_id: user.id,
        original_media_id: mediaId,
        is_repost: true,
        is_public: true,
        tags: originalMedia.tags || [],
        description: originalMedia.description,
      };

      const { data: repost, error: insertError } = await supabase
        .from('media')
        .insert(repostRecord)
        .select()
        .single();

      if (insertError || !repost) {
        throw new Error(insertError?.message || 'Failed to create repost');
      }

      // 3. Generate public URL from original bucket
      const originalBucket = getBucketFromContext(originalMedia.context_type);
      const { data: urlData } = supabase.storage
        .from(originalBucket)
        .getPublicUrl(originalMedia.storage_path);

      return {
        success: true,
        data: {
          ...repost,
          url: urlData.publicUrl,
        },
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to repost media';
      setError(errorMessage);
      console.error('Repost error:', err);
      return { success: false, error: errorMessage };
    } finally {
      setIsReposting(false);
    }
  };

  const checkIfReposted = async (mediaId: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Check if user has already reposted this media
      const { data, error } = await supabase
        .from('media')
        .select('id')
        .eq('original_media_id', mediaId)
        .eq('uploaded_by', user.id)
        .eq('is_repost', true)
        .maybeSingle();

      if (error) {
        console.error('Check repost error:', error);
        return false;
      }

      return !!data;
    } catch (err) {
      console.error('Check repost error:', err);
      return false;
    }
  };

  return {
    repostMedia,
    checkIfReposted,
    isReposting,
    error,
    clearError: () => setError(null),
  };
};

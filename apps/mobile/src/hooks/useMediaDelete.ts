import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export const useMediaDelete = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteMedia = async (mediaId: string): Promise<boolean> => {
    setIsDeleting(true);
    setError(null);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Get media record to check ownership and get storage path
      const { data: media, error: fetchError } = await supabase
        .from('media')
        .select('*')
        .eq('id', mediaId)
        .single();

      if (fetchError || !media) {
        throw new Error('Media not found');
      }

      // Check if user is the uploader
      if (media.uploaded_by !== user.id) {
        throw new Error('Unauthorized to delete this media');
      }

      // Determine bucket based on context_type
      let bucket = 'media'; // default
      switch (media.context_type) {
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

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(bucket)
        .remove([media.storage_path]);

      if (storageError) {
        console.error('Storage deletion error:', storageError);
        // Continue anyway, as the record should still be deleted
      }

      // Delete media record
      const { error: deleteError } = await supabase
        .from('media')
        .delete()
        .eq('id', mediaId);

      if (deleteError) {
        throw deleteError;
      }

      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete media';
      setError(errorMessage);
      console.error('Media deletion error:', err);
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    deleteMedia,
    isDeleting,
    error,
    clearError: () => setError(null),
  };
};

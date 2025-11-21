import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { MediaWithUrl, MediaFilters } from '../types/media.types';

export const useMediaGallery = (filters: MediaFilters = {}) => {
  const [media, setMedia] = useState<MediaWithUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMedia = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('media')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.team_id) {
        query = query.eq('team_id', filters.team_id);
      }
      if (filters.player_id) {
        query = query.eq('player_id', filters.player_id);
      }
      if (filters.match_id) {
        query = query.eq('match_id', filters.match_id);
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
      if (filters.exclude_reposts) {
        query = query.eq('is_repost', false);
      }
      if (filters.uploaded_by) {
        query = query.eq('uploaded_by', filters.uploaded_by);
      }
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      // Get signed URLs for each media item
      const mediaWithUrls = await Promise.all(
        (data || []).map(async (item) => {
          let bucket = 'media'; // default
          let contextTypeForBucket = item.context_type;

          // For reposts, get the original media's context_type to determine the bucket
          if (item.is_repost && item.original_media_id) {
            const { data: originalMedia } = await supabase
              .from('media')
              .select('context_type')
              .eq('id', item.original_media_id)
              .single();

            if (originalMedia) {
              contextTypeForBucket = originalMedia.context_type;
            }
          }

          // Map context_type to correct bucket
          switch (contextTypeForBucket) {
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

          const { data: urlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(item.storage_path);

          return {
            ...item,
            url: `${urlData.publicUrl}?t=${Date.now()}`,
          } as MediaWithUrl;
        })
      );

      setMedia(mediaWithUrls);
    } catch (err: any) {
      console.error('Media fetch error:', err);
      setError(err.message || 'Failed to load media');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  return {
    media,
    loading,
    error,
    refetch: fetchMedia,
  };
};

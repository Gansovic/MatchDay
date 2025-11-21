import { useState, useEffect, useCallback, useRef } from 'react';
import { MediaWithUrl, MediaFilters } from '../../types/media.types';
import { MobileMediaService } from '../../services/media.service';
import { supabase } from '../../../lib/supabase';

export const useMediaGallery = (filters: MediaFilters) => {
  const [media, setMedia] = useState<MediaWithUrl[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all');
  const hasFetched = useRef(false);
  const serviceRef = useRef(new MobileMediaService(supabase));

  const fetchMedia = useCallback(async (showLoading = true) => {
    try {
      if (showLoading && media.length === 0) {
        setIsLoading(true);
      }
      setError(null);
      const data = await serviceRef.current.getMedia(filters);
      setMedia(data);
      hasFetched.current = true;
    } catch (err: any) {
      setError(err.message || 'Failed to load media');
    } finally {
      setIsLoading(false);
    }
  }, [filters.team_id, filters.context_type, filters.league_id, filters.season_id]);

  useEffect(() => {
    if (!hasFetched.current) {
      fetchMedia(true);
    }
  }, [fetchMedia]);

  const filteredMedia = media.filter(m => {
    if (filter === 'all') return true;
    return m.media_type === filter;
  });

  const addMedia = (newMedia: MediaWithUrl[]) => {
    setMedia(prev => [...newMedia, ...prev]);
  };

  const removeMedia = (mediaId: string) => {
    setMedia(prev => prev.filter(m => m.id !== mediaId));
  };

  const refetch = useCallback(() => fetchMedia(false), [fetchMedia]);

  return {
    media: filteredMedia,
    allMedia: media,
    isLoading,
    error,
    filter,
    setFilter,
    refetch,
    addMedia,
    removeMedia,
    counts: {
      all: media.length,
      image: media.filter(m => m.media_type === 'image').length,
      video: media.filter(m => m.media_type === 'video').length,
    },
  };
};

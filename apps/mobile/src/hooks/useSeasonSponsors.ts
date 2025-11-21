import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

export interface SeasonSponsor {
  id: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  display_order: number;
}

interface UseSeasonSponsorsReturn {
  sponsors: SeasonSponsor[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSeasonSponsors(seasonId: string | undefined): UseSeasonSponsorsReturn {
  const [sponsors, setSponsors] = useState<SeasonSponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSponsors = useCallback(async () => {
    if (!seasonId) {
      setSponsors([]);
      setLoading(false);
      setError('No season ID provided');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch sponsors for the season
      const { data: sponsorsData, error: sponsorsError } = await supabase
        .from('season_sponsors')
        .select('*')
        .eq('season_id', seasonId)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (sponsorsError) throw sponsorsError;

      // Fetch logo URLs for sponsors with logo_media_id
      const sponsorsWithLogos = await Promise.all(
        (sponsorsData || []).map(async (sponsor) => {
          let logo_url = null;

          if (sponsor.logo_media_id) {
            const { data: mediaData } = await supabase
              .from('media')
              .select('storage_path, context_type')
              .eq('id', sponsor.logo_media_id)
              .single();

            if (mediaData?.storage_path) {
              const { data: urlData } = supabase.storage
                .from('league-sponsors')
                .getPublicUrl(mediaData.storage_path);

              if (urlData?.publicUrl) {
                logo_url = `${urlData.publicUrl}?t=${Date.now()}`;
              }
            }
          }

          return {
            id: sponsor.id,
            name: sponsor.name,
            logo_url,
            website_url: sponsor.website_url,
            display_order: sponsor.display_order,
          };
        })
      );

      setSponsors(sponsorsWithLogos);
    } catch (err: any) {
      console.error('Failed to fetch sponsors:', err);
      setError(err.message || 'Failed to load sponsors');
    } finally {
      setLoading(false);
    }
  }, [seasonId]);

  useEffect(() => {
    fetchSponsors();
  }, [fetchSponsors]);

  return {
    sponsors,
    loading,
    error,
    refetch: fetchSponsors
  };
}

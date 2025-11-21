import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

interface LeagueInfo {
  id: string;
  name: string;
  description: string | null;
  sport_type: string;
  league_type: string;
  location: string | null;
  is_active: boolean;
  iconUrl: string | null;
}

interface Season {
  id: string;
  name: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  teamCount: number;
}

interface LeagueStats {
  totalMatches: number;
  completed: number;
  upcoming: number;
  totalGoals: number;
}

interface LeagueDetailsData {
  league: LeagueInfo | null;
  seasons: Season[];
  stats: LeagueStats;
  loading: boolean;
  error: string | null;
}

interface UseLeagueDetailsReturn extends LeagueDetailsData {
  refetch: () => Promise<void>;
}

export function useLeagueDetails(leagueId: string | undefined): UseLeagueDetailsReturn {
  const [data, setData] = useState<LeagueDetailsData>({
    league: null,
    seasons: [],
    stats: { totalMatches: 0, completed: 0, upcoming: 0, totalGoals: 0 },
    loading: true,
    error: null,
  });

  const loadData = useCallback(async () => {
    if (!leagueId) {
      setData({
        league: null,
        seasons: [],
        stats: { totalMatches: 0, completed: 0, upcoming: 0, totalGoals: 0 },
        loading: false,
        error: 'No league ID provided',
      });
      return;
    }

    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      // Fetch league basic info
      const { data: leagueData, error: leagueError } = await supabase
        .from('leagues')
        .select('id, name, description, sport_type, league_type, location, is_active')
        .eq('id', leagueId)
        .single();

      if (leagueError) throw leagueError;
      if (!leagueData) throw new Error('League not found');

      // Fetch league icon - query by league_id (NOT logo_media_id)
      const { data: mediaData, error: mediaError } = await supabase
        .from('media')
        .select('storage_path, context_type')
        .eq('league_id', leagueId)
        .eq('context_type', 'league_icon')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Generate public URL for icon with cache-busting
      let iconUrl: string | null = null;
      if (mediaData?.storage_path) {
        const { data: urlData } = supabase.storage
          .from('league-icons')
          .getPublicUrl(mediaData.storage_path);

        if (urlData?.publicUrl) {
          iconUrl = `${urlData.publicUrl}?t=${Date.now()}`;
        }
      }

      // Fetch seasons with team counts
      const { data: seasonsData, error: seasonsError } = await supabase
        .from('seasons')
        .select('*, season_teams(count)')
        .eq('league_id', leagueId)
        .order('created_at', { ascending: false });

      if (seasonsError) throw seasonsError;

      // Fetch matches for stats
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('id, status, home_score, away_score')
        .eq('league_id', leagueId);

      if (matchesError) throw matchesError;

      // Calculate match stats
      const totalMatches = matchesData?.length || 0;
      const completed = matchesData?.filter(m => m.status === 'completed').length || 0;
      const upcoming = matchesData?.filter(m =>
        m.status === 'scheduled' || m.status === 'live'
      ).length || 0;

      const totalGoals = matchesData?.reduce((sum, match) => {
        const homeScore = match.home_score ?? 0;
        const awayScore = match.away_score ?? 0;
        return sum + homeScore + awayScore;
      }, 0) || 0;

      // Format seasons
      const seasons: Season[] = (seasonsData || []).map(season => ({
        id: season.id,
        name: season.name,
        status: season.status,
        start_date: season.start_date,
        end_date: season.end_date,
        teamCount: Array.isArray(season.season_teams)
          ? season.season_teams.length
          : (season.season_teams as any)?.count || 0,
      }));

      setData({
        league: {
          id: leagueData.id,
          name: leagueData.name,
          description: leagueData.description,
          sport_type: leagueData.sport_type,
          league_type: leagueData.league_type,
          location: leagueData.location,
          is_active: leagueData.is_active,
          iconUrl,
        },
        seasons,
        stats: {
          totalMatches,
          completed,
          upcoming,
          totalGoals,
        },
        loading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Error loading league details:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to load league details',
      }));
    }
  }, [leagueId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { ...data, refetch: loadData };
}

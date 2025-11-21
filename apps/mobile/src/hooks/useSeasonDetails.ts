import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

interface SeasonInfo {
  id: string;
  name: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  tournament_format: string | null;
  points_for_win: number;
  points_for_draw: number;
  points_for_loss: number;
  iconUrl: string | null;
  league_id: string;
  description: string | null;
}

interface TeamInSeason {
  id: string;
  team_id: string;
  team_name: string;
  team_color: string | null;
  status: string;
}

interface SeasonDetailsData {
  season: SeasonInfo | null;
  teams: TeamInSeason[];
  matchCount: number;
  loading: boolean;
  error: string | null;
}

interface UseSeasonDetailsReturn extends SeasonDetailsData {
  refetch: () => Promise<void>;
}

export function useSeasonDetails(
  seasonId: string | undefined,
  leagueId?: string
): UseSeasonDetailsReturn {
  const [data, setData] = useState<SeasonDetailsData>({
    season: null,
    teams: [],
    matchCount: 0,
    loading: true,
    error: null,
  });

  const loadData = useCallback(async () => {
    if (!seasonId) {
      setData({
        season: null,
        teams: [],
        matchCount: 0,
        loading: false,
        error: 'No season ID provided',
      });
      return;
    }

    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      // Fetch season info
      const { data: seasonData, error: seasonError } = await supabase
        .from('seasons')
        .select('*')
        .eq('id', seasonId)
        .single();

      if (seasonError) throw seasonError;
      if (!seasonData) throw new Error('Season not found');

      const actualLeagueId = leagueId || seasonData.league_id;

      // Try to fetch season-specific icon first
      const { data: seasonMediaData } = await supabase
        .from('media')
        .select('storage_path, context_type')
        .eq('season_id', seasonId)
        .eq('context_type', 'season_icon')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      let iconUrl: string | null = null;

      // If season icon exists, use it
      if (seasonMediaData?.storage_path) {
        const { data: urlData } = supabase.storage
          .from('season-icons')
          .getPublicUrl(seasonMediaData.storage_path);

        if (urlData?.publicUrl) {
          iconUrl = `${urlData.publicUrl}?t=${Date.now()}`;
        }
      } else if (actualLeagueId) {
        // Fallback to league icon
        const { data: leagueMediaData } = await supabase
          .from('media')
          .select('storage_path, context_type')
          .eq('league_id', actualLeagueId)
          .eq('context_type', 'league_icon')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (leagueMediaData?.storage_path) {
          const { data: urlData } = supabase.storage
            .from('league-icons')
            .getPublicUrl(leagueMediaData.storage_path);

          if (urlData?.publicUrl) {
            iconUrl = `${urlData.publicUrl}?t=${Date.now()}`;
          }
        }
      }

      // Fetch teams in season - include all active statuses (not just 'confirmed')
      const { data: seasonTeamsData, error: teamsError } = await supabase
        .from('season_teams')
        .select(`
          id,
          team_id,
          status,
          teams (
            id,
            name,
            team_color
          )
        `)
        .eq('season_id', seasonId)
        .in('status', ['confirmed', 'registered', 'approved', 'active', 'pending']);

      if (teamsError) {
        console.error('Error fetching season teams:', teamsError);
        // Don't throw, just log and continue with empty teams
      }

      // Fetch match count
      const { count: matchCount, error: matchError } = await supabase
        .from('matches')
        .select('id', { count: 'exact', head: true })
        .eq('season_id', seasonId);

      if (matchError) throw matchError;

      // Format teams
      const teams: TeamInSeason[] = (seasonTeamsData || [])
        .filter(st => st.teams)
        .map(st => {
          const team = Array.isArray(st.teams) ? st.teams[0] : st.teams;
          return {
            id: st.id,
            team_id: st.team_id,
            team_name: team?.name || 'Unknown Team',
            team_color: team?.team_color || null,
            status: st.status,
          };
        });

      setData({
        season: {
          id: seasonData.id,
          name: seasonData.name,
          status: seasonData.status,
          start_date: seasonData.start_date,
          end_date: seasonData.end_date,
          tournament_format: seasonData.tournament_format,
          points_for_win: seasonData.points_for_win ?? 3,
          points_for_draw: seasonData.points_for_draw ?? 1,
          points_for_loss: seasonData.points_for_loss ?? 0,
          iconUrl,
          league_id: seasonData.league_id,
          description: seasonData.description || null,
        },
        teams,
        matchCount: matchCount || 0,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Error loading season details:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to load season details',
      }));
    }
  }, [seasonId, leagueId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { ...data, refetch: loadData };
}

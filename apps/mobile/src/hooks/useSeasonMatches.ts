import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

export interface Match {
  id: string;
  matchDate: string;
  matchTime: string | null;
  status: string;
  homeTeam: {
    id: string;
    name: string;
    color: string | null;
  };
  awayTeam: {
    id: string;
    name: string;
    color: string | null;
  };
  homeScore: number | null;
  awayScore: number | null;
  venue: string | null;
  courtNumber: number | null;
  matchdayNumber: number | null;
}

interface SeasonMatchesData {
  upcomingMatches: Match[];
  completedMatches: Match[];
  loading: boolean;
  error: string | null;
}

interface UseSeasonMatchesReturn extends SeasonMatchesData {
  refetch: () => Promise<void>;
}

export function useSeasonMatches(seasonId: string | undefined): UseSeasonMatchesReturn {
  const [data, setData] = useState<SeasonMatchesData>({
    upcomingMatches: [],
    completedMatches: [],
    loading: true,
    error: null,
  });

  const loadData = useCallback(async () => {
    if (!seasonId) {
      setData({
        upcomingMatches: [],
        completedMatches: [],
        loading: false,
        error: 'No season ID provided',
      });
      return;
    }

    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      // Fetch all matches for the season with team info
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select(`
          id,
          match_date,
          match_time,
          status,
          home_team_id,
          away_team_id,
          home_score,
          away_score,
          venue,
          court_number,
          matchday_number,
          home_team:teams!matches_home_team_id_fkey(id, name, team_color),
          away_team:teams!matches_away_team_id_fkey(id, name, team_color)
        `)
        .eq('season_id', seasonId)
        .order('match_date', { ascending: true });

      if (matchesError) throw matchesError;

      // Format matches
      const formattedMatches: Match[] = (matchesData || [])
        .filter(m => m.home_team && m.away_team)
        .map(m => {
          const homeTeam = Array.isArray(m.home_team) ? m.home_team[0] : m.home_team;
          const awayTeam = Array.isArray(m.away_team) ? m.away_team[0] : m.away_team;

          return {
            id: m.id,
            matchDate: m.match_date,
            matchTime: m.match_time,
            status: m.status,
            homeTeam: {
              id: m.home_team_id,
              name: homeTeam?.name || 'Unknown Team',
              color: homeTeam?.team_color || null,
            },
            awayTeam: {
              id: m.away_team_id,
              name: awayTeam?.name || 'Unknown Team',
              color: awayTeam?.team_color || null,
            },
            homeScore: m.home_score,
            awayScore: m.away_score,
            venue: m.venue,
            courtNumber: m.court_number,
            matchdayNumber: m.matchday_number,
          };
        });

      // Split into upcoming and completed
      const upcomingMatches = formattedMatches.filter(
        m => m.status === 'scheduled' || m.status === 'live'
      );

      const completedMatches = formattedMatches
        .filter(m => m.status === 'completed')
        .reverse(); // Most recent first

      setData({
        upcomingMatches,
        completedMatches,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Error loading season matches:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to load matches',
      }));
    }
  }, [seasonId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { ...data, refetch: loadData };
}

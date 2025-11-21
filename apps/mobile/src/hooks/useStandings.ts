import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

export interface StandingRow {
  position: number;
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  recentForm: ('W' | 'D' | 'L')[];
}

interface Match {
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_score: number;
  away_score: number;
  match_date: string;
  home_team: { id: string; name: string } | null;
  away_team: { id: string; name: string } | null;
}

interface StandingsData {
  standings: StandingRow[];
  loading: boolean;
  error: string | null;
}

interface UseStandingsReturn extends StandingsData {
  refetch: () => Promise<void>;
}

export function useStandings(seasonId: string | undefined): UseStandingsReturn {
  const [data, setData] = useState<StandingsData>({
    standings: [],
    loading: true,
    error: null,
  });

  const loadData = useCallback(async () => {
    if (!seasonId) {
      setData({
        standings: [],
        loading: false,
        error: 'No season ID provided',
      });
      return;
    }

    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      // Fetch season points config
      const { data: seasonData, error: seasonError } = await supabase
        .from('seasons')
        .select('points_for_win, points_for_draw, points_for_loss')
        .eq('id', seasonId)
        .single();

      if (seasonError) throw seasonError;

      const pointsForWin = seasonData?.points_for_win ?? 3;
      const pointsForDraw = seasonData?.points_for_draw ?? 1;
      const pointsForLoss = seasonData?.points_for_loss ?? 0;

      // Fetch all completed matches with team info
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select(`
          id,
          home_team_id,
          away_team_id,
          home_score,
          away_score,
          match_date,
          home_team:teams!matches_home_team_id_fkey(id, name),
          away_team:teams!matches_away_team_id_fkey(id, name)
        `)
        .eq('season_id', seasonId)
        .eq('status', 'completed')
        .not('home_score', 'is', null)
        .not('away_score', 'is', null)
        .order('match_date', { ascending: false });

      if (matchesError) throw matchesError;

      const matches: Match[] = (matchesData || []).map(m => ({
        id: m.id,
        home_team_id: m.home_team_id,
        away_team_id: m.away_team_id,
        home_score: m.home_score!,
        away_score: m.away_score!,
        match_date: m.match_date,
        home_team: Array.isArray(m.home_team) ? m.home_team[0] : m.home_team,
        away_team: Array.isArray(m.away_team) ? m.away_team[0] : m.away_team,
      }));

      // Build team stats map
      const teamStatsMap = new Map<string, {
        teamId: string;
        teamName: string;
        played: number;
        won: number;
        drawn: number;
        lost: number;
        goalsFor: number;
        goalsAgainst: number;
        points: number;
        matches: { date: string; result: 'W' | 'D' | 'L' }[];
      }>();

      // Initialize teams from matches
      matches.forEach(match => {
        if (match.home_team && !teamStatsMap.has(match.home_team_id)) {
          teamStatsMap.set(match.home_team_id, {
            teamId: match.home_team_id,
            teamName: match.home_team.name,
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            points: 0,
            matches: [],
          });
        }
        if (match.away_team && !teamStatsMap.has(match.away_team_id)) {
          teamStatsMap.set(match.away_team_id, {
            teamId: match.away_team_id,
            teamName: match.away_team.name,
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            points: 0,
            matches: [],
          });
        }
      });

      // Calculate stats for each match
      matches.forEach(match => {
        const homeStats = teamStatsMap.get(match.home_team_id);
        const awayStats = teamStatsMap.get(match.away_team_id);

        if (!homeStats || !awayStats) return;

        homeStats.played++;
        awayStats.played++;

        homeStats.goalsFor += match.home_score;
        homeStats.goalsAgainst += match.away_score;
        awayStats.goalsFor += match.away_score;
        awayStats.goalsAgainst += match.home_score;

        if (match.home_score > match.away_score) {
          // Home win
          homeStats.won++;
          homeStats.points += pointsForWin;
          homeStats.matches.push({ date: match.match_date, result: 'W' });

          awayStats.lost++;
          awayStats.points += pointsForLoss;
          awayStats.matches.push({ date: match.match_date, result: 'L' });
        } else if (match.home_score === match.away_score) {
          // Draw
          homeStats.drawn++;
          homeStats.points += pointsForDraw;
          homeStats.matches.push({ date: match.match_date, result: 'D' });

          awayStats.drawn++;
          awayStats.points += pointsForDraw;
          awayStats.matches.push({ date: match.match_date, result: 'D' });
        } else {
          // Away win
          homeStats.lost++;
          homeStats.points += pointsForLoss;
          homeStats.matches.push({ date: match.match_date, result: 'L' });

          awayStats.won++;
          awayStats.points += pointsForWin;
          awayStats.matches.push({ date: match.match_date, result: 'W' });
        }
      });

      // Convert to standings array and sort
      const standings: StandingRow[] = Array.from(teamStatsMap.values())
        .map(stats => {
          // Sort matches chronologically (oldest to newest) and take last 5
          const sortedMatches = [...stats.matches].sort((a, b) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
          );
          const recentForm = sortedMatches
            .slice(-5)
            .map(m => m.result);

          return {
            position: 0, // Will be set after sorting
            teamId: stats.teamId,
            teamName: stats.teamName,
            played: stats.played,
            won: stats.won,
            drawn: stats.drawn,
            lost: stats.lost,
            goalsFor: stats.goalsFor,
            goalsAgainst: stats.goalsAgainst,
            goalDifference: stats.goalsFor - stats.goalsAgainst,
            points: stats.points,
            recentForm,
          };
        })
        .sort((a, b) => {
          // Sort by points DESC, then goal difference DESC, then goals for DESC
          if (b.points !== a.points) return b.points - a.points;
          if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
          return b.goalsFor - a.goalsFor;
        })
        .map((standing, index) => ({
          ...standing,
          position: index + 1,
        }));

      setData({
        standings,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Error loading standings:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to load standings',
      }));
    }
  }, [seasonId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { ...data, refetch: loadData };
}

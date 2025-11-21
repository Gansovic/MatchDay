import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

export interface PlayerStatRow {
  id: string;
  name: string;
  avatar_url: string | null;
  team: string;
  team_color: string;
  value: number;
  matches_played: number;
  position: string;
}

export interface SeasonStats {
  total_matches: number;
  completed_matches: number;
  total_goals: number;
  total_players: number;
  avg_goals_per_match: number;
}

export interface LeaderboardData {
  topScorers: PlayerStatRow[];
  topAssists: PlayerStatRow[];
  cleanSheets: PlayerStatRow[];
  manOfTheMatch: PlayerStatRow[];
  seasonStats: SeasonStats;
}

interface UseSeasonLeaderboardsReturn {
  data: LeaderboardData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSeasonLeaderboards(
  seasonId: string | undefined,
  leagueId: string | undefined
): UseSeasonLeaderboardsReturn {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!seasonId || !leagueId) {
      setLoading(false);
      setError('Season ID and League ID are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get season statistics from matches table
      const { data: allMatches, error: matchesError } = await supabase
        .from('matches')
        .select('id, status, home_score, away_score')
        .eq('season_id', seasonId)
        .eq('league_id', leagueId);

      if (matchesError) throw matchesError;

      // Calculate season statistics
      const totalMatches = allMatches?.length || 0;
      const completedMatches = allMatches?.filter(m => m.status === 'completed').length || 0;
      const totalGoals = allMatches
        ?.filter(m => m.status === 'completed')
        .reduce((sum, m) => sum + (m.home_score || 0) + (m.away_score || 0), 0) || 0;
      const avgGoalsPerMatch = completedMatches > 0 ? totalGoals / completedMatches : 0;

      // Get registered teams count
      const { count: teamsCount } = await supabase
        .from('season_teams')
        .select('id', { count: 'exact', head: true })
        .eq('season_id', seasonId)
        .eq('status', 'confirmed');

      // Fetch match events for goals and assists
      const { data: matchEvents, error: eventsError } = await supabase
        .from('match_events')
        .select(`
          id,
          player_id,
          event_type,
          assist_player_id,
          matches!inner (
            id,
            season_id,
            league_id,
            status
          )
        `)
        .eq('matches.season_id', seasonId)
        .eq('matches.league_id', leagueId)
        .eq('matches.status', 'completed')
        .in('event_type', ['goal', 'assist']);

      if (eventsError) {
        // If the table doesn't exist or query fails, use empty data
        console.warn('Failed to fetch match events:', eventsError);
        setData({
          topScorers: [],
          topAssists: [],
          cleanSheets: [],
          manOfTheMatch: [],
          seasonStats: {
            total_matches: totalMatches,
            completed_matches: completedMatches,
            total_goals: totalGoals,
            total_players: 0,
            avg_goals_per_match: Math.round(avgGoalsPerMatch * 100) / 100,
          },
        });
        setLoading(false);
        return;
      }

      // Aggregate player stats from match events
      const playerAggregates: Record<string, {
        id: string;
        goals: number;
        assists: number;
        matches: Set<string>;
      }> = {};

      // Process match events
      if (matchEvents && matchEvents.length > 0) {
        for (const event of matchEvents) {
          const playerId = event.player_id;
          const matchId = Array.isArray(event.matches) ? event.matches[0]?.id : event.matches?.id;

          if (!playerId) continue;

          if (!playerAggregates[playerId]) {
            playerAggregates[playerId] = {
              id: playerId,
              goals: 0,
              assists: 0,
              matches: new Set(),
            };
          }

          if (matchId) {
            playerAggregates[playerId].matches.add(matchId);
          }

          if (event.event_type === 'goal') {
            playerAggregates[playerId].goals += 1;

            // Count assist for the assist player
            if (event.assist_player_id) {
              if (!playerAggregates[event.assist_player_id]) {
                playerAggregates[event.assist_player_id] = {
                  id: event.assist_player_id,
                  goals: 0,
                  assists: 0,
                  matches: new Set(),
                };
              }
              playerAggregates[event.assist_player_id].assists += 1;
              if (matchId) {
                playerAggregates[event.assist_player_id].matches.add(matchId);
              }
            }
          }
        }
      }

      // Get player profiles and team info
      const playerIds = Object.keys(playerAggregates);
      const playerProfiles: Record<string, any> = {};
      const playerTeams: Record<string, { team: string; team_color: string }> = {};

      if (playerIds.length > 0) {
        // Fetch profiles
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, display_name, full_name')
          .in('id', playerIds);

        if (profiles) {
          for (const profile of profiles) {
            playerProfiles[profile.id] = profile;
          }
        }

        // Fetch team memberships for this specific season
        for (const playerId of playerIds) {
          const { data: teamMemberData } = await supabase
            .from('team_members')
            .select(`
              team_id,
              teams!inner (
                id,
                name,
                team_color,
                season_teams!inner (
                  season_id,
                  status
                )
              )
            `)
            .eq('user_id', playerId)
            .is('removed_at', null) // Only get active team memberships
            .eq('teams.season_teams.season_id', seasonId)
            .limit(1)
            .maybeSingle();

          if (teamMemberData?.teams) {
            const team = Array.isArray(teamMemberData.teams)
              ? teamMemberData.teams[0]
              : teamMemberData.teams;
            playerTeams[playerId] = {
              team: team.name || 'Unknown',
              team_color: team.team_color || '#3b82f6',
            };
          }
        }
      }

      // Build final player list with names and teams
      const players = Object.values(playerAggregates).map(p => {
        const profile = playerProfiles[p.id];
        const playerName = profile?.display_name || profile?.full_name || 'Unknown Player';

        return {
          id: p.id,
          name: playerName,
          avatar_url: null,
          team: playerTeams[p.id]?.team || 'Unknown',
          team_color: playerTeams[p.id]?.team_color || '#3b82f6',
          goals: p.goals,
          assists: p.assists,
          cleanSheets: 0, // TODO: Implement clean sheets from match data
          matches_played: p.matches.size,
          position: 'Player',
        };
      });

      // Fetch Man of the Match data
      const { data: motmMatches, error: motmError } = await supabase
        .from('matches')
        .select(`
          man_of_match_id,
          profiles!matches_man_of_match_id_fkey (
            id,
            display_name,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('season_id', seasonId)
        .eq('league_id', leagueId)
        .eq('status', 'completed')
        .not('man_of_match_id', 'is', null);

      // Aggregate MOTM counts
      const motmCounts: Record<string, {
        id: string;
        name: string;
        avatar_url: string | null;
        team: string;
        team_color: string;
        count: number;
        matches_played: number;
      }> = {};

      if (motmMatches && !motmError) {
        for (const match of motmMatches) {
          const playerId = match.man_of_match_id;
          if (!playerId) continue;

          if (!motmCounts[playerId]) {
            const profile = Array.isArray(match.profiles) ? match.profiles[0] : match.profiles;
            const playerName = profile?.display_name || profile?.full_name || 'Unknown Player';

            motmCounts[playerId] = {
              id: playerId,
              name: playerName,
              avatar_url: null,
              team: playerTeams[playerId]?.team || 'Unknown',
              team_color: playerTeams[playerId]?.team_color || '#3b82f6',
              count: 0,
              matches_played: playerAggregates[playerId]?.matches.size || 0,
            };
          }
          motmCounts[playerId].count += 1;
        }
      }

      const manOfTheMatchPlayers = Object.values(motmCounts);

      // Sort and get top players for each category
      const topScorers: PlayerStatRow[] = [...players]
        .sort((a, b) => b.goals - a.goals)
        .filter(p => p.goals > 0)
        .slice(0, 5)
        .map(p => ({
          id: p.id,
          name: p.name,
          avatar_url: p.avatar_url,
          team: p.team,
          team_color: p.team_color,
          value: p.goals,
          matches_played: p.matches_played,
          position: p.position,
        }));

      const topAssists: PlayerStatRow[] = [...players]
        .sort((a, b) => b.assists - a.assists)
        .filter(p => p.assists > 0)
        .slice(0, 5)
        .map(p => ({
          id: p.id,
          name: p.name,
          avatar_url: p.avatar_url,
          team: p.team,
          team_color: p.team_color,
          value: p.assists,
          matches_played: p.matches_played,
          position: p.position,
        }));

      const cleanSheets: PlayerStatRow[] = [...players]
        .sort((a, b) => b.cleanSheets - a.cleanSheets)
        .filter(p => p.cleanSheets > 0)
        .slice(0, 5)
        .map(p => ({
          id: p.id,
          name: p.name,
          avatar_url: p.avatar_url,
          team: p.team,
          team_color: p.team_color,
          value: p.cleanSheets,
          matches_played: p.matches_played,
          position: p.position,
        }));

      const manOfTheMatch: PlayerStatRow[] = [...manOfTheMatchPlayers]
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map(p => ({
          id: p.id,
          name: p.name,
          avatar_url: p.avatar_url || null,
          team: p.team,
          team_color: p.team_color,
          value: p.count,
          matches_played: p.matches_played,
          position: 'Player',
        }));

      setData({
        topScorers,
        topAssists,
        cleanSheets,
        manOfTheMatch,
        seasonStats: {
          total_matches: totalMatches,
          completed_matches: completedMatches,
          total_goals: totalGoals,
          total_players: players.length,
          avg_goals_per_match: Math.round(avgGoalsPerMatch * 100) / 100,
        },
      });
    } catch (err: any) {
      console.error('Error loading leaderboards:', err);
      setError(err.message || 'Failed to load leaderboards');
    } finally {
      setLoading(false);
    }
  }, [seasonId, leagueId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { data, loading, error, refetch: loadData };
}

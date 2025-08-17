/**
 * Dashboard Data Hooks for MatchDay
 * 
 * Custom hooks for fetching and managing dashboard-related data
 * including user stats, teams, matches, and performance analytics
 */

'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { TeamService, TeamWithDetails } from '@/lib/services/team.service';
import { StatsService, PlayerPerformanceAnalysis } from '@/lib/services/stats.service';
import { LeagueService } from '@/lib/services/league.service';
import { UserService } from '@/lib/services/user.service';

export interface DashboardStats {
  matchesPlayed: number;
  teamsJoined: number;
  upcomingMatches: number;
  winRate: number;
  goalsScored: number;
  assists: number;
  leaguesParticipated: number;
}

export interface RecentActivity {
  id: string;
  type: 'match' | 'team_joined' | 'goal_scored' | 'league_joined';
  title: string;
  description: string;
  timestamp: string;
  metadata?: {
    teamName?: string;
    leagueName?: string;
    opponent?: string;
    score?: string;
  };
}

export interface UserTeamMembership {
  team: TeamWithDetails;
  role: 'captain' | 'member';
  position?: string;
  jerseyNumber?: number;
  joinedAt: string;
  stats?: {
    goals: number;
    assists: number;
    matches: number;
  };
}

/**
 * Hook for fetching user dashboard statistics
 */
export function useUserStats(userId: string | null) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setStats(null);
      setLoading(false);
      return;
    }

    async function fetchUserStats() {
      try {
        setLoading(true);
        setError(null);

        // Get user's team memberships
        const teamService = TeamService.getInstance(supabase);
        const teamsResult = await teamService.getUserTeams(userId);
        
        if (!teamsResult.success) {
          throw new Error(teamsResult.error?.message || 'Failed to fetch teams');
        }

        const teams = teamsResult.data || [];

        // Get user's cross-league stats
        const statsService = StatsService.getInstance(supabase);
        const performanceResult = await statsService.getPlayerPerformanceAnalysis(userId, {
          includeComparisons: false,
          includePredictions: false
        });

        // Get user's stats from player_cross_league_stats
        const { data: crossLeagueStats } = await supabase
          .from('player_cross_league_stats')
          .select('*')
          .eq('player_id', userId)
          .eq('season_year', new Date().getFullYear())
          .single();

        // Get total matches played across all teams
        const { data: playerStats } = await supabase
          .from('player_stats')
          .select('games_played, goals, assists, wins, draws, losses')
          .eq('player_id', userId)
          .eq('season_year', new Date().getFullYear());

        const totalMatches = playerStats?.reduce((sum, stat) => sum + (stat.games_played || 0), 0) || 0;
        const totalGoals = playerStats?.reduce((sum, stat) => sum + (stat.goals || 0), 0) || 0;
        const totalAssists = playerStats?.reduce((sum, stat) => sum + (stat.assists || 0), 0) || 0;
        const totalWins = playerStats?.reduce((sum, stat) => sum + (stat.wins || 0), 0) || 0;
        const totalGames = playerStats?.reduce((sum, stat) => sum + ((stat.wins || 0) + (stat.draws || 0) + (stat.losses || 0)), 0) || 0;

        // Calculate win rate
        const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;

        // Get upcoming matches (simplified - would need match scheduling system)
        const upcomingMatches = 0; // TODO: Implement when match system is ready

        // Get unique leagues participated
        const leaguesParticipated = teams.reduce((acc, team) => {
          if (team.league?.id && !acc.includes(team.league.id)) {
            acc.push(team.league.id);
          }
          return acc;
        }, [] as string[]).length;

        const dashboardStats: DashboardStats = {
          matchesPlayed: totalMatches,
          teamsJoined: teams.length,
          upcomingMatches,
          winRate,
          goalsScored: totalGoals,
          assists: totalAssists,
          leaguesParticipated
        };

        setStats(dashboardStats);
      } catch (err) {
        console.error('Error fetching user stats:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch statistics');
      } finally {
        setLoading(false);
      }
    }

    fetchUserStats();
  }, [userId]);

  return { stats, loading, error, refetch: () => setLoading(true) };
}

/**
 * Hook for fetching user's team memberships with detailed information
 */
export function useUserTeams(userId: string | null) {
  const [teams, setTeams] = useState<UserTeamMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setTeams([]);
      setLoading(false);
      return;
    }

    async function fetchUserTeams() {
      try {
        setLoading(true);
        setError(null);

        const teamService = TeamService.getInstance(supabase);
        const result = await teamService.getUserTeams(userId);

        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to fetch teams');
        }

        // Get detailed membership information
        const { data: memberships } = await supabase
          .from('team_members')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true);

        // Get player stats for each team
        const { data: playerStats } = await supabase
          .from('player_stats')
          .select('*')
          .eq('player_id', userId)
          .eq('season_year', new Date().getFullYear());

        const teamMemberships: UserTeamMembership[] = (result.data || []).map(team => {
          const membership = memberships?.find(m => m.team_id === team.id);
          const stats = playerStats?.find(s => s.team_id === team.id);
          
          return {
            team,
            role: team.captain_id === userId ? 'captain' : 'member',
            position: membership?.position,
            jerseyNumber: membership?.jersey_number,
            joinedAt: membership?.joined_at || team.created_at,
            stats: stats ? {
              goals: stats.goals || 0,
              assists: stats.assists || 0,
              matches: stats.games_played || 0
            } : undefined
          };
        });

        setTeams(teamMemberships);
      } catch (err) {
        console.error('Error fetching user teams:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch teams');
      } finally {
        setLoading(false);
      }
    }

    fetchUserTeams();
  }, [userId]);

  return { teams, loading, error, refetch: () => setLoading(true) };
}

/**
 * Hook for fetching user's recent activity
 */
export function useRecentActivity(userId: string | null, limit: number = 10) {
  const [activity, setActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setActivity([]);
      setLoading(false);
      return;
    }

    async function fetchRecentActivity() {
      try {
        setLoading(true);
        setError(null);

        const activities: RecentActivity[] = [];

        // Get recent team memberships
        const { data: teamMemberships } = await supabase
          .from('team_members')
          .select(`
            *,
            team:teams!inner(
              name,
              league:leagues(name)
            )
          `)
          .eq('user_id', userId)
          .eq('is_active', true)
          .order('joined_at', { ascending: false })
          .limit(5);

        teamMemberships?.forEach(membership => {
          activities.push({
            id: `team_${membership.id}`,
            type: 'team_joined',
            title: `Joined ${membership.team.name}`,
            description: `You became a member of ${membership.team.name}`,
            timestamp: membership.joined_at,
            metadata: {
              teamName: membership.team.name,
              leagueName: membership.team.league?.name
            }
          });
        });

        // Get recent player stats (recent matches implied)
        const { data: recentStats } = await supabase
          .from('player_stats')
          .select(`
            *,
            team:teams!inner(
              name,
              league:leagues(name)
            )
          `)
          .eq('player_id', userId)
          .eq('season_year', new Date().getFullYear())
          .order('updated_at', { ascending: false })
          .limit(5);

        recentStats?.forEach(stat => {
          if (stat.games_played > 0) {
            activities.push({
              id: `stats_${stat.id}`,
              type: 'match',
              title: `Match Activity in ${stat.team.name}`,
              description: `Played ${stat.games_played} matches, scored ${stat.goals || 0} goals`,
              timestamp: stat.updated_at,
              metadata: {
                teamName: stat.team.name,
                leagueName: stat.team.league?.name
              }
            });
          }
        });

        // Sort all activities by timestamp and limit
        const sortedActivities = activities
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, limit);

        setActivity(sortedActivities);
      } catch (err) {
        console.error('Error fetching recent activity:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch recent activity');
      } finally {
        setLoading(false);
      }
    }

    fetchRecentActivity();
  }, [userId, limit]);

  return { activity, loading, error, refetch: () => setLoading(true) };
}

/**
 * Hook for fetching user's performance analysis
 */
export function useUserPerformance(userId: string | null) {
  const [performance, setPerformance] = useState<PlayerPerformanceAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setPerformance(null);
      setLoading(false);
      return;
    }

    async function fetchUserPerformance() {
      try {
        setLoading(true);
        setError(null);

        const statsService = StatsService.getInstance(supabase);
        const result = await statsService.getPlayerPerformanceAnalysis(userId, {
          includeComparisons: true,
          includePredictions: true
        });

        if (!result.success) {
          // If no stats exist yet, don't treat as error
          if (result.error?.code === 'PGRST116') {
            setPerformance(null);
            return;
          }
          throw new Error(result.error?.message || 'Failed to fetch performance analysis');
        }

        setPerformance(result.data);
      } catch (err) {
        console.error('Error fetching user performance:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch performance analysis');
      } finally {
        setLoading(false);
      }
    }

    fetchUserPerformance();
  }, [userId]);

  return { performance, loading, error, refetch: () => setLoading(true) };
}
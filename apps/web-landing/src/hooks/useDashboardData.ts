/**
 * Dashboard Data Hooks for MatchDay
 * 
 * Custom hooks for fetching and managing dashboard-related data
 * including user stats, teams, matches, and performance analytics
 */

'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
// Services no longer needed - using direct Supabase queries

export interface DashboardStats {
  matchesPlayed: number;
  teamsJoined: number;
  upcomingMatches: number;
  winRate: number;
  goalsScored: number;
  assists: number;
  leaguesParticipated: number;
  avgTeamWinRate?: number;
}

export interface TeamStats {
  team_id: string;
  team_name: string;
  team_color: string;
  league_name: string;
  team_position: string;
  jersey_number: number;
  wins: number;
  draws: number;
  losses: number;
  games_played: number;
  win_rate: number;
  team_points: number;
  goals_for: number;
  goals_against: number;
}

export interface MultiTeamContext {
  hasMultipleTeams: boolean;
  totalTeams: number;
  bestPerformingTeam: TeamStats | null;
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
  team: {
    id: string;
    name: string;
    league?: { id: string; name: string } | null;
    captain_id?: string;
    memberCount: number;
    availableSpots: number;
  };
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
 * Hook for fetching user dashboard statistics with multi-team support
 */
export function useUserStats(userId: string | null) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [teamStats, setTeamStats] = useState<TeamStats[]>([]);
  const [multiTeamContext, setMultiTeamContext] = useState<MultiTeamContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setStats(null);
      setTeamStats([]);
      setMultiTeamContext(null);
      setLoading(false);
      return;
    }

    async function fetchUserStats() {
      try {
        setLoading(true);
        setError(null);

        // Use new API endpoint for user stats
        const response = await fetch('/api/user/stats');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch user stats: ${response.status}`);
        }

        const data = await response.json();
        setStats(data.stats);
        setTeamStats(data.teamStats || []);
        setMultiTeamContext(data.multiTeamContext || null);
      } catch (err) {
        console.error('Error fetching user stats:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch statistics');
      } finally {
        setLoading(false);
      }
    }

    fetchUserStats();
  }, [userId]);

  return { 
    stats, 
    teamStats, 
    multiTeamContext, 
    loading, 
    error, 
    refetch: () => setLoading(true) 
  };
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

        // Use new API endpoint for user teams
        const response = await fetch('/api/user/teams');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch user teams: ${response.status}`);
        }

        const data = await response.json();
        setTeams(data.teams || []);
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

export interface UserPerformance {
  overallRating: number;
  strengths: string[];
  totalGoals: number;
  totalAssists: number;
  totalMatches: number;
}

/**
 * Hook for fetching user's performance analysis
 */
export function useUserPerformance(userId: string | null) {
  const [performance, setPerformance] = useState<UserPerformance | null>(null);
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

        // Use new API endpoint for user stats (includes performance data)
        const response = await fetch('/api/user/stats');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch user performance: ${response.status}`);
        }

        const data = await response.json();
        setPerformance(data.performance);
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
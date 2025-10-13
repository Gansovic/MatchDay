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
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error('❌ API Error Status:', response.status);
          console.error('❌ API Error Data:', errorData);
          throw new Error(`Failed to fetch user stats: ${response.status} - ${errorData.details || errorData.error || 'Unknown error'}`);
        }

        const data = await response.json();
        console.log('📊 Client received stats data:', data);
        console.log('📊 Win Rate from API:', data.stats?.winRate);
        console.log('📊 Team Context:', data.teamContext);
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

/**
 * Hook for fetching user's matches with filtering options
 */
export function useUserMatches(userId: string | null) {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setMatches([]);
      setLoading(false);
      return;
    }

    async function fetchUserMatches() {
      try {
        setLoading(true);
        setError(null);

        // Fetch matches from API
        const response = await fetch('/api/matches');

        if (!response.ok) {
          throw new Error(`Failed to fetch matches: ${response.status}`);
        }

        const result = await response.json();
        const matchesData = result.data || [];

        // Transform matches to match our MatchCard interface
        const transformedMatches = matchesData.map((match: any) => ({
          id: match.id,
          match_number: match.match_number,
          homeTeam: {
            id: match.home_team_id || match.homeTeamId,
            name: match.home_team?.name || match.homeTeamName || 'Unknown Team',
            color: match.home_team?.team_color || match.homeTeamColor || '#3B82F6'
          },
          awayTeam: {
            id: match.away_team_id || match.awayTeamId,
            name: match.away_team?.name || match.awayTeamName || 'Unknown Team',
            color: match.away_team?.team_color || match.awayTeamColor || '#DC2626'
          },
          status: match.status,
          matchDate: match.match_date || match.scheduled_date,
          venue: match.venue || 'TBD',
          homeScore: match.home_score,
          awayScore: match.away_score,
          leagueName: match.league?.name || match.leagueName
        }));

        setMatches(transformedMatches);
      } catch (err) {
        console.error('Error fetching user matches:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch matches');
      } finally {
        setLoading(false);
      }
    }

    fetchUserMatches();
  }, [userId]);

  return { matches, loading, error, refetch: () => setLoading(true) };
}

/**
 * Hook for calculating player level/rating from stats
 */
export function usePlayerLevel(stats: DashboardStats | null, teamStats: TeamStats[]) {
  const [playerLevel, setPlayerLevel] = useState(5.0); // Default beginner level
  const [reliabilityPercentage, setReliabilityPercentage] = useState(0);

  useEffect(() => {
    if (!stats) {
      setPlayerLevel(5.0);
      setReliabilityPercentage(0);
      return;
    }

    // Calculate player level based on various factors
    // Algorithm inspired by Playtomic's level system
    let calculatedLevel = 5.0; // Base level

    // Win rate factor (0-2.5 points)
    const winRateFactor = (stats.winRate / 100) * 2.5;
    calculatedLevel += winRateFactor;

    // Experience factor based on matches played (0-1.5 points)
    const experienceFactor = Math.min((stats.matchesPlayed / 50) * 1.5, 1.5);
    calculatedLevel += experienceFactor;

    // Goals/assists factor (0-1 point)
    const avgGoalsPerMatch = stats.matchesPlayed > 0 ? stats.goalsScored / stats.matchesPlayed : 0;
    const avgAssistsPerMatch = stats.matchesPlayed > 0 ? stats.assists / stats.matchesPlayed : 0;
    const scoringFactor = Math.min((avgGoalsPerMatch + avgAssistsPerMatch * 0.5) * 0.5, 1.0);
    calculatedLevel += scoringFactor;

    // Team performance factor (0-0.5 points) - average team win rates
    if (teamStats && teamStats.length > 0) {
      const avgTeamWinRate = teamStats.reduce((sum, team) => sum + team.win_rate, 0) / teamStats.length;
      const teamFactor = (avgTeamWinRate / 100) * 0.5;
      calculatedLevel += teamFactor;
    }

    // Cap at 10.0 max level
    calculatedLevel = Math.min(calculatedLevel, 10.0);

    // Calculate reliability percentage (attendance rate)
    // For now, assume perfect attendance if they have matches
    // In a real system, this would track scheduled vs attended matches
    const reliability = stats.matchesPlayed > 0 ? Math.min(95 + (stats.matchesPlayed / 10), 100) : 0;

    setPlayerLevel(Number(calculatedLevel.toFixed(1)));
    setReliabilityPercentage(Math.round(reliability));
  }, [stats, teamStats]);

  return { playerLevel, reliabilityPercentage };
}

/**
 * Hook for generating performance chart data from match history
 */
export function usePerformanceData(matches: any[], stats: DashboardStats | null) {
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPerformanceData() {
      if (!matches || matches.length === 0 || !stats) {
        setPerformanceData([]);
        setLoading(false);
        return;
      }

      try {
        // Generate performance data points from completed matches
        const completedMatches = matches
          .filter(m => m.status === 'completed' && m.homeScore !== undefined && m.awayScore !== undefined)
          .sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime());

        if (completedMatches.length === 0) {
          setPerformanceData([]);
          setLoading(false);
          return;
        }

        // Fetch player stats for each match to get actual goals per match
        const { data: playerStats } = await supabase
          .from('player_stats')
          .select('match_id, goals, assists')
          .in('match_id', completedMatches.map(m => m.id));

        // Create a map of match_id to goals
        const goalsPerMatch = new Map();
        (playerStats || []).forEach(stat => {
          goalsPerMatch.set(stat.match_id, stat.goals || 0);
        });

        const dataPoints = [];
        let cumulativeWins = 0;
        let cumulativeMatches = 0;

        for (let i = 0; i < completedMatches.length; i++) {
          const match = completedMatches[i];
          cumulativeMatches++;

          // Get actual goals for this match (whole number)
          const goalsInMatch = goalsPerMatch.get(match.id) || 0;

          // Determine if user won by checking which team they're on
          const userScore = match.homeScore;
          const opponentScore = match.awayScore;
          if (userScore > opponentScore) cumulativeWins++;

          // Calculate rolling stats
          const winRate = (cumulativeWins / cumulativeMatches) * 100;
          const rating = 5.0 + (winRate / 100) * 5.0; // Simplified rating calculation

          const date = new Date(match.matchDate);
          const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

          dataPoints.push({
            date: match.matchDate,
            matchDate: date,
            winRate: Number(winRate.toFixed(1)),
            goals: goalsInMatch, // Actual goals scored in this match (whole number)
            rating: Number(rating.toFixed(1)),
            label
          });
        }

        setPerformanceData(dataPoints);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching performance data:', error);
        setPerformanceData([]);
        setLoading(false);
      }
    }

    fetchPerformanceData();
  }, [matches, stats]);

  return { performanceData, loading };
}
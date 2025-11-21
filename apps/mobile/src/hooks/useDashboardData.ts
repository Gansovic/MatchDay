import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

export interface PlayerProfile {
  displayName: string;
  fullName?: string;
  bio?: string;
  avatarUrl?: string;
  preferredPosition?: string;
  location?: string;
}

export interface DashboardStats {
  matchesPlayed: number;
  winRate: number;
  goalsScored: number;
  teamsCount: number;
  recentForm: ('W' | 'D' | 'L')[];
}

export interface Match {
  id: string;
  date: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  homeTeam: { name: string; color?: string; logoUrl?: string };
  awayTeam: { name: string; color?: string; logoUrl?: string };
  homeScore?: number;
  awayScore?: number;
  leagueName: string;
  venue: string;
  userTeamId: string;
  result?: 'won' | 'lost' | 'draw';
}

export interface DashboardData {
  profile: PlayerProfile | null;
  stats: DashboardStats | null;
  matches: Match[];
  loading: boolean;
  error: string | null;
}

export const useDashboardData = (userId: string | undefined) => {
  const [data, setData] = useState<DashboardData>({
    profile: null,
    stats: null,
    matches: [],
    loading: true,
    error: null,
  });

  const loadDashboardData = useCallback(async () => {
    if (!userId) {
      setData((prev) => ({ ...prev, loading: false }));
      return;
    }

    try {
      setData((prev) => ({ ...prev, loading: true, error: null }));

      // Load user profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('display_name, full_name, bio, avatar_url, preferred_position, location')
        .eq('id', userId)
        .maybeSingle();

      console.log('Dashboard - Profile data from DB:', profileData);
      console.log('Dashboard - Profile error:', profileError);

      // Handle case where profile doesn't exist (new user)
      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      const profile: PlayerProfile = {
        displayName: profileData?.display_name || 'Player',
        fullName: profileData?.full_name,
        bio: profileData?.bio,
        avatarUrl: profileData?.avatar_url,
        preferredPosition: profileData?.preferred_position,
        location: profileData?.location,
      };

      console.log('Dashboard - Constructed profile:', profile);

      // Load user's teams (only where user hasn't been removed)
      const { data: teamMembersData, error: teamMembersError } = await supabase
        .from('team_members')
        .select('id, team_id, teams(id, name)')
        .eq('user_id', userId)
        .is('removed_at', null); // Only get teams where user hasn't been removed

      if (teamMembersError) throw teamMembersError;

      const teamsCount = teamMembersData?.length || 0;
      const teamIds = teamMembersData?.map((tm: any) => tm.team_id) || [];

      // Load matches for user's teams
      let matches: Match[] = [];
      let completedMatchesCount = 0;
      let wins = 0;
      let goalsScored = 0;
      let recentResults: ('W' | 'D' | 'L')[] = [];

      if (teamIds.length > 0) {
        const { data: matchesData, error: matchesError } = await supabase
          .from('matches')
          .select(`
            id,
            match_date,
            venue,
            status,
            home_team_id,
            away_team_id,
            home_score,
            away_score,
            seasons(league_id, leagues(name))
          `)
          .or(`home_team_id.in.(${teamIds.join(',')}),away_team_id.in.(${teamIds.join(',')})`)
          .order('match_date', { ascending: false })
          .limit(20);

        if (matchesError) throw matchesError;

        // Get team names, colors, and logos
        const allTeamIds = [...new Set(matchesData?.flatMap((m: any) => [m.home_team_id, m.away_team_id]) || [])];
        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select('id, name, team_color')
          .in('id', allTeamIds);

        if (teamsError) throw teamsError;

        // Fetch team logos from media table
        const { data: mediaData, error: mediaError } = await supabase
          .from('media')
          .select('team_id, storage_path, context_type')
          .in('team_id', allTeamIds)
          .eq('context_type', 'team_logo')
          .order('created_at', { ascending: false });

        console.log('Dashboard - Media data for team logos:', mediaData, 'Error:', mediaError);

        // Create logo map
        const logoMap = new Map<string, string>();
        mediaData?.forEach((media: any) => {
          if (!logoMap.has(media.team_id) && media.storage_path) {
            const { data: urlData } = supabase.storage
              .from('team-logos')
              .getPublicUrl(media.storage_path);

            if (urlData?.publicUrl) {
              logoMap.set(media.team_id, `${urlData.publicUrl}?t=${Date.now()}`);
            }
          }
        });

        console.log('Dashboard - Logo map:', Array.from(logoMap.entries()));

        const teamsMap = new Map(teamsData?.map((t: any) => [t.id, { name: t.name, color: t.team_color, logoUrl: logoMap.get(t.id) }]) || []);

        // Process matches
        matches = matchesData?.map((match: any) => {
          const homeTeam = teamsMap.get(match.home_team_id) || { name: 'Unknown', color: undefined, logoUrl: undefined };
          const awayTeam = teamsMap.get(match.away_team_id) || { name: 'Unknown', color: undefined, logoUrl: undefined };
          const userTeamId = teamIds.includes(match.home_team_id) ? match.home_team_id : match.away_team_id;
          const isHomeTeam = userTeamId === match.home_team_id;

          let result: 'won' | 'lost' | 'draw' | undefined;
          if (match.status === 'completed' && match.home_score !== null && match.away_score !== null) {
            if (match.home_score === match.away_score) {
              result = 'draw';
            } else if ((isHomeTeam && match.home_score > match.away_score) || (!isHomeTeam && match.away_score > match.home_score)) {
              result = 'won';
            } else {
              result = 'lost';
            }
          }

          return {
            id: match.id,
            date: match.match_date,
            status: match.status,
            homeTeam: { name: homeTeam.name, color: homeTeam.color, logoUrl: homeTeam.logoUrl },
            awayTeam: { name: awayTeam.name, color: awayTeam.color, logoUrl: awayTeam.logoUrl },
            homeScore: match.home_score ?? undefined,
            awayScore: match.away_score ?? undefined,
            leagueName: match.seasons?.leagues?.name || 'League',
            venue: match.venue || 'TBD',
            userTeamId,
            result,
          };
        }) || [];

        // Calculate stats from completed matches
        const completedMatches = matches.filter((m) => m.status === 'completed');
        completedMatchesCount = completedMatches.length;
        wins = completedMatches.filter((m) => m.result === 'won').length;

        // Get recent 5 results
        recentResults = completedMatches
          .slice(0, 5)
          .map((m) => {
            if (m.result === 'won') return 'W';
            if (m.result === 'draw') return 'D';
            return 'L';
          }) as ('W' | 'D' | 'L')[];
      }

      // Load player goals from match_events
      // First try direct user_id match
      const { count: goalsCount, error: goalsError } = await supabase
        .from('match_events')
        .select('*', { count: 'exact', head: true })
        .eq('player_id', userId)
        .eq('event_type', 'goal');

      console.log('Direct goal count query:', { userId, goalsCount, goalsError });

      if (!goalsError && goalsCount) {
        goalsScored = goalsCount;
      } else {
        // Fallback: Check if player_id might be team_member.id instead of user_id
        // Get all team_member IDs for this user
        const teamMemberIds = teamMembersData?.map((tm: any) => tm.id) || [];
        if (teamMemberIds.length > 0) {
          const { count: altGoalsCount, error: altGoalsError } = await supabase
            .from('match_events')
            .select('*', { count: 'exact', head: true })
            .in('player_id', teamMemberIds)
            .eq('event_type', 'goal');

          console.log('Alt goal count query (via team_member.id):', { teamMemberIds, altGoalsCount, altGoalsError });

          if (!altGoalsError && altGoalsCount) {
            goalsScored = altGoalsCount;
          }
        }
      }

      const stats: DashboardStats = {
        matchesPlayed: completedMatchesCount,
        winRate: completedMatchesCount > 0 ? Math.round((wins / completedMatchesCount) * 100) : 0,
        goalsScored,
        teamsCount,
        recentForm: recentResults,
      };

      setData({
        profile,
        stats,
        matches,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      setData((prev) => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to load dashboard data',
      }));
    }
  }, [userId]); // Add userId as dependency

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return {
    ...data,
    refetch: loadDashboardData,
  };
};

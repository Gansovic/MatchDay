import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export interface TeamDetails {
  id: string;
  name: string;
  logo_url?: string;
  team_color?: string;
  league_name: string;
  league_id: string;
  memberCount: number;
}

export interface TeamStats {
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  winRate: number;
  leaguePosition?: number;
  totalTeamsInLeague?: number;
  form: ('W' | 'D' | 'L')[];
}

export interface TeamMember {
  id: string;
  user_id: string;
  position?: string;
  jersey_number?: number;
  is_captain: boolean;
  user_profile: {
    display_name: string;
    avatar_url?: string;
  };
  stats: {
    matches_played: number;
    goals: number;
    assists: number;
  };
}

export interface UserRole {
  isCaptain: boolean;
  position?: string;
  jerseyNumber?: number;
}

export interface TeamData {
  team: TeamDetails | null;
  stats: TeamStats | null;
  members: TeamMember[];
  matches: {
    recent: any[];
    upcoming: any[];
  };
  userRole: UserRole | null;
  loading: boolean;
  error: string | null;
}

export const useTeamData = (teamId: string | undefined, userId: string | undefined) => {
  const [data, setData] = useState<TeamData>({
    team: null,
    stats: null,
    members: [],
    matches: { recent: [], upcoming: [] },
    userRole: null,
    loading: true,
    error: null,
  });

  const loadTeamData = async () => {
    if (!teamId) {
      setData((prev) => ({ ...prev, loading: false, error: 'Team ID is required' }));
      return;
    }

    try {
      setData((prev) => ({ ...prev, loading: true, error: null }));

      // Fetch team details
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('id, name, team_color, league_id, captain_id, leagues(name)')
        .eq('id', teamId)
        .single();

      if (teamError) throw teamError;

      // Fetch team logo by team_id (matches admin app approach)
      let logoUrl: string | undefined;
      const { data: mediaData } = await supabase
        .from('media')
        .select('storage_path, context_type')
        .eq('team_id', teamId)
        .eq('context_type', 'team_logo')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (mediaData?.storage_path) {
        // Determine bucket based on context_type
        let bucket = 'media';
        if (mediaData.context_type === 'team_logo') {
          bucket = 'team-logos';
        }

        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(mediaData.storage_path);

        if (urlData?.publicUrl) {
          logoUrl = `${urlData.publicUrl}?t=${Date.now()}`;
        }
      }

      // Get member count (only active, non-removed members)
      const { count: memberCount } = await supabase
        .from('team_members')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', teamId)
        .is('removed_at', null); // Only count members who haven't been removed

      const team: TeamDetails = {
        id: teamData.id,
        name: teamData.name,
        logo_url: logoUrl,
        team_color: teamData.team_color,
        league_name: (teamData.leagues as any)?.name || 'No League',
        league_id: teamData.league_id,
        memberCount: memberCount || 0,
      };

      // Fetch team matches to calculate stats
      const { data: matchesData } = await supabase
        .from('matches')
        .select('*')
        .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
        .eq('status', 'completed')
        .order('match_date', { ascending: false });

      let wins = 0;
      let draws = 0;
      let losses = 0;
      let goalsFor = 0;
      let goalsAgainst = 0;
      const formArray: ('W' | 'D' | 'L')[] = [];

      matchesData?.forEach((match) => {
        const isHome = match.home_team_id === teamId;
        const teamScore = isHome ? match.home_score : match.away_score;
        const opponentScore = isHome ? match.away_score : match.home_score;

        if (teamScore !== null && opponentScore !== null) {
          goalsFor += teamScore;
          goalsAgainst += opponentScore;

          if (teamScore > opponentScore) {
            wins++;
            if (formArray.length < 5) formArray.push('W');
          } else if (teamScore === opponentScore) {
            draws++;
            if (formArray.length < 5) formArray.push('D');
          } else {
            losses++;
            if (formArray.length < 5) formArray.push('L');
          }
        }
      });

      const totalMatches = wins + draws + losses;
      const points = wins * 3 + draws;
      const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

      const stats: TeamStats = {
        wins,
        draws,
        losses,
        goalsFor,
        goalsAgainst,
        goalDifference: goalsFor - goalsAgainst,
        points,
        winRate,
        form: formArray,
      };

      // Fetch team members (only active, non-removed members)
      const { data: membersData, error: membersError } = await supabase
        .from('team_members')
        .select('id, user_id, position, jersey_number')
        .eq('team_id', teamId)
        .is('removed_at', null); // Only get members who haven't been removed

      if (membersError) {
        console.error('Error fetching team members:', membersError);
      }

      console.log('Team members data:', membersData?.length, 'members');

      // Fetch user profiles separately
      const userIds = membersData?.map((m: any) => m.user_id) || [];
      console.log('Fetching profiles for user IDs:', userIds);

      const { data: profilesData, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, display_name, avatar_url, preferred_position')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      console.log('Profiles data:', profilesData?.length, 'profiles');
      console.log('First profile:', profilesData?.[0]);

      const profilesMap = new Map(profilesData?.map((p: any) => [p.id, p]) || []);
      console.log('Profiles map size:', profilesMap.size);

      // Fetch member stats
      const memberIds = membersData?.map((m: any) => m.user_id) || [];
      const { data: statsData } = await supabase
        .from('player_stats')
        .select('player_id, goals, assists')
        .in('player_id', memberIds);

      const statsMap = new Map();
      statsData?.forEach((stat: any) => {
        const existing = statsMap.get(stat.player_id) || { matches_played: 0, goals: 0, assists: 0 };
        statsMap.set(stat.player_id, {
          matches_played: existing.matches_played + 1,
          goals: existing.goals + (stat.goals || 0),
          assists: existing.assists + (stat.assists || 0),
        });
      });

      const members: TeamMember[] = membersData?.map((member: any) => {
        const profile = profilesMap.get(member.user_id);
        console.log('Mapping member:', member.user_id, 'Profile found:', !!profile, profile);
        return {
          id: member.id,
          user_id: member.user_id,
          position: profile?.preferred_position || null,
          jersey_number: member.jersey_number,
          is_captain: false, // Captain info not available in team_members table
          user_profile: {
            display_name: profile?.display_name || 'Unknown',
            avatar_url: profile?.avatar_url,
          },
          stats: statsMap.get(member.user_id) || { matches_played: 0, goals: 0, assists: 0 },
        };
      }) || [];

      console.log('Final members array:', members.length, 'members');

      // Separate recent and upcoming matches
      const { data: allMatches } = await supabase
        .from('matches')
        .select('*')
        .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
        .order('match_date', { ascending: false })
        .limit(20);

      const recent = allMatches?.filter((m) => m.status === 'completed') || [];
      const upcoming = allMatches?.filter((m) => m.status === 'scheduled') || [];

      // Check user role
      let userRole: UserRole | null = null;
      if (userId) {
        const userMember = members.find((m) => m.user_id === userId);
        if (userMember) {
          // Check if user is captain based on team's captain_id OR member's is_captain flag
          const isCaptain = teamData.captain_id === userId || userMember.is_captain;
          userRole = {
            isCaptain,
            position: userMember.position,
            jerseyNumber: userMember.jersey_number,
          };
        }
      }

      setData({
        team,
        stats,
        members,
        matches: { recent, upcoming },
        userRole,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Error loading team data:', error);
      setData((prev) => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to load team data',
      }));
    }
  };

  useEffect(() => {
    loadTeamData();
  }, [teamId, userId]);

  const leaveTeam = async (): Promise<{ success: boolean; error?: string }> => {
    if (!teamId || !userId) {
      return { success: false, error: 'Missing team or user information' };
    }

    // Check if user is captain - captains cannot leave
    if (data.userRole?.isCaptain) {
      return { success: false, error: 'Team captains cannot leave the team. Transfer captaincy first.' };
    }

    try {
      // Delete the team_members record
      const { error: deleteError } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', userId);

      if (deleteError) {
        console.error('Error leaving team:', deleteError);
        return { success: false, error: 'Failed to leave team' };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error leaving team:', error);
      return { success: false, error: error.message || 'Failed to leave team' };
    }
  };

  return {
    ...data,
    refetch: loadTeamData,
    leaveTeam,
  };
};

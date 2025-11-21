import { useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { MatchDetails, MatchEvent, TeamLineup, MatchData } from '../types/match.types';

export const useMatchDetails = (matchId: string | undefined) => {
  const [data, setData] = useState<MatchData>({
    match: null,
    events: [],
    homeLineup: null,
    awayLineup: null,
    loading: true,
    error: null,
  });

  const loadMatchDetails = useCallback(async () => {
    if (!matchId) {
      setData((prev) => ({ ...prev, loading: false, error: 'Match ID is required' }));
      return;
    }

    try {
      setData((prev) => ({ ...prev, loading: true, error: null }));

      // Fetch match details with teams and season/league info
      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .select(`
          *,
          home_team:teams!matches_home_team_id_fkey(id, name, team_color),
          away_team:teams!matches_away_team_id_fkey(id, name, team_color),
          seasons(id, name, leagues(id, name))
        `)
        .eq('id', matchId)
        .single();

      if (matchError) throw matchError;

      // Fetch team logos
      const teamIds = [matchData.home_team_id, matchData.away_team_id];
      console.log('Fetching logos for team IDs:', teamIds);

      const { data: mediaData, error: mediaError } = await supabase
        .from('media')
        .select('team_id, storage_path, context_type')
        .in('team_id', teamIds)
        .eq('context_type', 'team_logo')
        .order('created_at', { ascending: false });

      console.log('Media data result:', mediaData, 'Error:', mediaError);

      // Create logo map
      const logoMap = new Map<string, string>();
      mediaData?.forEach((media: any) => {
        if (!logoMap.has(media.team_id) && media.storage_path) {
          const { data: urlData } = supabase.storage
            .from('team-logos')
            .getPublicUrl(media.storage_path);

          console.log('Logo URL for team', media.team_id, ':', urlData?.publicUrl);

          if (urlData?.publicUrl) {
            logoMap.set(media.team_id, `${urlData.publicUrl}?t=${Date.now()}`);
          }
        }
      });

      console.log('Final logo map:', Array.from(logoMap.entries()));

      const match: MatchDetails = {
        ...matchData,
        home_team: {
          ...matchData.home_team,
          logo_url: logoMap.get(matchData.home_team_id),
        },
        away_team: {
          ...matchData.away_team,
          logo_url: logoMap.get(matchData.away_team_id),
        },
      };

      // Fetch match events
      const { data: eventsData, error: eventsError } = await supabase
        .from('match_events')
        .select(`
          *,
          team:teams(id, name, team_color)
        `)
        .eq('match_id', matchId)
        .order('event_time', { ascending: true });

      if (eventsError) {
        console.error('Error loading match events:', eventsError);
      }

      console.log('Raw events data:', JSON.stringify(eventsData, null, 2));

      // Fetch player names for events
      let events: MatchEvent[] = [];
      if (eventsData && eventsData.length > 0) {
        const playerIds = [...new Set(eventsData.flatMap((e: any) =>
          [e.player_id, e.assist_player_id].filter(Boolean)
        ))];

        console.log('Player IDs from events:', playerIds);

        // First try to fetch from user_profiles (if player_id is user_id)
        const { data: playersData } = await supabase
          .from('user_profiles')
          .select('id, display_name, full_name')
          .in('id', playerIds);

        console.log('Direct user_profiles lookup result:', playersData);

        let playersMap = new Map(playersData?.map((p: any) => [p.id, p]) || []);

        // If some players not found, try fetching via team_members joined with auth.users
        const missingPlayerIds = playerIds.filter(id => !playersMap.has(id));
        console.log('Missing player IDs:', missingPlayerIds);

        if (missingPlayerIds.length > 0) {
          // Query team_members with users table (for email fallback only)
          const { data: teamMembersData, error: tmError } = await supabase
            .from('team_members')
            .select('id, user_id, users(id, email)')
            .in('user_id', missingPlayerIds)
            .is('removed_at', null); // Only get active team members

          console.log('Team members lookup:', JSON.stringify(teamMembersData, null, 2), 'Error:', tmError);
          console.log('Team members count:', teamMembersData?.length);

          if (!tmError && teamMembersData && teamMembersData.length > 0) {
            // Also fetch user_profiles for these user_ids
            const userIdsFromTm = teamMembersData.map((tm: any) => tm.user_id).filter(Boolean);
            console.log('User IDs to fetch profiles for:', userIdsFromTm);

            const { data: profilesData } = await supabase
              .from('user_profiles')
              .select('id, display_name, full_name')
              .in('id', userIdsFromTm);

            console.log('User profiles for team members:', JSON.stringify(profilesData, null, 2));

            // Create a map of user_id to profile
            const profilesMap = new Map(profilesData?.map((p: any) => [p.id, p]) || []);

            teamMembersData.forEach((tm: any) => {
              const profile = profilesMap.get(tm.user_id);
              const authUser = tm.users;

              // For full_name: use user_profiles.full_name, fallback to email username
              // For display_name: use user_profiles.display_name, fallback to full_name or email
              const fullName = profile?.full_name || authUser?.email?.split('@')[0] || 'Unknown';
              const displayNameValue = profile?.display_name || profile?.full_name || authUser?.email?.split('@')[0] || 'Unknown';

              console.log('Processing team member:', {
                user_id: tm.user_id,
                'profile.full_name': profile?.full_name,
                'profile.display_name': profile?.display_name,
                'authUser.email': authUser?.email,
                finalFullName: fullName,
                finalDisplayName: displayNameValue
              });

              if (profile || authUser) {
                playersMap.set(tm.user_id, {
                  id: tm.user_id,
                  display_name: displayNameValue,
                  full_name: fullName,
                });
              }
            });
            console.log('Final players map after team_members lookup:', Array.from(playersMap.entries()));
          } else {
            console.log('No team members found or error occurred');
          }
        }

        events = eventsData.map((event: any) => {
          const player = playersMap.get(event.player_id);
          const assistPlayer = event.assist_player_id ? playersMap.get(event.assist_player_id) : null;

          console.log('Mapping event:', event.id, 'Player ID:', event.player_id, 'Found player:', player);

          // Fallback name when player not found: use description, or team name player
          const fallbackName = event.description || `${event.team?.name || 'Team'} Player`;

          return {
            id: event.id,
            match_id: event.match_id,
            team_id: event.team_id,
            player_id: event.player_id,
            event_type: event.event_type,
            event_time: event.event_time,
            description: event.description,
            player: {
              id: event.player_id,
              display_name: player?.display_name || fallbackName,
              full_name: player?.full_name,
            },
            team: {
              id: event.team?.id || event.team_id,
              name: event.team?.name || 'Unknown',
              team_color: event.team?.team_color,
            },
            assist_player_id: event.assist_player_id,
            assist_player: assistPlayer ? {
              id: assistPlayer.id,
              display_name: assistPlayer.display_name,
              full_name: assistPlayer.full_name,
            } : undefined,
          };
        });
      }

      // Fetch lineups from match_participants
      const { data: participantsData, error: participantsError } = await supabase
        .from('match_participants')
        .select(`
          *,
          user_profiles(id, display_name, full_name)
        `)
        .eq('match_id', matchId);

      let homeLineup: TeamLineup | null = null;
      let awayLineup: TeamLineup | null = null;

      if (!participantsError && participantsData && participantsData.length > 0) {
        const homePlayers = participantsData
          .filter((p: any) => p.team_id === matchData.home_team_id)
          .map((p: any) => ({
            id: p.id,
            user_id: p.user_id,
            position: p.position,
            jersey_number: p.jersey_number,
            is_starter: p.is_starter || false,
            is_captain: p.is_captain || false,
            player_name: p.user_profiles?.display_name || p.user_profiles?.full_name || 'Unknown',
          }));

        const awayPlayers = participantsData
          .filter((p: any) => p.team_id === matchData.away_team_id)
          .map((p: any) => ({
            id: p.id,
            user_id: p.user_id,
            position: p.position,
            jersey_number: p.jersey_number,
            is_starter: p.is_starter || false,
            is_captain: p.is_captain || false,
            player_name: p.user_profiles?.display_name || p.user_profiles?.full_name || 'Unknown',
          }));

        if (homePlayers.length > 0) {
          homeLineup = {
            team_id: matchData.home_team_id,
            team_name: matchData.home_team.name,
            starters: homePlayers.filter((p: any) => p.is_starter),
            substitutes: homePlayers.filter((p: any) => !p.is_starter),
          };
        }

        if (awayPlayers.length > 0) {
          awayLineup = {
            team_id: matchData.away_team_id,
            team_name: matchData.away_team.name,
            starters: awayPlayers.filter((p: any) => p.is_starter),
            substitutes: awayPlayers.filter((p: any) => !p.is_starter),
          };
        }
      }

      setData({
        match,
        events,
        homeLineup,
        awayLineup,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Error loading match details:', error);
      setData((prev) => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to load match details',
      }));
    }
  }, [matchId]);

  return {
    ...data,
    refetch: loadMatchDetails,
  };
};

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

export interface LeagueData {
  id: string;
  name: string;
  description: string | null;
  sport_type: string;
  league_type: string;
  location: string | null;
  logo_url: string | null;
  teamCount: number;
  is_active: boolean;
  season_start: string | null;
  season_end: string | null;
}

export interface UserLeagueData extends LeagueData {
  userTeams: {
    teamId: string;
    teamName: string;
    position?: number;
    points?: number;
  }[];
}

export interface LeaguesDataHook {
  myLeagues: UserLeagueData[];
  exploreLeagues: LeagueData[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useLeaguesData = (userId: string | undefined): LeaguesDataHook => {
  const [data, setData] = useState<{
    myLeagues: UserLeagueData[];
    exploreLeagues: LeagueData[];
    loading: boolean;
    error: string | null;
  }>({
    myLeagues: [],
    exploreLeagues: [],
    loading: true,
    error: null,
  });

  const loadLeaguesData = useCallback(async () => {
    try {
      setData((prev) => ({ ...prev, loading: true, error: null }));

      console.log('🏆 Loading leagues data...');

      // Fetch all public, active leagues
      const { data: leaguesData, error: leaguesError } = await supabase
        .from('leagues')
        .select('id, name, description, sport_type, league_type, location, is_active, is_public, season_start, season_end')
        .order('name');

      console.log('📋 All leagues (before filtering):', leaguesData?.length || 0);
      console.log('🔍 First league:', leaguesData?.[0]);

      // Log each league's public/active status for debugging
      leaguesData?.forEach((league, index) => {
        console.log(`League ${index + 1}: ${league.name} - is_public: ${league.is_public}, is_active: ${league.is_active}`);
      });

      if (leaguesError) {
        console.error('❌ Error fetching leagues:', leaguesError);
        throw leaguesError;
      }

      console.log('📊 Fetched leagues:', leaguesData?.length || 0);

      // Get league IDs to fetch icons
      const leagueIds = leaguesData?.map((l) => l.id) || [];

      console.log('🎨 League IDs to fetch icons for:', leagueIds.length);

      // Fetch league icons by league_id (not logo_media_id)
      // This matches the admin app's approach and works even when logo_media_id is NULL
      let mediaMap = new Map<string, string>();
      if (leagueIds.length > 0) {
        console.log('📸 Fetching media data for league IDs:', leagueIds);

        const { data: mediaData, error: mediaError } = await supabase
          .from('media')
          .select('id, league_id, storage_path, filename, context_type')
          .in('league_id', leagueIds)
          .eq('context_type', 'league_icon')
          .order('created_at', { ascending: false });

        console.log('📸 Media query result:', {
          count: mediaData?.length || 0,
          error: mediaError,
          data: mediaData
        });

        // Generate public URLs from storage paths, grouped by league_id
        mediaData?.forEach((media) => {
          console.log(`🖼️ Processing media ${media.id} for league ${media.league_id}:`, {
            storage_path: media.storage_path,
            filename: media.filename,
            context_type: media.context_type
          });

          // The storage_path contains the path within the bucket
          // For league_icon, the bucket is 'league-icons'
          const pathToUse = media.storage_path || media.filename;

          if (pathToUse && media.league_id) {
            // Determine the bucket based on context_type
            let bucket = 'media'; // default bucket
            if (media.context_type === 'league_icon') {
              bucket = 'league-icons';
            } else if (media.context_type === 'team_logo') {
              bucket = 'team-logos';
            } else if (media.context_type === 'user_profile') {
              bucket = 'user-avatars';
            }

            console.log(`🗂️ Using bucket: ${bucket}, path: ${pathToUse}`);

            const { data: urlData } = supabase.storage
              .from(bucket)
              .getPublicUrl(pathToUse);

            console.log(`🌐 Generated URL: ${urlData?.publicUrl}`);

            if (urlData?.publicUrl && !urlData.publicUrl.includes('undefined')) {
              // Add cache-busting timestamp to ensure fresh images
              const urlWithCache = `${urlData.publicUrl}?t=${Date.now()}`;
              // Map by league_id instead of media.id
              mediaMap.set(media.league_id, urlWithCache);
              console.log(`✅ Added to mediaMap: league ${media.league_id} -> ${urlWithCache}`);
            } else {
              console.log(`⚠️ No valid public URL generated for ${media.id}`);
            }
          } else {
            console.log(`⚠️ Missing storage info or league_id for ${media.id}`);
          }
        });
      } else {
        console.log('⚠️ No leagues to fetch icons for');
      }

      console.log('📊 Final mediaMap size:', mediaMap.size);
      console.log('📊 MediaMap entries:', Array.from(mediaMap.entries()));

      // Get team counts per league
      const { data: seasonTeamsData } = await supabase
        .from('season_teams')
        .select('team_id, seasons(league_id)')
        .not('seasons', 'is', null);

      const teamCountMap = new Map<string, number>();
      seasonTeamsData?.forEach((st: any) => {
        const leagueId = st.seasons?.league_id;
        if (leagueId) {
          teamCountMap.set(leagueId, (teamCountMap.get(leagueId) || 0) + 1);
        }
      });

      // Get user's leagues if userId is provided
      let userLeagueIds = new Set<string>();
      const userLeagueTeamsMap = new Map<string, UserLeagueData['userTeams']>();

      if (userId) {
        // Get user's teams (only where user hasn't been removed)
        const { data: userTeamsData } = await supabase
          .from('team_members')
          .select('team_id, teams(id, name)')
          .eq('user_id', userId)
          .is('removed_at', null); // Only get teams where user hasn't been removed

        const teamIds = userTeamsData?.map((tm: any) => tm.team_id) || [];

        if (teamIds.length > 0) {
          // Get seasons for user's teams
          const { data: userSeasonTeamsData } = await supabase
            .from('season_teams')
            .select('team_id, season_id, seasons(league_id, id)')
            .in('team_id', teamIds);

          // Get standings for user's teams
          const seasonIds = userSeasonTeamsData?.map((st: any) => st.season_id) || [];
          let standingsMap = new Map<string, { position: number; points: number }>();

          if (seasonIds.length > 0) {
            const { data: standingsData } = await supabase
              .from('season_standings')
              .select('team_id, position, points')
              .in('season_id', seasonIds)
              .in('team_id', teamIds);

            standingsMap = new Map(
              standingsData?.map((s) => [s.team_id, { position: s.position, points: s.points }]) || []
            );
          }

          // Group teams by league
          userSeasonTeamsData?.forEach((st: any) => {
            const leagueId = st.seasons?.league_id;
            if (leagueId) {
              userLeagueIds.add(leagueId);

              const team = userTeamsData?.find((t: any) => t.team_id === st.team_id);
              const standings = standingsMap.get(st.team_id);

              if (team) {
                const teams = userLeagueTeamsMap.get(leagueId) || [];
                teams.push({
                  teamId: st.team_id,
                  teamName: team.teams?.name || 'Unknown',
                  position: standings?.position,
                  points: standings?.points,
                });
                userLeagueTeamsMap.set(leagueId, teams);
              }
            }
          });
        }
      }

      // Transform leagues data
      const myLeagues: UserLeagueData[] = [];
      const exploreLeagues: LeagueData[] = [];

      // Filter for public and active leagues
      // TEMPORARY: Showing all leagues for debugging
      const filteredLeagues = leaguesData || [];
      console.log('🔒 Filtered public & active leagues:', filteredLeagues.length);
      console.log('⚠️  TEMPORARY: Showing ALL leagues regardless of is_public/is_active status');

      filteredLeagues.forEach((league) => {
        const logoUrl = mediaMap.get(league.id) || null;

        console.log(`🏆 Processing league "${league.name}":`, {
          league_id: league.id,
          logo_url_assigned: logoUrl,
          found_in_map: mediaMap.has(league.id)
        });

        const leagueData: LeagueData = {
          id: league.id,
          name: league.name,
          description: league.description,
          sport_type: league.sport_type,
          league_type: league.league_type,
          location: league.location,
          logo_url: logoUrl,
          teamCount: teamCountMap.get(league.id) || 0,
          is_active: league.is_active || false,
          season_start: league.season_start,
          season_end: league.season_end,
        };

        if (userLeagueIds.has(league.id)) {
          myLeagues.push({
            ...leagueData,
            userTeams: userLeagueTeamsMap.get(league.id) || [],
          });
        } else {
          exploreLeagues.push(leagueData);
        }
      });

      console.log('✅ My leagues:', myLeagues.length);
      console.log('🔍 Explore leagues:', exploreLeagues.length);

      setData({
        myLeagues,
        exploreLeagues,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('❌ Error loading leagues data:', error);
      setData((prev) => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to load leagues data',
      }));
    }
  }, [userId]); // Add userId as dependency since it's used in the function

  useEffect(() => {
    loadLeaguesData();
  }, [loadLeaguesData]);

  return {
    ...data,
    refetch: loadLeaguesData,
  };
};

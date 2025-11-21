import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  AppState,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { TeamCard } from '../components/teams/TeamCard';

interface Team {
  id: string;
  name: string;
  league_id: string | null;
  team_color?: string | null;
  logo_url?: string | null;
  leagues?: {
    id: string;
    name: string;
    league_type: string;
  };
}

interface TeamMember {
  team_id: string;
  teams: Team;
}

export const MyTeamsScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasTeamsWithoutLeagues, setHasTeamsWithoutLeagues] = useState(false);

  const loadTeams = async () => {
    if (!user) return;

    try {
      // First, get user's teams with team_color (only where user hasn't been removed)
      const { data: teamMembersData, error: teamMembersError } = await supabase
        .from('team_members')
        .select('team_id, teams(id, name, league_id, team_color)')
        .eq('user_id', user.id)
        .is('removed_at', null); // Only get teams where user hasn't been removed

      if (teamMembersError) throw teamMembersError;

      // Extract all teams
      const allTeams = teamMembersData?.map((tm: any) => tm.teams).filter(Boolean) || [];

      if (allTeams.length === 0) {
        setTeams([]);
        setHasTeamsWithoutLeagues(false);
        return;
      }

      // Fetch team logos by team_id (not logo_media_id) - same pattern as league icons
      const teamIds = allTeams.map((t: any) => t.id);
      const { data: mediaData } = await supabase
        .from('media')
        .select('team_id, storage_path, context_type')
        .in('team_id', teamIds)
        .eq('context_type', 'team_logo')
        .order('created_at', { ascending: false });

      // Create a map of team logos (most recent per team)
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

      // Add logo URLs to teams
      const teamsWithLogos = allTeams.map((team: any) => ({
        ...team,
        logo_url: logoMap.get(team.id) || null
      }));

      // Separate teams with and without leagues
      const teamsWithLeagueIds = teamsWithLogos.filter((team: any) => team && team.league_id);
      const teamsWithoutLeagues = teamsWithLogos.filter((team: any) => team && !team.league_id);

      setHasTeamsWithoutLeagues(teamsWithoutLeagues.length > 0);

      // If there are teams with leagues, fetch the league data
      if (teamsWithLeagueIds.length > 0) {
        // Get unique league IDs
        const leagueIds = [...new Set(teamsWithLeagueIds.map((team: any) => team.league_id))];

        // Fetch league data separately
        const { data: leaguesData, error: leaguesError } = await supabase
          .from('leagues')
          .select('id, name, league_type')
          .in('id', leagueIds);

        if (leaguesError) throw leaguesError;

        // Create a map of league data
        const leaguesMap = new Map(leaguesData?.map((league: any) => [league.id, league]) || []);

        // Combine teams with their league data
        const teamsWithLeagueData = teamsWithLeagueIds.map((team: any) => ({
          ...team,
          leagues: leaguesMap.get(team.league_id)
        }));

        // Combine all teams (with and without leagues)
        setTeams([...teamsWithLeagueData, ...teamsWithoutLeagues]);
      } else {
        // Only teams without leagues
        setTeams(teamsWithoutLeagues);
      }
    } catch (error: any) {
      console.error('Error loading teams:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTeams();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadTeams();
  };

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadTeams();
    }, [])
  );

  // Auto-refresh when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        loadTeams();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <Text style={styles.title}>My Teams</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{teams.length}</Text>
              </View>
            </View>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.joinButton}
              onPress={() => navigation.navigate('JoinTeam', {})}
            >
              <Text style={styles.joinButtonText}>Join</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate('CreateTeam')}
            >
              <Text style={styles.createButtonText}>+ Create</Text>
            </TouchableOpacity>
          </View>
        </View>

        {teams.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>No Teams Yet</Text>
            <Text style={styles.emptyText}>
              You haven't joined any teams. Contact a league administrator to get added to a team.
            </Text>
          </View>
        ) : (
          <View style={styles.teamsList}>
            {teams.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                onPress={() => navigation.navigate('TeamDetails', { teamId: team.id })}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 32,
  },
  headerTop: {
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  joinButton: {
    flex: 1,
    backgroundColor: '#333',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  joinButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
  },
  createButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
  },
  badge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#333',
    marginTop: 40,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#333',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },
  teamsList: {
    gap: 16,
  },
});

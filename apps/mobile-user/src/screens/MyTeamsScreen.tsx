import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useQuery } from '@tanstack/react-query';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { PlayerService, TeamMembership } from '../services/PlayerService';
import { CreateTeamModal } from '../components/CreateTeamModal';

const TeamCard: React.FC<{ team: TeamMembership; onViewTeam: (teamId: string, teamName: string) => void }> = ({ team, onViewTeam }) => {
  const getTeamColorIcon = (color?: string) => {
    if (!color) return '⚽';
    const colorMap: { [key: string]: string } = {
      blue: '🔵',
      red: '🔴',
      green: '🟢',
      yellow: '🟡',
      orange: '🟠',
      purple: '🟣',
      black: '⚫',
      white: '⚪',
    };
    return colorMap[color.toLowerCase()] || '⚽';
  };

  const getLeagueTypeEmoji = (type: string) => {
    switch (type.toLowerCase()) {
      case 'competitive': return '🏆';
      case 'casual': return '⚽';
      case 'friendly': return '🤝';
      default: return '🎯';
    }
  };

  return (
    <View style={styles.teamCard}>
      <View style={styles.teamHeader}>
        <View style={styles.teamInfo}>
          <Text style={styles.teamName}>
            {getTeamColorIcon(team.teamColor)} {team.teamName}
          </Text>
          <Text style={styles.leagueInfo}>
            {getLeagueTypeEmoji(team.league.leagueType)} {team.league.name}
          </Text>
        </View>
        <View style={styles.jerseyNumber}>
          <Text style={styles.jerseyText}>#{team.jerseyNumber || '??'}</Text>
        </View>
      </View>

      <View style={styles.playerInfo}>
        <View style={styles.playerDetail}>
          <Text style={styles.detailLabel}>Position:</Text>
          <Text style={styles.detailValue}>{team.position || 'Not set'}</Text>
        </View>
        <View style={styles.playerDetail}>
          <Text style={styles.detailLabel}>Joined:</Text>
          <Text style={styles.detailValue}>
            {new Date(team.joinedAt).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.playerDetail}>
          <Text style={styles.detailLabel}>Sport:</Text>
          <Text style={styles.detailValue}>
            {team.league.sportType.charAt(0).toUpperCase() + team.league.sportType.slice(1)}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.viewTeamButton}
        onPress={() => onViewTeam(team.teamId, team.teamName)}
      >
        <Text style={styles.viewTeamButtonText}>View Team Details</Text>
      </TouchableOpacity>
    </View>
  );
};

type RootStackParamList = {
  TeamDetails: { teamId: string; teamName: string };
  ExploreLeaguesTab: undefined;
};

export const MyTeamsScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);

  const { data: teams, isLoading, refetch } = useQuery({
    queryKey: ['team-memberships', user?.id],
    queryFn: () => PlayerService.getInstance().getTeamMemberships(user!.id),
    enabled: !!user?.id,
  });

  const onRefresh = () => {
    refetch();
  };

  const handleTeamCreated = () => {
    refetch(); // Refresh the teams list after creating a new team
  };

  const handleViewTeamDetails = (teamId: string, teamName: string) => {
    navigation.navigate('TeamDetails', { teamId, teamName });
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading your teams...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>My Teams</Text>
          <Text style={styles.subtitle}>
            {teams && teams.length > 0
              ? `${teams.length} team${teams.length !== 1 ? 's' : ''}`
              : 'Your league memberships'}
          </Text>
          <TouchableOpacity
            style={styles.createTeamButton}
            onPress={() => setShowCreateTeamModal(true)}
          >
            <Text style={styles.createTeamButtonText}>+ Create Team</Text>
          </TouchableOpacity>
        </View>

        {teams && teams.length > 0 ? (
          teams.map((team) => <TeamCard key={team.teamId} team={team} onViewTeam={handleViewTeamDetails} />)
        ) : !isLoading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>⚽</Text>
            <Text style={styles.emptyTitle}>No Teams Yet</Text>
            <Text style={styles.emptySubtext}>
              You haven't joined any teams yet. Create your own team or explore existing leagues to join!
            </Text>
            <View style={styles.emptyButtonContainer}>
              <TouchableOpacity
                style={styles.createTeamButtonSecondary}
                onPress={() => setShowCreateTeamModal(true)}
              >
                <Text style={styles.createTeamButtonSecondaryText}>Create Team</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.exploreButton}
                onPress={() => navigation.navigate('ExploreLeaguesTab' as never)}
              >
                <Text style={styles.exploreButtonText}>Explore Leagues</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* Create Team Modal */}
      {user && (
        <CreateTeamModal
          visible={showCreateTeamModal}
          onClose={() => setShowCreateTeamModal(false)}
          onTeamCreated={handleTeamCreated}
          userId={user.id}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
  },
  createTeamButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  createTeamButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  teamCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  teamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  leagueInfo: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '500',
  },
  jerseyNumber: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 50,
    alignItems: 'center',
  },
  jerseyText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  playerInfo: {
    padding: 20,
    paddingBottom: 16,
  },
  playerDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  viewTeamButton: {
    backgroundColor: '#2563eb',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewTeamButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    backgroundColor: 'white',
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emptyButtonContainer: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  createTeamButtonSecondary: {
    backgroundColor: '#10b981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createTeamButtonSecondaryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  exploreButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  exploreButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
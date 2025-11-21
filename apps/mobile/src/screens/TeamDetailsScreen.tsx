import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { TabView, TabBar, SceneRendererProps, NavigationState, Route } from 'react-native-tab-view';
import { useAuth } from '../contexts/AuthContext';
import { useTeamData } from '../hooks/useTeamData';
import { useRemoveTeamMember } from '../hooks/useRemoveTeamMember';
import { TeamHeader } from '../components/team/TeamHeader';
import { OverviewTab } from '../components/team/OverviewTab';
import { RosterTab } from '../components/team/RosterTab';
import { TeamMediaTab } from '../components/team/TeamMediaTab';
import { TeamInviteModal } from '../components/team/TeamInviteModal';
import { supabase } from '../../lib/supabase';

export const TeamDetailsScreen = ({ route, navigation }: any) => {
  const { teamId } = route.params;
  const { user } = useAuth();
  const { team, stats, members, userRole, loading, error, refetch, leaveTeam } = useTeamData(teamId, user?.id);
  const { removePlayer, loading: removingPlayer } = useRemoveTeamMember();
  const [refreshing, setRefreshing] = React.useState(false);
  const [isCaptain, setIsCaptain] = React.useState(false);
  const [showInviteModal, setShowInviteModal] = React.useState(false);
  const [isLeaving, setIsLeaving] = React.useState(false);
  const layout = useWindowDimensions();

  const [index, setIndex] = React.useState(0);
  const [routes] = React.useState([
    { key: 'overview', title: 'Overview' },
    { key: 'roster', title: 'Roster' },
    { key: 'media', title: 'Media' },
  ]);

  // Check if current user is captain
  React.useEffect(() => {
    const checkCaptain = async () => {
      if (!user || !teamId) return;

      const { data, error } = await supabase
        .from('teams')
        .select('captain_id')
        .eq('id', teamId)
        .single();

      if (!error && data) {
        setIsCaptain(data.captain_id === user.id);
      }
    };

    checkCaptain();
  }, [user, teamId]);

  const handleLeaveTeam = () => {
    if (userRole?.isCaptain) {
      Alert.alert(
        'Cannot Leave',
        'Team captains cannot leave the team. Transfer captaincy to another member first.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Leave Team',
      `Are you sure you want to leave ${team?.name || 'this team'}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            setIsLeaving(true);
            const result = await leaveTeam();
            setIsLeaving(false);

            if (result.success) {
              Alert.alert('Success', 'You have left the team.', [
                {
                  text: 'OK',
                  onPress: () => navigation.goBack(),
                },
              ]);
            } else {
              Alert.alert('Error', result.error || 'Failed to leave team');
            }
          },
        },
      ]
    );
  };

  // Set up header with settings/leave buttons
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerButtons}>
          {!userRole?.isCaptain && userRole && (
            <TouchableOpacity
              style={styles.leaveButton}
              onPress={handleLeaveTeam}
              disabled={isLeaving}
            >
              <Text style={styles.leaveButtonText}>{isLeaving ? 'Leaving...' : 'Leave'}</Text>
            </TouchableOpacity>
          )}
          {isCaptain && (
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => navigation.navigate('EditTeam', { teamId })}
            >
              <Text style={styles.settingsButtonText}>Settings</Text>
            </TouchableOpacity>
          )}
        </View>
      ),
    });
  }, [navigation, isCaptain, teamId, userRole, team?.name, isLeaving]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleRemoveMember = async (memberId: string) => {
    console.log('👤 TeamDetailsScreen - Remove member requested:', { memberId, teamId });

    if (removingPlayer) {
      console.log('⏳ TeamDetailsScreen - Already removing a player, ignoring request');
      return; // Prevent multiple simultaneous removals
    }

    Alert.alert(
      'Remove Player',
      'Are you sure you want to remove this player from the team?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => console.log('❌ TeamDetailsScreen - User cancelled removal')
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            console.log('✅ TeamDetailsScreen - User confirmed removal, calling removePlayer');
            const result = await removePlayer(teamId, memberId);

            console.log('📊 TeamDetailsScreen - Remove result:', result);

            if (result.success) {
              console.log('🔄 TeamDetailsScreen - Refreshing team data');
              await refetch(); // Refresh team data
              console.log('✅ TeamDetailsScreen - Team data refreshed, showing success alert');
              Alert.alert('Success', 'Player removed from team');
            } else {
              console.error('❌ TeamDetailsScreen - Remove failed:', result.error);
              Alert.alert('Error', result.error || 'Failed to remove player');
            }
          },
        },
      ]
    );
  };

  const renderScene = React.useCallback(
    ({ route }: SceneRendererProps & { route: Route }) => {
      switch (route.key) {
        case 'overview':
          return <OverviewTab stats={stats} playerCount={members.length} />;
        case 'roster':
          return (
            <RosterTab
              members={members}
              isCaptain={userRole?.isCaptain || false}
              onInvitePlayer={() => {
                setShowInviteModal(true);
              }}
              onRemoveMember={handleRemoveMember}
            />
          );
        case 'media':
          return (
            <TeamMediaTab
              teamId={teamId}
              teamName={team?.name || 'Team'}
              canUpload={isCaptain}
            />
          );
        default:
          return null;
      }
    },
    [stats, members, userRole, teamId, team?.name, isCaptain, handleRemoveMember]
  );

  const renderTabBar = (props: any) => (
    <TabBar
      {...props}
      indicatorStyle={styles.tabIndicator}
      style={styles.tabBar}
      labelStyle={styles.tabLabel}
      activeColor="#3b82f6"
      inactiveColor="#999"
    />
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (error || !team) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Team not found'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TeamHeader team={team} userRole={userRole} />
      </View>

      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        renderTabBar={renderTabBar}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        lazy={false}
      />

      <TeamInviteModal
        visible={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        teamId={teamId}
        teamName={team?.name || 'Team'}
      />
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
  errorContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
  },
  headerContainer: {
    padding: 20,
    paddingTop: 10,
  },
  tabBar: {
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  tabIndicator: {
    backgroundColor: '#3b82f6',
    height: 3,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  settingsButton: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
  },
  settingsButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  leaveButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  leaveButtonText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
});

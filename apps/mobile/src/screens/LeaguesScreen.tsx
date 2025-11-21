import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  AppState,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useLeaguesData, LeagueData, UserLeagueData } from '../hooks/useLeaguesData';
import { MyLeaguesSection } from '../components/leagues/MyLeaguesSection';
import { ExploreSection } from '../components/leagues/ExploreSection';
import { JoinLeagueModal } from '../components/leagues/JoinLeagueModal';

export const LeaguesScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const { myLeagues, exploreLeagues, loading, error, refetch } = useLeaguesData(user?.id);
  const [refreshing, setRefreshing] = React.useState(false);
  const [selectedLeague, setSelectedLeague] = React.useState<LeagueData | null>(null);
  const [joinModalVisible, setJoinModalVisible] = React.useState(false);

  // Debug log to see what data is being passed to components
  React.useEffect(() => {
    console.log('📱 LeaguesScreen received data:', {
      myLeagues: myLeagues.map(l => ({
        id: l.id,
        name: l.name,
        logo_url: l.logo_url,
        has_logo_url: !!l.logo_url
      })),
      exploreLeagues: exploreLeagues.map(l => ({
        id: l.id,
        name: l.name,
        logo_url: l.logo_url,
        has_logo_url: !!l.logo_url
      }))
    });
  }, [myLeagues, exploreLeagues]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  // Auto-refresh when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        refetch();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [refetch]);

  const handleLeaguePress = (league: LeagueData | UserLeagueData) => {
    navigation.navigate('LeagueDetails', { leagueId: league.id });
  };

  const handleJoinLeague = (league: LeagueData) => {
    setSelectedLeague(league);
    setJoinModalVisible(true);
  };

  const handleJoinSuccess = async () => {
    // Refetch data to update the leagues list
    await refetch();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Leagues</Text>
      </View>

      {/* My Leagues Section */}
      <MyLeaguesSection leagues={myLeagues} onLeaguePress={handleLeaguePress} />

      {/* Explore Leagues Section */}
      <ExploreSection
        leagues={exploreLeagues}
        onLeaguePress={handleLeaguePress}
        onJoinLeague={handleJoinLeague}
      />

      {/* Join League Modal */}
      <JoinLeagueModal
        visible={joinModalVisible}
        league={selectedLeague}
        onClose={() => setJoinModalVisible(false)}
        onSuccess={handleJoinSuccess}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  content: {
    padding: 20,
    paddingTop: 60,
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
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
});

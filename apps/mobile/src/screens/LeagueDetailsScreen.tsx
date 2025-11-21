import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  AppState,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useLeagueDetails } from '../hooks/useLeagueDetails';
import { LeagueHeader } from '../components/league/LeagueHeader';
import { LeagueStatsCards } from '../components/league/LeagueStatsCards';
import { SeasonCard } from '../components/league/SeasonCard';
import { LeagueMediaSection } from '../components/league/LeagueMediaSection';

export const LeagueDetailsScreen = ({ route, navigation }: any) => {
  const { leagueId } = route.params;
  const { league, seasons, stats, loading, error, refetch } = useLeagueDetails(leagueId);
  const [refreshing, setRefreshing] = React.useState(false);

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

  const handleSeasonPress = (seasonId: string) => {
    navigation.navigate('SeasonDetails', { seasonId, leagueId });
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
        <TouchableOpacity style={styles.retryButton} onPress={refetch}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!league) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>League not found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
    >
      {/* League Header */}
      <LeagueHeader
        league={{
          id: league.id,
          name: league.name,
          description: league.description || undefined,
          sport_type: league.sport_type,
          league_type: league.league_type,
          location: league.location || undefined,
          logo_url: league.iconUrl || undefined,
        }}
      />

      {/* League Stats Cards */}
      <LeagueStatsCards stats={stats} />

      {/* Media Gallery Section */}
      <LeagueMediaSection leagueId={league.id} leagueName={league.name} />

      {/* Seasons Section */}
      <View style={styles.seasonsSection}>
        <Text style={styles.sectionTitle}>Seasons</Text>

        {seasons.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No seasons yet</Text>
            <Text style={styles.emptySubtext}>Seasons will appear here when they are created</Text>
          </View>
        ) : (
          <View style={styles.seasonsList}>
            {seasons.map((season) => (
              <SeasonCard
                key={season.id}
                season={{
                  id: season.id,
                  name: season.name,
                  season_year: new Date(season.start_date || Date.now()).getFullYear(),
                  status: season.status,
                  start_date: season.start_date || '',
                  end_date: season.end_date || '',
                  icon_url: undefined,
                  registered_teams_count: season.teamCount,
                }}
                onPress={() => handleSeasonPress(season.id)}
              />
            ))}
          </View>
        )}
      </View>
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
    paddingTop: 8,
    gap: 20,
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
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  seasonsSection: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  seasonsList: {
    gap: 0,
  },
  emptyContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

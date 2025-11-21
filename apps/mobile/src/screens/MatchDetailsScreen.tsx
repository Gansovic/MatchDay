import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  AppState,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useMatchDetails } from '../hooks/useMatchDetails';
import { MatchHeader } from '../components/match/MatchHeader';
import { MatchEventsTimeline } from '../components/match/MatchEventsTimeline';
import { TeamLineup } from '../components/match/TeamLineup';
import { useAuth } from '../contexts/AuthContext';

export const MatchDetailsScreen = ({ route }: any) => {
  const { matchId } = route.params;
  const navigation = useNavigation();
  const { user } = useAuth();
  const { match, events, homeLineup, awayLineup, loading, error, refetch } = useMatchDetails(matchId);
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    refetch();
  }, [matchId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [matchId])
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
  }, [matchId]);

  if (loading && !match) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (error || !match) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Unable to Load Match</Text>
        <Text style={styles.errorText}>{error || 'Match not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
        }
      >
        {/* Match Header */}
        <MatchHeader match={match} />

        {/* Match Media Button */}
        <TouchableOpacity
          style={styles.mediaButton}
          onPress={() =>
            navigation.navigate('MatchMedia' as never, {
              matchId: match.id,
              matchTitle: `${match.home_team?.name} vs ${match.away_team?.name}`,
              isAdmin: user?.role === 'admin' || user?.role === 'league_admin',
            } as never)
          }
        >
          <View style={styles.mediaButtonIcon}>
            <Ionicons name="images-outline" size={24} color="#3b82f6" />
          </View>
          <View style={styles.mediaButtonContent}>
            <Text style={styles.mediaButtonTitle}>Match Media</Text>
            <Text style={styles.mediaButtonSubtitle}>View photos and videos from this match</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>

        {/* Match Events Section */}
        {(match.status === 'completed' || match.status === 'live') && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIndicator} />
              <Text style={styles.sectionTitle}>Match Events</Text>
            </View>
            <MatchEventsTimeline
              events={events}
              homeTeamId={match.home_team_id}
              awayTeamId={match.away_team_id}
            />
          </View>
        )}

        {/* Lineups Section */}
        {(homeLineup || awayLineup) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIndicator} />
              <Text style={styles.sectionTitle}>Lineups</Text>
            </View>

            <View style={styles.lineupsContainer}>
              {homeLineup && (
                <View style={styles.lineupSection}>
                  <TeamLineup lineup={homeLineup} />
                </View>
              )}

              {awayLineup && (
                <View style={styles.lineupSection}>
                  <TeamLineup lineup={awayLineup} />
                </View>
              )}
            </View>
          </View>
        )}

        {/* Empty state if no events or lineups */}
        {match.status === 'scheduled' && !homeLineup && !awayLineup && events.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyTitle}>Match Not Started</Text>
            <Text style={styles.emptyText}>
              Events and lineups will appear here once the match begins.
            </Text>
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
  errorContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  mediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  mediaButtonIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  mediaButtonContent: {
    flex: 1,
  },
  mediaButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  mediaButtonSubtitle: {
    fontSize: 13,
    color: '#999',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIndicator: {
    width: 4,
    height: 20,
    backgroundColor: '#3b82f6',
    borderRadius: 2,
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  lineupsContainer: {
    gap: 16,
  },
  lineupSection: {
    marginBottom: 0,
  },
  emptyState: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 48,
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#333',
    marginTop: 20,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
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
});

import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  AppState,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { TabView, TabBar, SceneRendererProps, Route } from 'react-native-tab-view';
import { useSeasonDetails } from '../hooks/useSeasonDetails';
import { useStandings } from '../hooks/useStandings';
import { useSeasonMatches } from '../hooks/useSeasonMatches';
import { useSeasonLeaderboards } from '../hooks/useSeasonLeaderboards';
import { IconImage } from '../components/shared/IconImage';
import { HomeTab } from '../components/season/HomeTab';
import { MatchesTab } from '../components/season/MatchesTab';
import { StandingsTab } from '../components/season/StandingsTab';
import { LeaderboardsTab } from '../components/season/LeaderboardsTab';
import { MediaTab } from '../components/season/MediaTab';

export const SeasonDetailsScreen = ({ route, navigation }: any) => {
  const { seasonId, leagueId } = route.params;
  const layout = useWindowDimensions();

  const [index, setIndex] = React.useState(0);
  const [routes] = React.useState([
    { key: 'home', title: 'Home' },
    { key: 'matches', title: 'Matches' },
    { key: 'standings', title: 'Standings' },
    { key: 'leaderboards', title: 'Leaders' },
    { key: 'media', title: 'Media' },
  ]);

  // Fetch all data
  const {
    season,
    teams,
    matchCount,
    loading: seasonLoading,
    error: seasonError,
    refetch: refetchSeason,
  } = useSeasonDetails(seasonId, leagueId);

  const {
    standings,
    loading: standingsLoading,
    error: standingsError,
    refetch: refetchStandings,
  } = useStandings(seasonId);

  const {
    upcomingMatches,
    completedMatches,
    loading: matchesLoading,
    error: matchesError,
    refetch: refetchMatches,
  } = useSeasonMatches(seasonId);

  const {
    data: leaderboardData,
    loading: leaderboardsLoading,
    error: leaderboardsError,
    refetch: refetchLeaderboards,
  } = useSeasonLeaderboards(seasonId, season?.league_id || leagueId);

  const loading = seasonLoading;
  const error = seasonError || standingsError || matchesError || leaderboardsError;

  const onRefresh = useCallback(async () => {
    await Promise.all([
      refetchSeason(),
      refetchStandings(),
      refetchMatches(),
      refetchLeaderboards(),
    ]);
  }, [refetchSeason, refetchStandings, refetchMatches, refetchLeaderboards]);

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      onRefresh();
    }, [onRefresh])
  );

  // Auto-refresh when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        onRefresh();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [onRefresh]);

  // Set custom header with season info
  useEffect(() => {
    if (season) {
      navigation.setOptions({
        headerTitle: () => (
          <View style={styles.headerTitleContainer}>
            <IconImage
              url={season.iconUrl}
              fallbackIcon="calendar"
              size={32}
              fallbackLetter={season.name.charAt(0).toUpperCase()}
              rounded={true}
            />
            <Text style={styles.headerTitle} numberOfLines={1}>
              {season.name}
            </Text>
          </View>
        ),
      });
    }
  }, [navigation, season]);

  const renderScene = useCallback(
    ({ route }: SceneRendererProps & { route: Route }) => {
      if (!season) return null;

      switch (route.key) {
        case 'home':
          return (
            <HomeTab
              season={season}
              teams={teams}
              matchCount={matchCount}
              stats={leaderboardData?.seasonStats || null}
            />
          );
        case 'matches':
          return (
            <MatchesTab
              upcomingMatches={upcomingMatches}
              completedMatches={completedMatches}
              loading={matchesLoading}
              navigation={navigation}
            />
          );
        case 'standings':
          return <StandingsTab standings={standings} loading={standingsLoading} />;
        case 'leaderboards':
          return (
            <LeaderboardsTab
              topScorers={leaderboardData?.topScorers || []}
              topAssists={leaderboardData?.topAssists || []}
              cleanSheets={leaderboardData?.cleanSheets || []}
              manOfTheMatch={leaderboardData?.manOfTheMatch || []}
              loading={leaderboardsLoading}
            />
          );
        case 'media':
          return <MediaTab seasonId={seasonId} seasonName={season.name} />;
        default:
          return null;
      }
    },
    [
      season,
      teams,
      matchCount,
      leaderboardData,
      upcomingMatches,
      completedMatches,
      matchesLoading,
      standings,
      standingsLoading,
      leaderboardsLoading,
      seasonId,
    ]
  );

  const renderTabBar = (props: any) => (
    <TabBar
      {...props}
      scrollEnabled
      indicatorStyle={styles.tabIndicator}
      style={styles.tabBar}
      labelStyle={styles.tabLabel}
      activeColor="#3b82f6"
      inactiveColor="#999"
      tabStyle={styles.tab}
    />
  );

  if (loading && !season) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (error && !season) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!season) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Season not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tab View */}
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        renderTabBar={renderTabBar}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        lazy={false}
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
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    maxWidth: 200,
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
    fontSize: 13,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  tab: {
    width: 'auto',
    paddingHorizontal: 16,
  },
});

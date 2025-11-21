# League Dashboard Components - Usage Example

This document demonstrates how to use all the league dashboard components together in a LeagueDetailsScreen.

## Complete LeagueDetailsScreen Example

```typescript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';

// Import all league components
import { LeagueHeader } from '../components/league/LeagueHeader';
import { LeagueStatsCards } from '../components/league/LeagueStatsCards';
import { SeasonCard } from '../components/league/SeasonCard';
import { StandingsTable } from '../components/league/StandingsTable';
import { MatchCard } from '../components/league/MatchCard';

// Import hooks (these would be created by the backend-database-engineer agent)
import { useLeagueDetails } from '../hooks/useLeagueDetails';
import { useLeagueStats } from '../hooks/useLeagueStats';
import { useLeagueSeasons } from '../hooks/useLeagueSeasons';
import { useLeagueStandings } from '../hooks/useLeagueStandings';
import { useLeagueMatches } from '../hooks/useLeagueMatches';
import { useAuth } from '../contexts/AuthContext';

export const LeagueDetailsScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { leagueId } = route.params;

  const [refreshing, setRefreshing] = useState(false);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);

  // Fetch league data using hooks
  const { league, loading: leagueLoading, error: leagueError, refetch: refetchLeague } = useLeagueDetails(leagueId);
  const { stats, loading: statsLoading, refetch: refetchStats } = useLeagueStats(leagueId);
  const { seasons, loading: seasonsLoading, refetch: refetchSeasons } = useLeagueSeasons(leagueId);
  const { standings, loading: standingsLoading, refetch: refetchStandings } = useLeagueStandings(
    selectedSeasonId || seasons?.[0]?.id
  );
  const { matches, loading: matchesLoading, refetch: refetchMatches } = useLeagueMatches(
    selectedSeasonId || seasons?.[0]?.id
  );

  // Get user's team IDs for highlighting in standings
  const userTeamIds = user?.teams?.map(t => t.id) || [];

  // Auto-select first season if available
  useEffect(() => {
    if (seasons && seasons.length > 0 && !selectedSeasonId) {
      setSelectedSeasonId(seasons[0].id);
    }
  }, [seasons, selectedSeasonId]);

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchLeague(),
      refetchStats(),
      refetchSeasons(),
      refetchStandings(),
      refetchMatches(),
    ]);
    setRefreshing(false);
  };

  // Handle season card press
  const handleSeasonPress = (seasonId: string) => {
    setSelectedSeasonId(seasonId);
    // Optionally navigate to a dedicated season details screen
    // navigation.navigate('SeasonDetails', { seasonId });
  };

  // Handle match card press
  const handleMatchPress = (matchId: string) => {
    navigation.navigate('MatchDetails', { matchId });
  };

  // Loading state
  if (leagueLoading && !league) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  // Error state
  if (leagueError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{leagueError}</Text>
      </View>
    );
  }

  // No league found
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
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
      }
    >
      {/* League Header */}
      <LeagueHeader league={league} />

      {/* League Stats Cards */}
      {stats && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>League Overview</Text>
          <LeagueStatsCards stats={stats} />
        </View>
      )}

      {/* Seasons List */}
      {seasons && seasons.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Seasons</Text>
          {seasons.map((season) => (
            <SeasonCard
              key={season.id}
              season={season}
              onPress={() => handleSeasonPress(season.id)}
            />
          ))}
        </View>
      )}

      {/* Current Season Standings */}
      {selectedSeasonId && standings && standings.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Standings</Text>
          {standingsLoading ? (
            <View style={styles.sectionLoading}>
              <ActivityIndicator size="small" color="#3b82f6" />
            </View>
          ) : (
            <StandingsTable standings={standings} userTeamIds={userTeamIds} />
          )}
        </View>
      )}

      {/* Upcoming & Recent Matches */}
      {selectedSeasonId && matches && matches.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Matches</Text>
          {matchesLoading ? (
            <View style={styles.sectionLoading}>
              <ActivityIndicator size="small" color="#3b82f6" />
            </View>
          ) : (
            matches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                onPress={() => handleMatchPress(match.id)}
              />
            ))
          )}
        </View>
      )}

      {/* Empty state for no seasons */}
      {seasons && seasons.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No seasons available for this league yet.</Text>
        </View>
      )}
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
    gap: 24,
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
  section: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  sectionLoading: {
    padding: 20,
    alignItems: 'center',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
```

## Required Hooks (To be implemented by backend-database-engineer agent)

### 1. `useLeagueDetails(leagueId: string)`

Returns league information for the header.

```typescript
interface LeagueDetails {
  id: string;
  name: string;
  description?: string;
  sport_type: string;
  league_type: string;
  location?: string;
  logo_url?: string;
}

interface UseLeagueDetailsReturn {
  league: LeagueDetails | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}
```

### 2. `useLeagueStats(leagueId: string)`

Returns aggregated statistics across all seasons.

```typescript
interface LeagueStats {
  totalMatches: number;
  completed: number;
  upcoming: number;
  totalGoals: number;
}

interface UseLeagueStatsReturn {
  stats: LeagueStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}
```

### 3. `useLeagueSeasons(leagueId: string)`

Returns all seasons for the league.

```typescript
interface Season {
  id: string;
  name: string;
  season_year: number;
  status: string; // 'active', 'completed', 'registration', 'upcoming'
  start_date: string;
  end_date: string;
  icon_url?: string;
  registered_teams_count: number;
}

interface UseLeagueSeasonsReturn {
  seasons: Season[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}
```

### 4. `useLeagueStandings(seasonId: string | null)`

Returns standings for a specific season.

```typescript
interface StandingRow {
  position: number;
  teamId: string;
  teamName: string;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalDifference: number;
  points: number;
  form: ('W' | 'D' | 'L')[]; // Last 5 matches
}

interface UseLeagueStandingsReturn {
  standings: StandingRow[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}
```

### 5. `useLeagueMatches(seasonId: string | null)`

Returns upcoming and recent matches for a specific season.

```typescript
interface Match {
  id: string;
  homeTeam: { name: string; color?: string };
  awayTeam: { name: string; color?: string };
  homeScore?: number;
  awayScore?: number;
  matchDate: string;
  matchTime?: string;
  venue?: string;
  status: string; // 'completed', 'live', 'scheduled', 'cancelled'
}

interface UseLeagueMatchesReturn {
  matches: Match[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}
```

## Component Features Summary

### IconImage
- Automatic loading states with spinner
- Graceful error handling with fallback icons
- Support for 4 icon types: trophy, calendar, users, shield
- Letter-based fallback with color generation
- Configurable size and border radius

### LeagueHeader
- Displays league icon (56x56, rounded)
- League name, type badge (colored), sport type
- Optional location with icon
- Optional description (truncated to 3 lines)
- Dark theme styling

### LeagueStatsCards
- 2x2 grid of stat cards
- Each card has icon, value, and label
- Color-coded icons: blue, green, orange, purple
- Responsive layout with proper gaps

### SeasonCard
- Tappable card for navigation
- Season icon (40x40)
- Name, year, status badge
- Date range with formatting
- Team count
- Chevron indicator

### StandingsTable
- Sticky position and team columns
- Horizontal scrolling for stats
- User team highlighting (optional)
- Form badges (W/D/L) for last 5 matches
- Color-coded goal difference
- Proper table headers

### MatchCard
- Date/time header with status badge
- Team names with color dots
- Score display (if completed) or "vs" text
- Venue information
- Optional tap handler for navigation
- Status-based badge colors

## Integration Notes

1. All components follow the dark theme (#0a0a0a background, #1a1a1a cards)
2. Consistent spacing (gaps of 8, 12, 16, 24)
3. Touch feedback with 0.7 opacity
4. Proper error and loading states
5. Responsive design with proper text truncation
6. Accessibility considerations (readable text sizes, proper contrast)
7. Performance optimized (memoization where needed, efficient rendering)

## File Structure

```
src/components/
├── shared/
│   └── IconImage.tsx
└── league/
    ├── LeagueHeader.tsx
    ├── LeagueStatsCards.tsx
    ├── SeasonCard.tsx
    ├── StandingsTable.tsx
    ├── MatchCard.tsx
    └── USAGE_EXAMPLE.md
```

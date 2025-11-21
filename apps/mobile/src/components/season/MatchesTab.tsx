import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { MatchCard } from '../league/MatchCard';

interface Match {
  id: string;
  homeTeam: {
    name: string;
    color: string | null;
  };
  awayTeam: {
    name: string;
    color: string | null;
  };
  homeScore: number | null;
  awayScore: number | null;
  matchDate: string;
  matchTime: string | null;
  venue: string | null;
  status: string;
}

interface MatchesTabProps {
  upcomingMatches: Match[];
  completedMatches: Match[];
  loading: boolean;
  navigation?: any;
}

export const MatchesTab: React.FC<MatchesTabProps> = React.memo(({ upcomingMatches, completedMatches, loading, navigation }) => {
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading matches...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Upcoming Matches */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming Matches</Text>
        {upcomingMatches.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No upcoming matches</Text>
          </View>
        ) : (
          <View style={styles.matchesList}>
            {upcomingMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={{
                  id: match.id,
                  homeTeam: {
                    name: match.homeTeam.name,
                    color: match.homeTeam.color || undefined,
                  },
                  awayTeam: {
                    name: match.awayTeam.name,
                    color: match.awayTeam.color || undefined,
                  },
                  homeScore: match.homeScore ?? undefined,
                  awayScore: match.awayScore ?? undefined,
                  matchDate: match.matchDate,
                  matchTime: match.matchTime || undefined,
                  venue: match.venue || undefined,
                  status: match.status,
                }}
                onPress={navigation ? () => navigation.navigate('MatchDetails', { matchId: match.id }) : undefined}
              />
            ))}
          </View>
        )}
      </View>

      {/* Completed Matches */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Completed Matches</Text>
        {completedMatches.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No completed matches</Text>
          </View>
        ) : (
          <View style={styles.matchesList}>
            {completedMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={{
                  id: match.id,
                  homeTeam: {
                    name: match.homeTeam.name,
                    color: match.homeTeam.color || undefined,
                  },
                  awayTeam: {
                    name: match.awayTeam.name,
                    color: match.awayTeam.color || undefined,
                  },
                  homeScore: match.homeScore ?? undefined,
                  awayScore: match.awayScore ?? undefined,
                  matchDate: match.matchDate,
                  matchTime: match.matchTime || undefined,
                  venue: match.venue || undefined,
                  status: match.status,
                }}
                onPress={navigation ? () => navigation.navigate('MatchDetails', { matchId: match.id }) : undefined}
              />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  content: {
    padding: 16,
    gap: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 14,
    color: '#999',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  matchesList: {
    gap: 12,
  },
  emptyContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
  },
});

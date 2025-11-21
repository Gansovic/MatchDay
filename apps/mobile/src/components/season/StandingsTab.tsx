import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { StandingsTable } from '../league/StandingsTable';

interface Standing {
  position: number;
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalDifference: number;
  points: number;
  recentForm: string[];
}

interface StandingsTabProps {
  standings: Standing[];
  loading: boolean;
}

export const StandingsTab: React.FC<StandingsTabProps> = React.memo(({ standings, loading }) => {
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Calculating standings...</Text>
      </View>
    );
  }

  if (standings.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No matches played yet</Text>
          <Text style={styles.emptySubtext}>Standings will appear once matches are completed</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StandingsTable
        standings={standings.map(s => ({
          position: s.position,
          teamId: s.teamId,
          teamName: s.teamName,
          matchesPlayed: s.played,
          wins: s.won,
          draws: s.drawn,
          losses: s.lost,
          goalDifference: s.goalDifference,
          points: s.points,
          form: s.recentForm,
        }))}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    padding: 16,
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

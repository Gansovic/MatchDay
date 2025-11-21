import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { TeamStats } from '../../hooks/useTeamData';
import { StatsBar } from '../dashboard/StatsBar';
import { RecentForm } from '../dashboard/RecentForm';

interface OverviewTabProps {
  stats: TeamStats | null;
  playerCount: number;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ stats, playerCount }) => {
  if (!stats) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No stats available</Text>
      </View>
    );
  }

  const teamStats = {
    matchesPlayed: stats.wins + stats.draws + stats.losses,
    winRate: stats.winRate,
    goalsScored: stats.goalsFor,
    teamsCount: playerCount,
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Team Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Team Stats</Text>
        <StatsBar stats={teamStats} countLabel="Players" />
      </View>

      {/* Recent Form */}
      {stats.form.length > 0 && (
        <View style={styles.section}>
          <RecentForm form={stats.form} />
        </View>
      )}

      {/* Detailed Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Season Performance</Text>
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Wins</Text>
            <Text style={styles.detailValue}>{stats.wins}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Draws</Text>
            <Text style={styles.detailValue}>{stats.draws}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Losses</Text>
            <Text style={styles.detailValue}>{stats.losses}</Text>
          </View>
          <View style={[styles.detailRow, styles.divider]} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Goals For</Text>
            <Text style={styles.detailValue}>{stats.goalsFor}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Goals Against</Text>
            <Text style={styles.detailValue}>{stats.goalsAgainst}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Goal Difference</Text>
            <Text style={[styles.detailValue, stats.goalDifference >= 0 ? styles.positive : styles.negative]}>
              {stats.goalDifference >= 0 ? '+' : ''}{stats.goalDifference}
            </Text>
          </View>
          <View style={[styles.detailRow, styles.divider]} />
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, styles.pointsLabel]}>Total Points</Text>
            <Text style={[styles.detailValue, styles.pointsValue]}>{stats.points}</Text>
          </View>
        </View>
      </View>

      {stats.leaguePosition && stats.totalTeamsInLeague && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>League Standing</Text>
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Position</Text>
              <Text style={styles.detailValue}>
                {stats.leaguePosition} / {stats.totalTeamsInLeague}
              </Text>
            </View>
          </View>
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
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  detailsCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    marginVertical: 4,
  },
  detailLabel: {
    fontSize: 16,
    color: '#999',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  positive: {
    color: '#10b981',
  },
  negative: {
    color: '#ef4444',
  },
  pointsLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  pointsValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
});

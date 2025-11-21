import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DashboardStats } from '../../hooks/useDashboardData';

interface StatsBarProps {
  stats: DashboardStats;
  countLabel?: string;
}

export const StatsBar: React.FC<StatsBarProps> = ({ stats, countLabel = 'Teams' }) => {
  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        <View style={styles.statCard}>
          <View style={[styles.icon, { backgroundColor: '#3b82f6' }]} />
          <Text style={styles.value}>{stats.matchesPlayed}</Text>
          <Text style={styles.label}>Matches</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.icon, { backgroundColor: '#10b981' }]}>
            <View style={styles.arrowUp} />
          </View>
          <Text style={styles.value}>{stats.winRate}%</Text>
          <Text style={styles.label}>Win Rate</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.icon, { backgroundColor: '#8b5cf6' }]}>
            <View style={styles.target} />
          </View>
          <Text style={styles.value}>{stats.goalsScored}</Text>
          <Text style={styles.label}>Goals</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.icon, { backgroundColor: '#f59e0b' }]}>
            <View style={styles.users} />
          </View>
          <Text style={styles.value}>{stats.teamsCount}</Text>
          <Text style={styles.label}>{countLabel}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowUp: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#fff',
  },
  target: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#fff',
  },
  users: {
    width: 20,
    height: 16,
    backgroundColor: '#fff',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  value: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});

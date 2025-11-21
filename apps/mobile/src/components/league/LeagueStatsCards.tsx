import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatsCardsProps {
  stats: {
    totalMatches: number;
    completed: number;
    upcoming: number;
    totalGoals: number;
  };
}

export const LeagueStatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {/* Total Matches Card */}
        <View style={styles.card}>
          <View style={[styles.iconContainer, styles.blueGradient]}>
            <View style={styles.calendarIcon} />
          </View>
          <Text style={styles.value}>{stats.totalMatches}</Text>
          <Text style={styles.label}>Total Matches</Text>
        </View>

        {/* Completed Card */}
        <View style={styles.card}>
          <View style={[styles.iconContainer, styles.greenGradient]}>
            <View style={styles.checkCircleIcon} />
          </View>
          <Text style={styles.value}>{stats.completed}</Text>
          <Text style={styles.label}>Completed</Text>
        </View>

        {/* Upcoming Card */}
        <View style={styles.card}>
          <View style={[styles.iconContainer, styles.orangeGradient]}>
            <View style={styles.clockIcon} />
          </View>
          <Text style={styles.value}>{stats.upcoming}</Text>
          <Text style={styles.label}>Upcoming</Text>
        </View>

        {/* Total Goals Card */}
        <View style={styles.card}>
          <View style={[styles.iconContainer, styles.purpleGradient]}>
            <View style={styles.targetIcon} />
          </View>
          <Text style={styles.value}>{stats.totalGoals}</Text>
          <Text style={styles.label}>Total Goals</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
    gap: 8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  value: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  label: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  // Gradient backgrounds (using solid colors as React Native doesn't support gradients without external libraries)
  blueGradient: {
    backgroundColor: '#3b82f6',
  },
  greenGradient: {
    backgroundColor: '#10b981',
  },
  orangeGradient: {
    backgroundColor: '#f59e0b',
  },
  purpleGradient: {
    backgroundColor: '#8b5cf6',
  },
  // Icon styles - Calendar
  calendarIcon: {
    width: 24,
    height: 24,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 4,
  },
  // Icon styles - Check Circle
  checkCircleIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2.5,
    borderColor: '#fff',
    backgroundColor: 'transparent',
    position: 'relative',
  },
  // Icon styles - Clock
  clockIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'transparent',
  },
  // Icon styles - Target
  targetIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#fff',
    backgroundColor: 'transparent',
  },
});

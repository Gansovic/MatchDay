import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { UserLeagueData } from '../../hooks/useLeaguesData';
import { LeagueCard } from './LeagueCard';

interface MyLeaguesSectionProps {
  leagues: UserLeagueData[];
  onLeaguePress: (league: UserLeagueData) => void;
}

export const MyLeaguesSection: React.FC<MyLeaguesSectionProps> = ({ leagues, onLeaguePress }) => {
  if (leagues.length === 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Leagues</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>You're not in any leagues yet</Text>
          <Text style={styles.emptySubtext}>Explore leagues below to join one!</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>My Leagues</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{leagues.length}</Text>
        </View>
      </View>
      {leagues.map((league) => (
        <LeagueCard
          key={league.id}
          league={league}
          variant="active"
          onPress={() => onLeaguePress(league)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  countBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  countText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
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
    color: '#999',
    textAlign: 'center',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

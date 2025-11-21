import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LeagueData } from '../../hooks/useLeaguesData';
import { LeagueCard } from './LeagueCard';

interface ExploreSectionProps {
  leagues: LeagueData[];
  onLeaguePress: (league: LeagueData) => void;
  onJoinLeague: (league: LeagueData) => void;
}

export const ExploreSection: React.FC<ExploreSectionProps> = ({
  leagues,
  onLeaguePress,
  onJoinLeague,
}) => {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Explore Leagues</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{leagues.length}</Text>
        </View>
      </View>
      {leagues.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No leagues available</Text>
        </View>
      ) : (
        leagues.map((league) => (
          <LeagueCard
            key={league.id}
            league={league}
            variant="explore"
            onPress={() => onLeaguePress(league)}
            onJoin={() => onJoinLeague(league)}
          />
        ))
      )}
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
    backgroundColor: '#3b82f6',
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
  },
});

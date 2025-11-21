import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TeamLineup as TeamLineupType, PlayerInLineup } from '../../types/match.types';

interface TeamLineupProps {
  lineup: TeamLineupType;
}

const PlayerRow: React.FC<{ player: PlayerInLineup }> = ({ player }) => {
  return (
    <View style={styles.playerRow}>
      <View style={styles.playerLeft}>
        {player.jersey_number && (
          <View style={styles.jerseyNumber}>
            <Text style={styles.jerseyText}>{player.jersey_number}</Text>
          </View>
        )}
        <Text style={styles.playerName}>
          {player.player_name}
          {player.is_captain && <Text style={styles.captainBadge}> (C)</Text>}
        </Text>
      </View>
      {player.position && (
        <Text style={styles.position}>{player.position}</Text>
      )}
    </View>
  );
};

export const TeamLineup: React.FC<TeamLineupProps> = ({ lineup }) => {
  if (!lineup || (lineup.starters.length === 0 && lineup.substitutes.length === 0)) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>👥</Text>
        <Text style={styles.emptyText}>Lineup not available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.teamName}>{lineup.team_name}</Text>

      {/* Starters */}
      {lineup.starters.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Starting XI</Text>
          <View style={styles.playersList}>
            {lineup.starters.map((player) => (
              <PlayerRow key={player.id} player={player} />
            ))}
          </View>
        </View>
      )}

      {/* Substitutes */}
      {lineup.substitutes.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Substitutes</Text>
          <View style={styles.playersList}>
            {lineup.substitutes.map((player) => (
              <PlayerRow key={player.id} player={player} />
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
  },
  teamName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  playersList: {
    gap: 8,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    padding: 12,
  },
  playerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  jerseyNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  jerseyText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  playerName: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
    flex: 1,
  },
  captainBadge: {
    color: '#3b82f6',
    fontWeight: 'bold',
  },
  position: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  emptyState: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#333',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

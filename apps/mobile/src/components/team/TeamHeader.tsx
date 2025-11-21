import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { TeamDetails, UserRole } from '../../hooks/useTeamData';

interface TeamHeaderProps {
  team: TeamDetails;
  userRole: UserRole | null;
}

export const TeamHeader: React.FC<TeamHeaderProps> = ({ team, userRole }) => {
  const [imageError, setImageError] = React.useState(false);
  const showFallback = !team.logo_url || imageError;

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        {showFallback ? (
          <View style={[styles.logoFallback, { backgroundColor: team.team_color || '#3b82f6' }]}>
            <Text style={styles.logoText}>{team.name.charAt(0).toUpperCase()}</Text>
          </View>
        ) : (
          <Image
            source={{ uri: team.logo_url }}
            style={styles.logo}
            onError={() => setImageError(true)}
          />
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.name}>{team.name}</Text>
        <Text style={styles.leagueName}>{team.league_name}</Text>

        {userRole?.isCaptain && (
          <View style={styles.userBadges}>
            <View style={styles.captainBadge}>
              <Text style={styles.badgeText}>CAPTAIN</Text>
            </View>
          </View>
        )}

        <View style={styles.meta}>
          <Text style={styles.metaText}>{team.memberCount} members</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  logoFallback: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  info: {
    alignItems: 'center',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  leagueName: {
    fontSize: 16,
    color: '#3b82f6',
    marginBottom: 12,
  },
  userBadges: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  captainBadge: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  positionBadge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  metaText: {
    fontSize: 14,
    color: '#999',
  },
});

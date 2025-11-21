import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { generateColorFromString } from '../../lib/utils/icon-helpers';

interface Team {
  id: string;
  name: string;
  league_id: string | null;
  team_color?: string | null;
  logo_url?: string | null;
  leagues?: {
    id: string;
    name: string;
    league_type: string;
  };
}

interface TeamCardProps {
  team: Team;
  onPress: () => void;
}

const getLeagueTypeColor = (type: string) => {
  switch (type) {
    case 'recreational':
      return '#10b981';
    case 'competitive':
      return '#f59e0b';
    case 'semi-pro':
      return '#ef4444';
    default:
      return '#3b82f6';
  }
};

export const TeamCard: React.FC<TeamCardProps> = ({ team, onPress }) => {
  const [imageError, setImageError] = React.useState(false);
  const showFallback = !team.logo_url || imageError;
  const fallbackColor = team.team_color || generateColorFromString(team.name);

  // Reset error state when logo_url changes
  React.useEffect(() => {
    setImageError(false);
  }, [team.logo_url]);

  return (
    <TouchableOpacity style={styles.teamCard} onPress={onPress}>
      <View style={styles.teamHeader}>
        {/* Team Logo */}
        <View style={styles.teamLogoContainer}>
          {showFallback ? (
            <View style={[styles.teamLogoFallback, { backgroundColor: fallbackColor }]}>
              <Text style={styles.teamLogoText}>{team.name.charAt(0).toUpperCase()}</Text>
            </View>
          ) : (
            <Image
              source={{ uri: team.logo_url! }}
              style={styles.teamLogo}
              onError={() => setImageError(true)}
            />
          )}
        </View>

        <View style={styles.teamInfo}>
          <Text style={styles.teamName}>{team.name}</Text>
          {team.leagues ? (
            <View style={styles.leagueTag}>
              <View
                style={[styles.leagueDot, { backgroundColor: getLeagueTypeColor(team.leagues.league_type) }]}
              />
              <Text style={styles.leagueName}>{team.leagues.name}</Text>
            </View>
          ) : (
            <View style={styles.warningTag}>
              <View style={styles.warningDot} />
              <Text style={styles.warningText}>No league assigned</Text>
            </View>
          )}
        </View>
        {team.leagues ? (
          <View
            style={[styles.leagueTypeBadge, { backgroundColor: getLeagueTypeColor(team.leagues.league_type) }]}
          >
            <Text style={styles.leagueTypeText}>{team.leagues.league_type.toUpperCase()}</Text>
          </View>
        ) : (
          <View style={styles.warningBadge}>
            <Text style={styles.warningBadgeText}>SETUP NEEDED</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  teamCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  teamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  teamLogoContainer: {
    width: 48,
    height: 48,
  },
  teamLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  teamLogoFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamLogoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  leagueTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  leagueDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  leagueName: {
    fontSize: 14,
    color: '#999',
  },
  leagueTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  leagueTypeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  warningTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  warningDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f59e0b',
  },
  warningText: {
    fontSize: 14,
    color: '#f59e0b',
  },
  warningBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f59e0b',
  },
  warningBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

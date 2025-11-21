import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { IconImage } from '../shared/IconImage';

interface LeagueHeaderProps {
  league: {
    id: string;
    name: string;
    description?: string;
    sport_type: string;
    league_type: string;
    location?: string;
    logo_url?: string;
  };
}

export const LeagueHeader: React.FC<LeagueHeaderProps> = ({ league }) => {
  const getLeagueTypeBadgeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'recreational':
        return '#10b981'; // green
      case 'competitive':
        return '#f59e0b'; // orange
      case 'semi-pro':
      case 'semi_pro':
        return '#ef4444'; // red
      default:
        return '#3b82f6'; // blue
    }
  };

  const badgeColor = getLeagueTypeBadgeColor(league.league_type);

  return (
    <View style={styles.container}>
      {/* League Icon */}
      <View style={styles.iconWrapper}>
        <IconImage
          url={league.logo_url}
          fallbackIcon="trophy"
          size={56}
          fallbackLetter={league.name.charAt(0).toUpperCase()}
          rounded={true}
        />
      </View>

      {/* League Info */}
      <View style={styles.info}>
        {/* League Name */}
        <Text style={styles.name}>{league.name}</Text>

        {/* Meta Row */}
        <View style={styles.metaRow}>
          {/* League Type Badge */}
          <View style={[styles.typeBadge, { backgroundColor: badgeColor }]}>
            <Text style={styles.typeBadgeText}>
              {league.league_type.replace('_', ' ').toUpperCase()}
            </Text>
          </View>

          {/* Sport Type */}
          <Text style={styles.sportType}>{league.sport_type}</Text>
        </View>

        {/* Location */}
        {league.location && (
          <View style={styles.locationRow}>
            <View style={styles.locationIcon} />
            <Text style={styles.locationText}>{league.location}</Text>
          </View>
        )}

        {/* Description */}
        {league.description && (
          <Text style={styles.description} numberOfLines={3}>
            {league.description}
          </Text>
        )}
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
    gap: 16,
  },
  iconWrapper: {
    alignSelf: 'flex-start',
  },
  info: {
    gap: 12,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    lineHeight: 34,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  sportType: {
    fontSize: 14,
    color: '#999',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationIcon: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#666',
  },
  locationText: {
    fontSize: 13,
    color: '#999',
  },
  description: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
});

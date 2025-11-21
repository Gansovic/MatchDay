import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { IconImage } from '../shared/IconImage';

interface SeasonCardProps {
  season: {
    id: string;
    name: string;
    season_year: number;
    status: string;
    start_date: string;
    end_date: string;
    icon_url?: string;
    registered_teams_count: number;
  };
  onPress: () => void;
}

export const SeasonCard: React.FC<SeasonCardProps> = ({ season, onPress }) => {
  const getStatusBadgeStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return { backgroundColor: '#10b981', text: 'Active' };
      case 'completed':
        return { backgroundColor: '#666', text: 'Completed' };
      case 'registration':
        return { backgroundColor: '#3b82f6', text: 'Registration' };
      case 'upcoming':
        return { backgroundColor: '#f59e0b', text: 'Upcoming' };
      default:
        return { backgroundColor: '#666', text: status };
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const statusStyle = getStatusBadgeStyle(season.status);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.content}>
        {/* Season Icon */}
        <View style={styles.iconWrapper}>
          <IconImage
            url={season.icon_url}
            fallbackIcon="calendar"
            size={40}
            fallbackLetter={season.name.charAt(0).toUpperCase()}
            rounded={true}
          />
        </View>

        {/* Season Info */}
        <View style={styles.info}>
          {/* Name and Year */}
          <View style={styles.titleRow}>
            <Text style={styles.name} numberOfLines={1}>
              {season.name}
            </Text>
            <Text style={styles.year}>{season.season_year}</Text>
          </View>

          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
            <Text style={styles.statusText}>{statusStyle.text}</Text>
          </View>

          {/* Date Range */}
          <View style={styles.dateRow}>
            <View style={styles.dateIcon} />
            <Text style={styles.dateText}>
              {formatDate(season.start_date)} - {formatDate(season.end_date)}
            </Text>
          </View>

          {/* Team Count */}
          <View style={styles.teamRow}>
            <View style={styles.teamIcon} />
            <Text style={styles.teamText}>{season.registered_teams_count} teams registered</Text>
          </View>
        </View>

        {/* Chevron Right */}
        <View style={styles.chevronContainer}>
          <View style={styles.chevronRight} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  iconWrapper: {
    alignSelf: 'flex-start',
  },
  info: {
    flex: 1,
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  year: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateIcon: {
    width: 12,
    height: 12,
    borderRadius: 2,
    borderWidth: 1.5,
    borderColor: '#666',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  teamIcon: {
    width: 12,
    height: 10,
    backgroundColor: '#666',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  teamText: {
    fontSize: 12,
    color: '#999',
  },
  chevronContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
    height: 24,
  },
  chevronRight: {
    width: 8,
    height: 8,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#666',
    transform: [{ rotate: '-45deg' }],
  },
});

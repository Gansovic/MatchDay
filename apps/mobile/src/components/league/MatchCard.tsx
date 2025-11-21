import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface MatchCardProps {
  match: {
    id: string;
    homeTeam: { name: string; color?: string };
    awayTeam: { name: string; color?: string };
    homeScore?: number;
    awayScore?: number;
    matchDate: string;
    matchTime?: string;
    venue?: string;
    status: string;
  };
  onPress?: () => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, onPress }) => {
  const getStatusBadgeStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'finished':
        return { backgroundColor: '#10b981', text: 'Finished' };
      case 'live':
      case 'in_progress':
        return { backgroundColor: '#ef4444', text: 'Live' };
      case 'scheduled':
      case 'upcoming':
        return { backgroundColor: '#3b82f6', text: 'Scheduled' };
      case 'cancelled':
        return { backgroundColor: '#666', text: 'Cancelled' };
      default:
        return { backgroundColor: '#666', text: status };
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return null;
    try {
      const time = new Date(`2000-01-01T${timeStr}`);
      return time.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return timeStr;
    }
  };

  const statusStyle = getStatusBadgeStyle(match.status);
  const isCompleted = match.status.toLowerCase() === 'completed' || match.status.toLowerCase() === 'finished';
  const hasScore = match.homeScore !== undefined && match.awayScore !== undefined;

  const CardWrapper = onPress ? TouchableOpacity : View;
  const cardProps = onPress ? { onPress, activeOpacity: 0.7 } : {};

  return (
    <CardWrapper style={styles.card} {...cardProps}>
      {/* Date/Time Header */}
      <View style={styles.header}>
        <View style={styles.dateTimeRow}>
          <View style={styles.calendarIcon} />
          <Text style={styles.dateText}>{formatDate(match.matchDate)}</Text>
          {match.matchTime && (
            <>
              <View style={styles.dotSeparator} />
              <Text style={styles.timeText}>{formatTime(match.matchTime)}</Text>
            </>
          )}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
          <Text style={styles.statusText}>{statusStyle.text}</Text>
        </View>
      </View>

      {/* Teams and Score */}
      <View style={styles.matchInfo}>
        {/* Home Team */}
        <View style={styles.teamRow}>
          <View style={[styles.teamColorDot, { backgroundColor: match.homeTeam.color || '#3b82f6' }]} />
          <Text style={styles.teamName} numberOfLines={1}>
            {match.homeTeam.name}
          </Text>
        </View>

        {/* Score or VS */}
        <View style={styles.scoreContainer}>
          {isCompleted && hasScore ? (
            <View style={styles.scoreRow}>
              <Text style={styles.scoreText}>{match.homeScore}</Text>
              <Text style={styles.scoreSeparator}>-</Text>
              <Text style={styles.scoreText}>{match.awayScore}</Text>
            </View>
          ) : (
            <Text style={styles.vsText}>vs</Text>
          )}
        </View>

        {/* Away Team */}
        <View style={styles.teamRow}>
          <View style={[styles.teamColorDot, { backgroundColor: match.awayTeam.color || '#f59e0b' }]} />
          <Text style={styles.teamName} numberOfLines={1}>
            {match.awayTeam.name}
          </Text>
        </View>
      </View>

      {/* Venue/Court Info */}
      {match.venue && (
        <View style={styles.venueRow}>
          <View style={styles.locationIcon} />
          <Text style={styles.venueText} numberOfLines={1}>
            {match.venue}
          </Text>
        </View>
      )}
    </CardWrapper>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    padding: 16,
    gap: 12,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  calendarIcon: {
    width: 14,
    height: 14,
    borderRadius: 2,
    borderWidth: 1.5,
    borderColor: '#666',
  },
  dateText: {
    fontSize: 13,
    color: '#999',
    fontWeight: '600',
  },
  dotSeparator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#666',
  },
  timeText: {
    fontSize: 13,
    color: '#999',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  matchInfo: {
    gap: 12,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  teamColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  teamName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  scoreContainer: {
    alignSelf: 'center',
    paddingVertical: 8,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scoreText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    minWidth: 40,
    textAlign: 'center',
  },
  scoreSeparator: {
    fontSize: 24,
    color: '#666',
    fontWeight: 'bold',
  },
  vsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  locationIcon: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#666',
  },
  venueText: {
    flex: 1,
    fontSize: 12,
    color: '#999',
  },
});

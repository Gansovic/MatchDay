import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MatchDetails } from '../../types/match.types';
import { IconImage } from '../shared/IconImage';

interface MatchHeaderProps {
  match: MatchDetails;
}

export const MatchHeader: React.FC<MatchHeaderProps> = ({ match }) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getStatusColor = () => {
    switch (match.status) {
      case 'live':
        return '#10b981'; // green
      case 'completed':
        return '#999';
      case 'cancelled':
        return '#ef4444'; // red
      default:
        return '#3b82f6'; // blue
    }
  };

  const getStatusText = () => {
    switch (match.status) {
      case 'live':
        return 'LIVE';
      case 'completed':
        return 'FINAL';
      case 'cancelled':
        return 'CANCELLED';
      default:
        return 'SCHEDULED';
    }
  };

  return (
    <View style={styles.container}>
      {/* Date and Status */}
      <View style={styles.dateRow}>
        <Text style={styles.date}>{formatDate(match.match_date)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>
      </View>

      {match.match_time && (
        <Text style={styles.time}>{formatTime(match.match_time)}</Text>
      )}

      {/* Teams and Score */}
      <View style={styles.teamsContainer}>
        {/* Home Team */}
        <View style={styles.teamSection}>
          <View style={styles.teamInfo}>
            <IconImage
              url={match.home_team.logo_url}
              size={48}
              fallbackIcon="shield"
              fallbackColor={match.home_team.team_color || '#333'}
              fallbackLetter={match.home_team.name.charAt(0)}
            />
            <Text style={styles.teamName} numberOfLines={2}>
              {match.home_team.name}
            </Text>
          </View>
          {match.status !== 'scheduled' && match.home_score !== undefined && (
            <Text style={styles.score}>{match.home_score}</Text>
          )}
        </View>

        {/* VS or Dash */}
        <View style={styles.separator}>
          <Text style={styles.separatorText}>
            {match.status === 'scheduled' ? 'vs' : '-'}
          </Text>
        </View>

        {/* Away Team */}
        <View style={styles.teamSection}>
          {match.status !== 'scheduled' && match.away_score !== undefined && (
            <Text style={styles.score}>{match.away_score}</Text>
          )}
          <View style={styles.teamInfo}>
            <IconImage
              url={match.away_team.logo_url}
              size={48}
              fallbackIcon="shield"
              fallbackColor={match.away_team.team_color || '#333'}
              fallbackLetter={match.away_team.name.charAt(0)}
            />
            <Text style={styles.teamName} numberOfLines={2}>
              {match.away_team.name}
            </Text>
          </View>
        </View>
      </View>

      {/* Venue and League */}
      <View style={styles.metaInfo}>
        {match.venue && (
          <Text style={styles.metaText}>📍 {match.venue}</Text>
        )}
        {match.seasons?.leagues?.name && (
          <Text style={styles.metaText}>🏆 {match.seasons.leagues.name}</Text>
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
    marginBottom: 16,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    color: '#999',
    fontWeight: '600',
  },
  time: {
    fontSize: 14,
    color: '#999',
    marginBottom: 20,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  teamsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  teamSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  teamInfo: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  teamPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  teamName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  score: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    minWidth: 48,
    textAlign: 'center',
  },
  separator: {
    paddingHorizontal: 12,
  },
  separatorText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  metaInfo: {
    gap: 8,
  },
  metaText: {
    fontSize: 14,
    color: '#999',
  },
});

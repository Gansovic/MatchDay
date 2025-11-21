import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MatchEvent } from '../../types/match.types';

interface MatchEventsTimelineProps {
  events: MatchEvent[];
  homeTeamId: string;
  awayTeamId: string;
}

export const MatchEventsTimeline: React.FC<MatchEventsTimelineProps> = ({
  events,
  homeTeamId,
  awayTeamId,
}) => {
  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'goal':
        return '⚽';
      case 'own_goal':
        return '⚽';
      case 'yellow_card':
        return '🟨';
      case 'red_card':
        return '🟥';
      case 'substitution':
        return '🔄';
      case 'assist':
        return '👟';
      default:
        return '•';
    }
  };

  const getEventText = (event: MatchEvent) => {
    const playerName = event.player.full_name || event.player.display_name || 'Unknown';

    switch (event.event_type) {
      case 'goal':
        if (event.assist_player) {
          const assistName = event.assist_player.full_name || event.assist_player.display_name;
          return `${playerName} (assist: ${assistName})`;
        }
        return playerName;
      case 'own_goal':
        return `${playerName} (own goal)`;
      case 'yellow_card':
        return `${playerName} (yellow card)`;
      case 'red_card':
        return `${playerName} (red card)`;
      case 'substitution':
        return event.description || playerName;
      default:
        return playerName;
    }
  };

  const isHomeTeam = (teamId: string) => teamId === homeTeamId;

  if (events.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>📋</Text>
        <Text style={styles.emptyText}>No match events recorded yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {events.map((event, index) => {
        const isHome = isHomeTeam(event.team_id);

        return (
          <View key={event.id} style={styles.eventRow}>
            {/* Home side event */}
            <View style={[styles.eventSide, styles.homeSide]}>
              {isHome && (
                <View style={[styles.eventBubble, styles.homeEventBubble]}>
                  <Text style={styles.eventText}>{getEventText(event)}</Text>
                  <Text style={styles.eventType}>{event.event_type.replace('_', ' ')}</Text>
                </View>
              )}
            </View>

            {/* Center timeline */}
            <View style={styles.timeline}>
              <View style={styles.eventMarker}>
                <Text style={styles.eventIcon}>{getEventIcon(event.event_type)}</Text>
              </View>
              <Text style={styles.eventTime}>{event.event_time}'</Text>
              {index < events.length - 1 && <View style={styles.timelineLine} />}
            </View>

            {/* Away side event */}
            <View style={[styles.eventSide, styles.awaySide]}>
              {!isHome && (
                <View style={[styles.eventBubble, styles.awayEventBubble]}>
                  <Text style={styles.eventText}>{getEventText(event)}</Text>
                  <Text style={styles.eventType}>{event.event_type.replace('_', ' ')}</Text>
                </View>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  eventSide: {
    flex: 1,
  },
  homeSide: {
    alignItems: 'flex-end',
    paddingRight: 12,
  },
  awaySide: {
    alignItems: 'flex-start',
    paddingLeft: 12,
  },
  eventBubble: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    maxWidth: '90%',
    borderWidth: 2,
  },
  homeEventBubble: {
    borderColor: '#3b82f6',
  },
  awayEventBubble: {
    borderColor: '#666',
  },
  eventText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 4,
  },
  eventType: {
    fontSize: 12,
    color: '#999',
    textTransform: 'capitalize',
  },
  timeline: {
    alignItems: 'center',
    position: 'relative',
    width: 60,
  },
  eventMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  eventIcon: {
    fontSize: 20,
  },
  eventTime: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: 'bold',
    marginTop: 4,
  },
  timelineLine: {
    position: 'absolute',
    top: 40,
    width: 2,
    height: 50,
    backgroundColor: '#333',
    zIndex: 1,
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

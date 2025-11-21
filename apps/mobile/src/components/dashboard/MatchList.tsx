import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Dimensions } from 'react-native';
import { Match } from '../../hooks/useDashboardData';

const { width } = Dimensions.get('window');
const DASHBOARD_PADDING = 20;
const CARD_WIDTH = width - (DASHBOARD_PADDING * 2);
const CARD_SPACING = 12;

interface MatchListProps {
  matches: Match[];
  onMatchPress?: (matchId: string) => void;
  onViewAllPress?: () => void;
  showViewAllButton?: boolean;
}

export const MatchList: React.FC<MatchListProps> = ({
  matches,
  onMatchPress,
  onViewAllPress,
  showViewAllButton = true
}) => {
  const displayMatches = showViewAllButton ? matches.slice(0, 3) : matches;
  const [imageErrors, setImageErrors] = React.useState<Set<string>>(new Set());
  const [currentIndex, setCurrentIndex] = React.useState(0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return '#3b82f6';
      case 'completed':
        return '#666';
      case 'cancelled':
        return '#ef4444';
      default:
        return '#666';
    }
  };

  const getResultColor = (result?: string) => {
    switch (result) {
      case 'won':
        return '#10b981';
      case 'draw':
        return '#f59e0b';
      case 'lost':
        return '#ef4444';
      default:
        return '#666';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    return { month, day };
  };

  if (displayMatches.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon} />
        <Text style={styles.emptyTitle}>No Matches Yet</Text>
        <Text style={styles.emptyText}>
          Your match history will appear here once you start playing
        </Text>
      </View>
    );
  }

  // Log team logos for debugging
  React.useEffect(() => {
    displayMatches.forEach(match => {
      console.log('Match:', match.homeTeam.name, 'vs', match.awayTeam.name);
      console.log('Home team logo URL:', match.homeTeam.logoUrl);
      console.log('Away team logo URL:', match.awayTeam.logoUrl);
    });
  }, [displayMatches]);

  return (
    <View style={styles.container}>
      {/* Horizontal Carousel */}
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={(event) => {
          const offsetX = event.nativeEvent.contentOffset.x;
          const index = Math.round(offsetX / CARD_WIDTH);
          setCurrentIndex(index);
        }}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH}
        snapToAlignment="start"
        contentContainerStyle={styles.carouselContent}
      >
        {displayMatches.map((match) => {
          const { month, day } = formatDate(match.date);
          return (
            <View key={match.id} style={{ width: CARD_WIDTH }}>
              <TouchableOpacity
                style={styles.matchCard}
                onPress={() => onMatchPress?.(match.id)}
                activeOpacity={0.9}
              >
                <View style={styles.matchHeader}>
                  <View style={styles.dateBadge}>
                    <Text style={styles.dateMonth}>{month}</Text>
                    <Text style={styles.dateDay}>{day}</Text>
                  </View>

                  <View style={styles.badges}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(match.status) }]}>
                      <Text style={styles.statusText}>{match.status.toUpperCase()}</Text>
                    </View>
                    {match.result && (
                      <View style={[styles.resultBadge, { backgroundColor: getResultColor(match.result) }]}>
                        <Text style={styles.resultText}>{match.result.toUpperCase()}</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.teamsContainer}>
                  <View style={styles.teamRow}>
                    {match.homeTeam.logoUrl && !imageErrors.has(`home-${match.id}`) ? (
                      <Image
                        source={{ uri: match.homeTeam.logoUrl }}
                        style={styles.teamLogo}
                        onError={(error) => {
                          console.log('Home team logo error:', match.homeTeam.name, error.nativeEvent);
                          setImageErrors(prev => new Set(prev).add(`home-${match.id}`));
                        }}
                      />
                    ) : (
                      <View style={[styles.teamAvatar, { backgroundColor: match.homeTeam.color || '#3b82f6' }]}>
                        <Text style={styles.teamAvatarText}>
                          {match.homeTeam.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.teamName} numberOfLines={1}>
                      {match.homeTeam.name}
                    </Text>
                  </View>

                  <View style={styles.scoreContainer}>
                    {match.status === 'completed' && match.homeScore !== undefined && match.awayScore !== undefined ? (
                      <Text style={styles.score}>
                        {match.homeScore} - {match.awayScore}
                      </Text>
                    ) : (
                      <Text style={styles.vs}>vs</Text>
                    )}
                  </View>

                  <View style={styles.teamRow}>
                    {match.awayTeam.logoUrl && !imageErrors.has(`away-${match.id}`) ? (
                      <Image
                        source={{ uri: match.awayTeam.logoUrl }}
                        style={styles.teamLogo}
                        onError={(error) => {
                          console.log('Away team logo error:', match.awayTeam.name, error.nativeEvent);
                          setImageErrors(prev => new Set(prev).add(`away-${match.id}`));
                        }}
                      />
                    ) : (
                      <View style={[styles.teamAvatar, { backgroundColor: match.awayTeam.color || '#ef4444' }]}>
                        <Text style={styles.teamAvatarText}>
                          {match.awayTeam.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.teamName} numberOfLines={1}>
                      {match.awayTeam.name}
                    </Text>
                  </View>
                </View>

                <View style={styles.matchFooter}>
                  <Text style={styles.leagueName}>{match.leagueName}</Text>
                  <View style={styles.venueDot} />
                  <Text style={styles.venueText} numberOfLines={1}>
                    {match.venue}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Pagination dots inside card */}
              {displayMatches.length > 1 && (
                <View style={styles.pagination}>
                  {displayMatches.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.paginationDot,
                        currentIndex === index && styles.paginationDotActive,
                      ]}
                    />
                  ))}
                </View>
              )}

              {/* View All Button inside card */}
              {showViewAllButton && matches.length > 3 && (
                <TouchableOpacity style={styles.viewAllButton} onPress={onViewAllPress}>
                  <Text style={styles.viewAllText}>View All Matches</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  carouselContent: {
    gap: 0,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingTop: 16,
    paddingBottom: 12,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#333',
  },
  paginationDotActive: {
    backgroundColor: '#3b82f6',
    width: 24,
  },
  matchCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  dateBadge: {
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  dateMonth: {
    fontSize: 10,
    color: '#999',
    textTransform: 'uppercase',
  },
  dateDay: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  resultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  resultText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  teamsContainer: {
    marginBottom: 16,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 6,
  },
  teamAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamAvatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  teamLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  scoreContainer: {
    alignSelf: 'center',
    marginVertical: 4,
  },
  score: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  vs: {
    fontSize: 14,
    color: '#999',
  },
  matchFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  leagueName: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '600',
  },
  venueDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#666',
  },
  venueText: {
    fontSize: 12,
    color: '#999',
    flex: 1,
  },
  viewAllButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3b82f6',
  },
  emptyContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#333',
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#333',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    maxWidth: 280,
  },
});

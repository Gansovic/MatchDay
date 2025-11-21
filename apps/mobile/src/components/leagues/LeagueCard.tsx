import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LeagueData, UserLeagueData } from '../../hooks/useLeaguesData';
import { generateColorFromString } from '../../lib/utils/icon-helpers';

interface LeagueCardProps {
  league: LeagueData | UserLeagueData;
  variant: 'active' | 'explore';
  onPress: () => void;
  onJoin?: () => void;
}

export const LeagueCard: React.FC<LeagueCardProps> = ({ league, variant, onPress, onJoin }) => {
  const [imageError, setImageError] = React.useState(false);
  const showFallback = !league.logo_url || imageError;
  const fallbackColor = generateColorFromString(league.name);

  const isUserLeague = 'userTeams' in league;
  const userLeague = isUserLeague ? league as UserLeagueData : null;

  // Debug logging
  React.useEffect(() => {
    console.log(`🎴 LeagueCard "${league.name}":`, {
      logo_url: league.logo_url,
      imageError,
      showFallback,
      has_logo_url: !!league.logo_url
    });
  }, [league.name, league.logo_url, imageError, showFallback]);

  // Reset error state when logo_url changes (e.g., when icon is updated)
  React.useEffect(() => {
    setImageError(false);
  }, [league.logo_url]);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardContent}>
        {/* League Icon */}
        <View style={styles.iconContainer}>
          {showFallback ? (
            <View style={[styles.iconFallback, { backgroundColor: fallbackColor }]}>
              <Text style={styles.iconText}>{league.name.charAt(0).toUpperCase()}</Text>
            </View>
          ) : (
            <Image
              source={{ uri: league.logo_url! }}
              style={styles.icon}
              onError={(error) => {
                console.error(`❌ Image load error for "${league.name}":`, {
                  url: league.logo_url,
                  error: error.nativeEvent?.error || 'Unknown error'
                });
                setImageError(true);
              }}
            />
          )}
        </View>

        {/* League Info */}
        <View style={styles.info}>
          <Text style={styles.leagueName} numberOfLines={1}>
            {league.name}
          </Text>
          <View style={styles.metaRow}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>{league.league_type}</Text>
            </View>
            <Text style={styles.metaText}>{league.teamCount} teams</Text>
          </View>

          {/* User-specific info for My Leagues */}
          {variant === 'active' && userLeague && userLeague.userTeams.length > 0 && (
            <View style={styles.userInfo}>
              {userLeague.userTeams.map((team, idx) => (
                <View key={idx} style={styles.teamRow}>
                  <Text style={styles.teamName} numberOfLines={1}>
                    {team.teamName}
                  </Text>
                  {team.position !== undefined && (
                    <View style={styles.positionBadge}>
                      <Text style={styles.positionText}>#{team.position}</Text>
                    </View>
                  )}
                  {team.points !== undefined && (
                    <Text style={styles.pointsText}>{team.points} pts</Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Action Button */}
        <View style={styles.actions}>
          {variant === 'explore' && onJoin && (
            <TouchableOpacity
              style={styles.joinButton}
              onPress={(e) => {
                e.stopPropagation();
                onJoin();
              }}
            >
              <Text style={styles.joinButtonText}>Join</Text>
            </TouchableOpacity>
          )}
          {variant === 'active' && (
            <View style={styles.viewButton}>
              <Text style={styles.viewButtonText}>View</Text>
            </View>
          )}
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
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
  },
  icon: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  iconFallback: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  info: {
    flex: 1,
  },
  leagueName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  typeBadge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'uppercase',
  },
  metaText: {
    fontSize: 12,
    color: '#999',
  },
  userInfo: {
    marginTop: 8,
    gap: 4,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  teamName: {
    fontSize: 13,
    color: '#10b981',
    fontWeight: '600',
    flex: 1,
  },
  positionBadge: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  positionText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },
  pointsText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
  },
  actions: {
    justifyContent: 'center',
  },
  joinButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  viewButton: {
    backgroundColor: '#333',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewButtonText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '600',
  },
});

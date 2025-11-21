import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSeasonSponsors } from '../../hooks/useSeasonSponsors';
import { SponsorsSection } from './SponsorsSection';

interface SeasonInfo {
  id: string;
  name: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  tournament_format: string | null;
  points_for_win: number;
  points_for_draw: number;
  points_for_loss: number;
  iconUrl: string | null;
  league_id: string;
  description: string | null;
}

interface TeamInSeason {
  id: string;
  team_id: string;
  team_name: string;
  team_color: string | null;
  status: string;
}

interface SeasonStats {
  total_matches: number;
  completed_matches: number;
  total_goals: number;
  total_players: number;
  avg_goals_per_match: number;
}

interface HomeTabProps {
  season: SeasonInfo;
  teams: TeamInSeason[];
  matchCount: number;
  stats: SeasonStats | null;
}

export const HomeTab: React.FC<HomeTabProps> = React.memo(({ season, teams, matchCount, stats }) => {
  const { sponsors } = useSeasonSponsors(season.id);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'TBD';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const completionPercentage = stats && stats.total_matches > 0
    ? Math.round((stats.completed_matches / stats.total_matches) * 100)
    : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{matchCount}</Text>
          <Text style={styles.statLabel}>Total Matches</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{teams.length}</Text>
          <Text style={styles.statLabel}>Teams</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats?.total_goals || 0}</Text>
          <Text style={styles.statLabel}>Total Goals</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{completionPercentage}%</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      {/* Description Section */}
      {season.description && (
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>About This Season</Text>
          <View style={styles.descriptionCard}>
            <Text style={styles.descriptionText}>{season.description}</Text>
          </View>
        </View>
      )}

      {/* Sponsors Section */}
      <SponsorsSection sponsors={sponsors} />

      {/* Schedule Card */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Schedule</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Start Date</Text>
            <Text style={styles.infoValue}>{formatDate(season.start_date)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>End Date</Text>
            <Text style={styles.infoValue}>{formatDate(season.end_date)}</Text>
          </View>
        </View>
      </View>

      {/* Points System Card */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Points System</Text>
        <View style={styles.pointsCard}>
          <View style={styles.pointsItem}>
            <View style={[styles.pointsBadge, { backgroundColor: '#10b981' }]}>
              <Text style={styles.pointsValue}>{season.points_for_win}</Text>
            </View>
            <Text style={styles.pointsLabel}>Win</Text>
          </View>
          <View style={styles.pointsItem}>
            <View style={[styles.pointsBadge, { backgroundColor: '#f59e0b' }]}>
              <Text style={styles.pointsValue}>{season.points_for_draw}</Text>
            </View>
            <Text style={styles.pointsLabel}>Draw</Text>
          </View>
          <View style={styles.pointsItem}>
            <View style={[styles.pointsBadge, { backgroundColor: '#ef4444' }]}>
              <Text style={styles.pointsValue}>{season.points_for_loss}</Text>
            </View>
            <Text style={styles.pointsLabel}>Loss</Text>
          </View>
        </View>
      </View>

      {/* Teams Preview */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Registered Teams</Text>
        {teams.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No teams registered yet</Text>
          </View>
        ) : (
          <View style={styles.teamsGrid}>
            {teams.slice(0, 6).map((team) => (
              <View key={team.id} style={styles.teamChip}>
                <View style={[styles.teamColorDot, { backgroundColor: team.team_color || '#3b82f6' }]} />
                <Text style={styles.teamChipText} numberOfLines={1}>
                  {team.team_name}
                </Text>
              </View>
            ))}
            {teams.length > 6 && (
              <View style={styles.moreTeamsChip}>
                <Text style={styles.moreTeamsText}>+{teams.length - 6} more</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Stats Summary */}
      {stats && stats.completed_matches > 0 && (
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Season Statistics</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Matches Played</Text>
              <Text style={styles.infoValue}>{stats.completed_matches} / {stats.total_matches}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Avg Goals/Match</Text>
              <Text style={styles.infoValue}>{stats.avg_goals_per_match.toFixed(2)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Total Players</Text>
              <Text style={styles.infoValue}>{stats.total_players}</Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  statLabel: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500',
  },
  infoSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  infoCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    padding: 16,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#999',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  pointsCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  pointsItem: {
    alignItems: 'center',
    gap: 8,
  },
  pointsBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pointsValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  pointsLabel: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  teamsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  teamChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  teamColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  teamChipText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
    maxWidth: 120,
  },
  moreTeamsChip: {
    backgroundColor: '#333',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  moreTeamsText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  emptyContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
  },
  descriptionCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    padding: 16,
  },
  descriptionText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
});

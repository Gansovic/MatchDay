import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { PlayerStatRow } from '../../hooks/useSeasonLeaderboards';

interface LeaderboardsTabProps {
  topScorers: PlayerStatRow[];
  topAssists: PlayerStatRow[];
  cleanSheets: PlayerStatRow[];
  manOfTheMatch: PlayerStatRow[];
  loading: boolean;
}

type LeaderboardCategory = 'goals' | 'assists' | 'motm' | 'cleanSheets';

const LeaderboardTable: React.FC<{
  title: string;
  data: PlayerStatRow[];
  statLabel: string;
}> = ({ title, data, statLabel }) => {
  if (data.length === 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No data available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.tableContainer}>
        {/* Header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.headerText, styles.rankColumn]}>#</Text>
          <Text style={[styles.headerText, styles.playerColumn]}>Player</Text>
          <Text style={[styles.headerText, styles.teamColumn]}>Team</Text>
          <Text style={[styles.headerText, styles.statColumn]}>{statLabel}</Text>
        </View>

        {/* Rows */}
        {data.map((player, index) => (
          <View
            key={player.id}
            style={[
              styles.tableRow,
              index === 0 && styles.firstRow,
              index === 1 && styles.secondRow,
              index === 2 && styles.thirdRow,
            ]}
          >
            <View style={styles.rankColumn}>
              <Text style={[styles.rankText, index < 3 && styles.topRankText]}>{index + 1}</Text>
            </View>
            <View style={styles.playerColumn}>
              <View style={styles.playerInfo}>
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarPlaceholderText}>
                    {player.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.playerDetails}>
                  <Text style={styles.playerName} numberOfLines={1}>
                    {player.name}
                  </Text>
                  <Text style={styles.matchesPlayed}>
                    {player.matches_played} {player.matches_played === 1 ? 'match' : 'matches'}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.teamColumn}>
              <View style={styles.teamInfo}>
                <View style={[styles.teamColorDot, { backgroundColor: player.team_color }]} />
                <Text style={styles.teamName} numberOfLines={1}>
                  {player.team}
                </Text>
              </View>
            </View>
            <View style={styles.statColumn}>
              <Text style={styles.statValue}>{player.value}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

export const LeaderboardsTab: React.FC<LeaderboardsTabProps> = React.memo(
  ({ topScorers, topAssists, cleanSheets, manOfTheMatch, loading }) => {
    const [activeCategory, setActiveCategory] = useState<LeaderboardCategory>('goals');

    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading leaderboards...</Text>
        </View>
      );
    }

    const hasAnyData = topScorers.length > 0 || topAssists.length > 0 || cleanSheets.length > 0 || manOfTheMatch.length > 0;

    if (!hasAnyData) {
      return (
        <View style={styles.container}>
          <View style={styles.emptyContainerLarge}>
            <Text style={styles.emptyTitle}>No Statistics Yet</Text>
            <Text style={styles.emptySubtext}>
              Player statistics will appear once matches are played and stats are recorded
            </Text>
          </View>
        </View>
      );
    }

    const tabs = [
      { id: 'goals' as const, label: 'Goals', data: topScorers, statLabel: 'Goals' },
      { id: 'assists' as const, label: 'Assists', data: topAssists, statLabel: 'Assists' },
      { id: 'motm' as const, label: 'MOTM', data: manOfTheMatch, statLabel: 'MOTM' },
      { id: 'cleanSheets' as const, label: 'Clean Sheets', data: cleanSheets, statLabel: 'CS' },
    ];

    const activeTab = tabs.find(tab => tab.id === activeCategory);

    return (
      <View style={styles.container}>
        {/* Tab Bar */}
        <View style={styles.tabBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBarContent}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tabButton, activeCategory === tab.id && styles.activeTabButton]}
                onPress={() => setActiveCategory(tab.id)}
              >
                <Text style={[styles.tabText, activeCategory === tab.id && styles.activeTabText]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Tab Content */}
        <ScrollView style={styles.content} contentContainerStyle={styles.contentPadding}>
          {activeTab && (
            <LeaderboardTable title={activeTab.label} data={activeTab.data} statLabel={activeTab.statLabel} />
          )}
        </ScrollView>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  tabBar: {
    backgroundColor: '#0a0a0a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  tabBarContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  activeTabText: {
    color: '#3b82f6',
  },
  content: {
    flex: 1,
  },
  contentPadding: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 14,
    color: '#999',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  tableContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  firstRow: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  secondRow: {
    backgroundColor: 'rgba(192, 192, 192, 0.08)',
  },
  thirdRow: {
    backgroundColor: 'rgba(205, 127, 50, 0.08)',
  },
  rankColumn: {
    width: 36,
    alignItems: 'center',
  },
  playerColumn: {
    flex: 2,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerDetails: {
    flex: 1,
    gap: 2,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#333',
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  teamColumn: {
    flex: 1.5,
  },
  statColumn: {
    width: 50,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  topRankText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  playerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  matchesPlayed: {
    fontSize: 11,
    color: '#666',
  },
  teamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  teamColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  teamName: {
    fontSize: 12,
    color: '#999',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  emptyContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    padding: 24,
    alignItems: 'center',
  },
  emptyContainerLarge: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    padding: 32,
    alignItems: 'center',
    margin: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

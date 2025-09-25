import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { PlayerService } from '../services/PlayerService';

export const MainScreen: React.FC = () => {
  const { user, signOut } = useAuth();

  // Fetch player profile and stats
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['player-profile', user?.id],
    queryFn: () => PlayerService.getInstance().getPlayerProfile(user!.id),
    enabled: !!user?.id,
  });

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['player-stats', user?.id],
    queryFn: () => PlayerService.getInstance().getPlayerStats(user!.id),
    enabled: !!user?.id,
  });

  const { data: recentMatches, isLoading: matchesLoading } = useQuery({
    queryKey: ['recent-matches', user?.id],
    queryFn: () => PlayerService.getInstance().getRecentMatches(user!.id, 3),
    enabled: !!user?.id,
  });

  const { data: upcomingMatches, isLoading: upcomingLoading } = useQuery({
    queryKey: ['upcoming-matches', user?.id],
    queryFn: () => PlayerService.getInstance().getUpcomingMatches(user!.id, 2),
    enabled: !!user?.id,
  });

  const isLoading = profileLoading || statsLoading;

  const onRefresh = () => {
    refetchStats();
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} />}
      >
        {/* Header with user info */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {profile?.displayName?.charAt(0).toUpperCase() || user?.name?.charAt(0).toUpperCase() || 'P'}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.title}>Welcome back!</Text>
              <Text style={styles.userName}>{profile?.displayName || user?.name || 'Player'}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats?.totalGames || 0}</Text>
            <Text style={styles.statLabel}>Games</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats?.totalGoals || 0}</Text>
            <Text style={styles.statLabel}>Goals</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats?.totalAssists || 0}</Text>
            <Text style={styles.statLabel}>Assists</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats?.leaguesPlayed || 0}</Text>
            <Text style={styles.statLabel}>Leagues</Text>
          </View>
        </View>

        {/* Performance Overview */}
        <View style={styles.performanceCard}>
          <Text style={styles.cardTitle}>⚡ Performance</Text>
          <View style={styles.performanceRow}>
            <Text style={styles.performanceLabel}>Goals per Game:</Text>
            <Text style={styles.performanceValue}>{stats?.averageGoalsPerGame?.toFixed(2) || '0.00'}</Text>
          </View>
          <View style={styles.performanceRow}>
            <Text style={styles.performanceLabel}>Rating:</Text>
            <Text style={styles.performanceValue}>{stats?.performanceRating || 0}/100</Text>
          </View>
          <View style={styles.performanceRow}>
            <Text style={styles.performanceLabel}>Achievement Points:</Text>
            <Text style={styles.performanceValue}>{stats?.achievementPoints || 0}</Text>
          </View>
        </View>

        {/* Upcoming Matches */}
        {upcomingMatches && upcomingMatches.length > 0 && (
          <View style={styles.matchesCard}>
            <Text style={styles.cardTitle}>🏆 Upcoming Matches</Text>
            {upcomingMatches.map((match) => (
              <View key={match.id} style={styles.matchItem}>
                <Text style={styles.matchTeams}>
                  {match.homeTeam} vs {match.awayTeam}
                </Text>
                <Text style={styles.matchDate}>
                  {new Date(match.date).toLocaleDateString()} • {match.leagueName}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Recent Matches */}
        {recentMatches && recentMatches.length > 0 && (
          <View style={styles.matchesCard}>
            <Text style={styles.cardTitle}>📊 Recent Results</Text>
            {recentMatches.map((match) => (
              <View key={match.id} style={styles.matchItem}>
                <View style={styles.matchHeader}>
                  <Text style={styles.matchTeams}>
                    {match.homeTeam} {match.homeScore} - {match.awayScore} {match.awayTeam}
                  </Text>
                  <View style={[styles.resultBadge, styles[`result${match.result}`]]}>
                    <Text style={styles.resultText}>{match.result.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.matchStats}>
                  Your stats: {match.playerGoals} goals, {match.playerAssists} assists
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Empty state if no data */}
        {(!recentMatches || recentMatches.length === 0) && (!upcomingMatches || upcomingMatches.length === 0) && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Ready to play?</Text>
            <Text style={styles.emptySubtitle}>
              Join a team to start tracking your matches and stats!
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  userDetails: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    color: '#6b7280',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    minWidth: '22%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  performanceCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  performanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  performanceLabel: {
    fontSize: 16,
    color: '#4b5563',
  },
  performanceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
  },
  matchesCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  matchItem: {
    marginBottom: 16,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  matchTeams: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  matchDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  matchStats: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  resultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 50,
    alignItems: 'center',
  },
  resultwin: {
    backgroundColor: '#10b981',
  },
  resultloss: {
    backgroundColor: '#ef4444',
  },
  resultdraw: {
    backgroundColor: '#f59e0b',
  },
  resultText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
});
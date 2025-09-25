import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useQuery } from '@tanstack/react-query';
import { LeagueService, League } from '../services/LeagueService';

const LeagueCard: React.FC<{ league: League }> = ({ league }) => {
  const getSportIcon = (sportType: string) => {
    switch (sportType.toLowerCase()) {
      case 'football':
      case 'soccer':
        return '⚽';
      case 'basketball':
        return '🏀';
      case 'tennis':
        return '🎾';
      case 'volleyball':
        return '🏐';
      case 'baseball':
        return '⚾';
      default:
        return '🏃';
    }
  };

  const getLeagueTypeEmoji = (type: string) => {
    switch (type.toLowerCase()) {
      case 'competitive':
        return '🏆';
      case 'casual':
        return '⚽';
      case 'friendly':
        return '🤝';
      case 'professional':
        return '🔥';
      default:
        return '🎯';
    }
  };

  const formatEntryFee = (fee?: number) => {
    if (!fee || fee === 0) return 'Free to play';
    return `$${fee} entry fee`;
  };

  const isAvailable = league.available_spots > 0;

  return (
    <View style={styles.leagueCard}>
      <View style={styles.leagueHeader}>
        <Text style={styles.leagueName}>
          {getSportIcon(league.sport_type)} {league.name}
        </Text>
        <Text style={[
          styles.availabilityBadge,
          isAvailable ? styles.availableBadge : styles.fullBadge
        ]}>
          {isAvailable ? `${league.available_spots} spots` : 'Full'}
        </Text>
      </View>

      {league.description && (
        <Text style={styles.leagueDescription}>{league.description}</Text>
      )}

      <View style={styles.leagueDetails}>
        <Text style={styles.detail}>
          {getLeagueTypeEmoji(league.league_type)} {league.league_type.charAt(0).toUpperCase() + league.league_type.slice(1)} League
        </Text>
        {league.location && (
          <Text style={styles.detail}>📍 {league.location}</Text>
        )}
        <Text style={styles.detail}>💰 {formatEntryFee(league.entry_fee)}</Text>
        <Text style={styles.detail}>🏆 {league.current_teams_count} teams playing</Text>
      </View>

      <TouchableOpacity
        style={[
          styles.viewButton,
          !isAvailable && styles.disabledButton
        ]}
        disabled={!isAvailable}
      >
        <Text style={[
          styles.buttonText,
          !isAvailable && styles.disabledButtonText
        ]}>
          {isAvailable ? 'View League' : 'League Full'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export const ExploreLeaguesScreen: React.FC = () => {
  const { data: leagues, isLoading, refetch } = useQuery({
    queryKey: ['available-leagues'],
    queryFn: () => LeagueService.getInstance().getAvailableLeagues(),
  });

  const onRefresh = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading leagues...</Text>
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
        <View style={styles.header}>
          <Text style={styles.title}>Explore Leagues</Text>
          <Text style={styles.subtitle}>
            {leagues && leagues.length > 0
              ? `${leagues.length} league${leagues.length !== 1 ? 's' : ''} available`
              : 'Find your next team'}
          </Text>
        </View>

        {leagues && leagues.length > 0 ? (
          leagues.map((league) => <LeagueCard key={league.id} league={league} />)
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🏟️</Text>
            <Text style={styles.emptyTitle}>No Leagues Available</Text>
            <Text style={styles.emptySubtext}>
              There are no active leagues recruiting players at the moment. Check back later!
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
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  leagueCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  leagueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  leagueName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  availabilityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    fontSize: 12,
    fontWeight: '600',
    minWidth: 60,
    textAlign: 'center',
  },
  availableBadge: {
    backgroundColor: '#10b981',
    color: 'white',
  },
  fullBadge: {
    backgroundColor: '#ef4444',
    color: 'white',
  },
  leagueDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  leagueDetails: {
    marginBottom: 20,
    gap: 8,
  },
  detail: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  viewButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#d1d5db',
  },
  disabledButtonText: {
    color: '#9ca3af',
  },
  emptyState: {
    backgroundColor: 'white',
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { LeagueService, League } from '../services/LeagueService';

type LeagueDetailsRouteParams = {
  LeagueDetails: {
    leagueId: string;
    leagueName?: string;
  };
};

type LeagueDetailsRouteProp = RouteProp<LeagueDetailsRouteParams, 'LeagueDetails'>;

export const LeagueDetailsScreen: React.FC = () => {
  const route = useRoute<LeagueDetailsRouteProp>();
  const navigation = useNavigation();
  const { leagueId, leagueName } = route.params;

  const { data: league, isLoading, error } = useQuery({
    queryKey: ['league-details', leagueId],
    queryFn: () => LeagueService.getInstance().getLeagueById(leagueId),
  });

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

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading league details...</Text>
      </View>
    );
  }

  if (error || !league) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorIcon}>❌</Text>
        <Text style={styles.errorTitle}>League Not Found</Text>
        <Text style={styles.errorText}>
          Sorry, we couldn't load the league details. Please try again.
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isAvailable = league.available_spots > 0;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>League Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* League Header */}
        <View style={styles.leagueHeader}>
          <Text style={styles.leagueName}>
            {getSportIcon(league.sport_type)} {league.name}
          </Text>
          <Text style={[
            styles.availabilityBadge,
            isAvailable ? styles.availableBadge : styles.fullBadge
          ]}>
            {isAvailable ? `${league.available_spots} spots available` : 'League Full'}
          </Text>
        </View>

        {/* League Description */}
        {league.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About This League</Text>
            <Text style={styles.description}>{league.description}</Text>
          </View>
        )}

        {/* League Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>League Information</Text>
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailIcon}>{getLeagueTypeEmoji(league.league_type)}</Text>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>League Type</Text>
                <Text style={styles.detailValue}>
                  {league.league_type.charAt(0).toUpperCase() + league.league_type.slice(1)}
                </Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailIcon}>🏃</Text>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Sport</Text>
                <Text style={styles.detailValue}>
                  {league.sport_type.charAt(0).toUpperCase() + league.sport_type.slice(1)}
                </Text>
              </View>
            </View>

            {league.location && (
              <View style={styles.detailItem}>
                <Text style={styles.detailIcon}>📍</Text>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Location</Text>
                  <Text style={styles.detailValue}>{league.location}</Text>
                </View>
              </View>
            )}

            <View style={styles.detailItem}>
              <Text style={styles.detailIcon}>💰</Text>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Entry Fee</Text>
                <Text style={styles.detailValue}>{formatEntryFee(league.entry_fee)}</Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailIcon}>🏆</Text>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Teams</Text>
                <Text style={styles.detailValue}>{league.current_teams_count} teams playing</Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailIcon}>👥</Text>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Available Spots</Text>
                <Text style={styles.detailValue}>
                  {isAvailable ? `${league.available_spots} spots left` : 'No spots available'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Button */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[
              styles.joinButton,
              !isAvailable && styles.disabledButton
            ]}
            disabled={!isAvailable}
          >
            <Text style={[
              styles.joinButtonText,
              !isAvailable && styles.disabledButtonText
            ]}>
              {isAvailable ? '🎯 Join League' : '❌ League Full'}
            </Text>
          </TouchableOpacity>
        </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#2563eb',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 60,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  leagueHeader: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  leagueName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  availabilityBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    fontSize: 14,
    fontWeight: '600',
  },
  availableBadge: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  fullBadge: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
  },
  detailsGrid: {
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  actionSection: {
    marginTop: 20,
  },
  joinButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  joinButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledButtonText: {
    color: '#e5e7eb',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
});
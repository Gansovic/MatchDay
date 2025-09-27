import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { TeamService, TeamDetails, TeamMember, TeamMatch } from '../services/TeamService';

type TeamDetailsRouteParams = {
  TeamDetails: {
    teamId: string;
    teamName?: string;
  };
};

type TeamDetailsRouteProp = RouteProp<TeamDetailsRouteParams, 'TeamDetails'>;

const MemberCard: React.FC<{ member: TeamMember }> = ({ member }) => {
  return (
    <View style={styles.memberCard}>
      <View style={styles.memberHeader}>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>
            {member.displayName}
            {member.isCaptain && ' (C)'}
          </Text>
          <Text style={styles.memberPosition}>
            {member.position || 'No position set'}
          </Text>
        </View>
        {member.jerseyNumber && (
          <View style={styles.jerseyNumber}>
            <Text style={styles.jerseyText}>#{member.jerseyNumber}</Text>
          </View>
        )}
      </View>
      <View style={styles.memberStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{member.stats.gamesPlayed}</Text>
          <Text style={styles.statLabel}>Games</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{member.stats.goals}</Text>
          <Text style={styles.statLabel}>Goals</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{member.stats.assists}</Text>
          <Text style={styles.statLabel}>Assists</Text>
        </View>
      </View>
    </View>
  );
};

const MatchCard: React.FC<{ match: TeamMatch }> = ({ match }) => {
  const getMatchResult = () => {
    if (match.status === 'upcoming') return null;

    const teamScore = match.isHome ? match.homeScore : match.awayScore;
    const opponentScore = match.isHome ? match.awayScore : match.homeScore;

    if (teamScore === undefined || opponentScore === undefined) return null;

    if (teamScore > opponentScore) return 'W';
    if (teamScore < opponentScore) return 'L';
    return 'D';
  };

  const result = getMatchResult();
  const resultStyle = result === 'W' ? styles.winResult : result === 'L' ? styles.lossResult : styles.drawResult;

  return (
    <View style={styles.matchCard}>
      <View style={styles.matchHeader}>
        <Text style={styles.matchOpponent}>
          {match.isHome ? 'vs' : '@'} {match.opponent}
        </Text>
        <Text style={styles.matchDate}>
          {new Date(match.date).toLocaleDateString()}
        </Text>
      </View>
      {match.status === 'completed' && match.homeScore !== undefined && match.awayScore !== undefined && (
        <View style={styles.matchResult}>
          <Text style={styles.matchScore}>
            {match.homeScore} - {match.awayScore}
          </Text>
          {result && (
            <View style={[styles.resultBadge, resultStyle]}>
              <Text style={styles.resultText}>{result}</Text>
            </View>
          )}
        </View>
      )}
      {match.status === 'upcoming' && (
        <Text style={styles.upcomingText}>Upcoming Match</Text>
      )}
    </View>
  );
};

export const TeamDetailsScreen: React.FC = () => {
  const route = useRoute<TeamDetailsRouteProp>();
  const navigation = useNavigation();
  const { teamId, teamName } = route.params;

  const { data: team, isLoading, error } = useQuery({
    queryKey: ['team-details', teamId],
    queryFn: () => TeamService.getInstance().getTeamDetails(teamId),
  });

  const getTeamColorIcon = (color?: string) => {
    if (!color) return '⚽';
    const colorMap: { [key: string]: string } = {
      blue: '🔵',
      red: '🔴',
      green: '🟢',
      yellow: '🟡',
      orange: '🟠',
      purple: '🟣',
      black: '⚫',
      white: '⚪',
    };
    return colorMap[color.toLowerCase()] || '⚽';
  };

  const getLeagueTypeEmoji = (type: string) => {
    switch (type.toLowerCase()) {
      case 'competitive': return '🏆';
      case 'casual': return '⚽';
      case 'friendly': return '🤝';
      default: return '🎯';
    }
  };

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

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading team details...</Text>
      </View>
    );
  }

  if (error || !team) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorIcon}>❌</Text>
        <Text style={styles.errorTitle}>Team Not Found</Text>
        <Text style={styles.errorText}>
          Sorry, we couldn't load the team details. Please try again.
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Team Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Team Header */}
        <View style={styles.teamHeader}>
          <Text style={styles.teamName}>
            {getTeamColorIcon(team.teamColor)} {team.name}
          </Text>
          <Text style={styles.leagueInfo}>
            {getLeagueTypeEmoji(team.league.leagueType)} {team.league.name}
          </Text>
          <Text style={styles.sportInfo}>
            {getSportIcon(team.league.sportType)} {team.league.sportType.charAt(0).toUpperCase() + team.league.sportType.slice(1)}
          </Text>
          {team.isRecruiting && (
            <View style={styles.recruitingBadge}>
              <Text style={styles.recruitingText}>🔍 Recruiting Players</Text>
            </View>
          )}
        </View>

        {/* Team Description */}
        {team.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About This Team</Text>
            <Text style={styles.description}>{team.description}</Text>
          </View>
        )}

        {/* Team Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Team Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{team.stats.totalGames}</Text>
              <Text style={styles.statLabel}>Games Played</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{team.stats.winPercentage}%</Text>
              <Text style={styles.statLabel}>Win Rate</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{team.stats.wins}</Text>
              <Text style={styles.statLabel}>Wins</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{team.stats.goalsFor}</Text>
              <Text style={styles.statLabel}>Goals For</Text>
            </View>
          </View>
        </View>

        {/* Team Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Team Information</Text>
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailIcon}>👑</Text>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Captain</Text>
                <Text style={styles.detailValue}>{team.captain.displayName}</Text>
              </View>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailIcon}>👥</Text>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Team Size</Text>
                <Text style={styles.detailValue}>
                  {team.members.length} / {team.maxPlayers} players
                </Text>
              </View>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailIcon}>📅</Text>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Founded</Text>
                <Text style={styles.detailValue}>
                  {new Date(team.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Team Members */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Team Members ({team.members.length})</Text>
          {team.members.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </View>

        {/* Recent Matches */}
        {team.recentMatches.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Matches</Text>
            {team.recentMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </View>
        )}

        {/* Upcoming Matches */}
        {team.upcomingMatches.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming Matches</Text>
            {team.upcomingMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
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
  teamHeader: {
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
  teamName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  leagueInfo: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '500',
    marginBottom: 4,
  },
  sportInfo: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  recruitingBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  recruitingText: {
    color: '#166534',
    fontSize: 14,
    fontWeight: '600',
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    width: '47%',
    alignItems: 'center',
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
    textAlign: 'center',
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
  memberCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  memberPosition: {
    fontSize: 14,
    color: '#6b7280',
  },
  jerseyNumber: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 32,
    alignItems: 'center',
  },
  jerseyText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  memberStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  matchCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  matchOpponent: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  matchDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  matchResult: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  matchScore: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  resultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 24,
    alignItems: 'center',
  },
  winResult: {
    backgroundColor: '#dcfce7',
  },
  lossResult: {
    backgroundColor: '#fee2e2',
  },
  drawResult: {
    backgroundColor: '#fef3c7',
  },
  resultText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  upcomingText: {
    fontSize: 14,
    color: '#2563eb',
    fontStyle: 'italic',
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
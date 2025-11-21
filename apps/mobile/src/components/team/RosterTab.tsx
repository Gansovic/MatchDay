import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { TeamMember } from '../../hooks/useTeamData';

interface RosterTabProps {
  members: TeamMember[];
  isCaptain: boolean;
  onInvitePlayer?: () => void;
  onRemoveMember?: (memberId: string) => void;
}

export const RosterTab: React.FC<RosterTabProps> = ({
  members,
  isCaptain,
  onInvitePlayer,
  onRemoveMember,
}) => {
  const [imageErrors, setImageErrors] = React.useState<Set<string>>(new Set());

  const handleImageError = (memberId: string) => {
    setImageErrors((prev) => new Set(prev).add(memberId));
  };

  if (members.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No team members yet</Text>
        {isCaptain && onInvitePlayer && (
          <TouchableOpacity style={styles.inviteButton} onPress={onInvitePlayer}>
            <Text style={styles.inviteButtonText}>Invite Players</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Captain Actions */}
      {isCaptain && onInvitePlayer && (
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.actionButton} onPress={onInvitePlayer}>
            <View style={styles.actionIcon} />
            <Text style={styles.actionButtonText}>Invite Player</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Roster Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Roster ({members.length})</Text>
      </View>

      {/* Members List */}
      <View style={styles.membersList}>
        {members.map((member) => {
          const showFallback = !member.user_profile.avatar_url || imageErrors.has(member.id);

          return (
            <View key={member.id} style={styles.memberCard}>
              <View style={styles.memberAvatar}>
                {showFallback ? (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarText}>
                      {member.user_profile.display_name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                ) : (
                  <Image
                    source={{ uri: member.user_profile.avatar_url }}
                    style={styles.avatarImage}
                    onError={() => handleImageError(member.id)}
                  />
                )}
              </View>

              <View style={styles.memberInfo}>
                <View style={styles.memberNameRow}>
                  <Text style={styles.memberName}>{member.user_profile.display_name}</Text>
                  {member.is_captain && (
                    <View style={styles.captainBadgeSmall}>
                      <Text style={styles.captainBadgeTextSmall}>C</Text>
                    </View>
                  )}
                </View>
                {member.position && (
                  <Text style={styles.memberPosition}>{member.position}</Text>
                )}

                {/* Player Stats */}
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{member.stats.matches_played}</Text>
                    <Text style={styles.statLabel}>Matches</Text>
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

              <View style={styles.memberRight}>
                {member.jersey_number && (
                  <View style={styles.jerseyNumber}>
                    <Text style={styles.jerseyText}>#{member.jersey_number}</Text>
                  </View>
                )}

                {isCaptain && !member.is_captain && onRemoveMember && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => onRemoveMember(member.id)}
                  >
                    <View style={styles.removeIcon} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  content: {
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
  },
  actionsSection: {
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionIcon: {
    width: 20,
    height: 20,
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  inviteButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  inviteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  membersList: {
    gap: 12,
  },
  memberCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  captainBadgeSmall: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captainBadgeTextSmall: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  memberEmail: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  memberPosition: {
    fontSize: 12,
    color: '#3b82f6',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 10,
    color: '#999',
  },
  memberRight: {
    alignItems: 'center',
    gap: 8,
  },
  jerseyNumber: {
    backgroundColor: '#0a0a0a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  jerseyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  removeButton: {
    padding: 4,
  },
  removeIcon: {
    width: 16,
    height: 16,
    backgroundColor: '#ef4444',
    borderRadius: 8,
  },
});

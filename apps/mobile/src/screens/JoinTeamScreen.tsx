import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTeamInvitation } from '../hooks/useTeamInvitation';
import { useAuth } from '../contexts/AuthContext';

interface InvitationDetails {
  id: string;
  team: {
    id: string;
    name: string;
    teamColor: string | null;
  };
  invitedBy: {
    id: string;
    name: string;
  };
  position: string | null;
  jerseyNumber: number | null;
  message: string | null;
  expiresAt: string;
  status: string;
  isExpired: boolean;
}

export const JoinTeamScreen = ({ route, navigation }: any) => {
  const { code: initialCode } = route.params || {};
  const { user } = useAuth();
  const { getInvitationDetails, acceptInvitation, loading, error, clearError } =
    useTeamInvitation();

  const [code, setCode] = useState(initialCode || '');
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [joining, setJoining] = useState(false);

  const handleLookup = useCallback(async () => {
    if (!code.trim()) {
      Alert.alert('Error', 'Please enter an invitation code');
      return;
    }

    clearError();
    setLookupLoading(true);

    const details = await getInvitationDetails(code.trim());
    if (details) {
      setInvitation(details);
    }

    setLookupLoading(false);
  }, [code, getInvitationDetails, clearError]);

  const handleAccept = useCallback(async () => {
    if (!invitation) return;

    Alert.alert(
      'Join Team',
      `Are you sure you want to join ${invitation.team.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Join',
          onPress: async () => {
            setJoining(true);
            const success = await acceptInvitation(code);
            setJoining(false);

            if (success) {
              Alert.alert(
                'Success!',
                `You have successfully joined ${invitation.team.name}!`,
                [
                  {
                    text: 'View Team',
                    onPress: () => {
                      navigation.replace('TeamDetails', { teamId: invitation.team.id });
                    },
                  },
                ]
              );
            }
          },
        },
      ]
    );
  }, [invitation, code, acceptInvitation, navigation]);

  const handleDecline = useCallback(() => {
    Alert.alert('Decline Invitation', 'Are you sure you want to decline this invitation?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Decline',
        style: 'destructive',
        onPress: () => {
          navigation.goBack();
        },
      },
    ]);
  }, [navigation]);

  // Auto-lookup if code is provided via deep link
  useEffect(() => {
    if (initialCode && !invitation) {
      handleLookup();
    }
  }, [initialCode]);

  const formatExpiryDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const isLoading = loading || lookupLoading;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {!invitation ? (
          // Code Entry View
          <View style={styles.entryContainer}>
            <View style={styles.headerSection}>
              <Text style={styles.title}>Join a Team</Text>
              <Text style={styles.subtitle}>
                Enter the invitation code you received from your team captain
              </Text>
            </View>

            <View style={styles.codeInputContainer}>
              <TextInput
                style={styles.codeInput}
                value={code}
                onChangeText={(text) => setCode(text.toUpperCase())}
                placeholder="XXXXXX"
                placeholderTextColor="#666"
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={6}
                editable={!isLoading}
              />
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.lookupButton,
                (isLoading || code.length < 6) && styles.disabledButton,
              ]}
              onPress={handleLookup}
              disabled={isLoading || code.length < 6}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.lookupButtonText}>Look Up Invitation</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          // Invitation Details View
          <View style={styles.detailsContainer}>
            <View style={styles.teamCard}>
              <View
                style={[
                  styles.teamColorBadge,
                  { backgroundColor: invitation.team.teamColor || '#3b82f6' },
                ]}
              />
              <Text style={styles.teamName}>{invitation.team.name}</Text>
              <Text style={styles.invitedByText}>Invited by {invitation.invitedBy.name}</Text>
            </View>

            {(invitation.position || invitation.jerseyNumber) && (
              <View style={styles.assignmentCard}>
                <Text style={styles.cardTitle}>Your Assignment</Text>
                {invitation.position && (
                  <View style={styles.assignmentRow}>
                    <Text style={styles.assignmentLabel}>Position</Text>
                    <Text style={styles.assignmentValue}>{invitation.position}</Text>
                  </View>
                )}
                {invitation.jerseyNumber && (
                  <View style={styles.assignmentRow}>
                    <Text style={styles.assignmentLabel}>Jersey Number</Text>
                    <View style={styles.jerseyBadge}>
                      <Text style={styles.jerseyNumber}>{invitation.jerseyNumber}</Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {invitation.message && (
              <View style={styles.messageCard}>
                <Text style={styles.cardTitle}>Message from Captain</Text>
                <Text style={styles.messageText}>{invitation.message}</Text>
              </View>
            )}

            <View style={styles.expiryCard}>
              <Text style={styles.expiryLabel}>This invitation expires on</Text>
              <Text style={styles.expiryValue}>{formatExpiryDate(invitation.expiresAt)}</Text>
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.acceptButton, joining && styles.disabledButton]}
                onPress={handleAccept}
                disabled={joining}
              >
                {joining ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.acceptButtonText}>Accept & Join Team</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.declineButton}
                onPress={handleDecline}
                disabled={joining}
              >
                <Text style={styles.declineButtonText}>Decline</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.tryAnotherButton}
              onPress={() => {
                setInvitation(null);
                setCode('');
                clearError();
              }}
            >
              <Text style={styles.tryAnotherText}>Try Another Code</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    flexGrow: 1,
  },
  entryContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 24,
  },
  headerSection: {
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
  },
  codeInputContainer: {
    alignItems: 'center',
  },
  codeInput: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderRadius: 16,
    padding: 20,
    textAlign: 'center',
    letterSpacing: 8,
    width: '100%',
    maxWidth: 280,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    textAlign: 'center',
  },
  lookupButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  lookupButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  detailsContainer: {
    gap: 16,
  },
  teamCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  teamColorBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  teamName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  invitedByText: {
    fontSize: 14,
    color: '#999',
  },
  assignmentCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  assignmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assignmentLabel: {
    fontSize: 14,
    color: '#999',
  },
  assignmentValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  jerseyBadge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  jerseyNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  messageCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  messageText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  expiryCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  expiryLabel: {
    fontSize: 12,
    color: '#f59e0b',
  },
  expiryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f59e0b',
  },
  actionButtons: {
    gap: 12,
    marginTop: 8,
  },
  acceptButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  declineButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  tryAnotherButton: {
    alignItems: 'center',
    padding: 12,
  },
  tryAnotherText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
});

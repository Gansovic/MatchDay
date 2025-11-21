import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Share,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useTeamInvitation } from '../../hooks/useTeamInvitation';

interface TeamInviteModalProps {
  visible: boolean;
  onClose: () => void;
  teamId: string;
  teamName: string;
}

interface InvitationResult {
  id: string;
  code: string;
  expiresAt: string;
  teamName: string;
  shareMessage: string;
}

export const TeamInviteModal: React.FC<TeamInviteModalProps> = ({
  visible,
  onClose,
  teamId,
  teamName,
}) => {
  const { createInvitation, loading, error, clearError } = useTeamInvitation();

  const [invitation, setInvitation] = useState<InvitationResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const resetForm = useCallback(() => {
    setInvitation(null);
    setCopied(false);
    setHasGenerated(false);
    clearError();
  }, [clearError]);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const handleGenerateInvitation = useCallback(async () => {
    const result = await createInvitation({
      teamId,
    });

    if (result) {
      setInvitation(result);
    }
    setHasGenerated(true);
  }, [createInvitation, teamId]);

  // Auto-generate invitation when modal opens
  useEffect(() => {
    if (visible && !invitation && !hasGenerated && !loading) {
      handleGenerateInvitation();
    }
  }, [visible, invitation, hasGenerated, loading, handleGenerateInvitation]);

  const handleCopyCode = useCallback(async () => {
    if (invitation) {
      await Clipboard.setStringAsync(invitation.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [invitation]);

  const handleShare = useCallback(async () => {
    if (!invitation) return;

    try {
      await Share.share({
        message: invitation.shareMessage,
      });
    } catch (err) {
      console.error('Share error:', err);
    }
  }, [invitation]);

  const formatExpiryDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Invite Player</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {loading && !invitation ? (
              // Loading View
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={styles.loadingText}>Creating invitation...</Text>
              </View>
            ) : error && !invitation ? (
              // Error View
              <View style={styles.errorView}>
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => {
                    setHasGenerated(false);
                    clearError();
                  }}
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : invitation ? (
              // Result View
              <View style={styles.resultContainer}>
                <View style={styles.successBadge}>
                  <Text style={styles.successIcon}>✓</Text>
                  <Text style={styles.successText}>Invitation Created!</Text>
                </View>

                <View style={styles.codeContainer}>
                  <Text style={styles.codeLabel}>Invitation Code</Text>
                  <Text style={styles.code}>{invitation.code}</Text>
                  <TouchableOpacity style={styles.copyButton} onPress={handleCopyCode}>
                    <Text style={styles.copyButtonText}>
                      {copied ? '✓ Copied!' : 'Copy Code'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.expiryContainer}>
                  <Text style={styles.expiryLabel}>Expires</Text>
                  <Text style={styles.expiryValue}>{formatExpiryDate(invitation.expiresAt)}</Text>
                </View>

                <View style={styles.shareMessageContainer}>
                  <Text style={styles.shareMessageLabel}>Share Message</Text>
                  <View style={styles.shareMessageBox}>
                    <Text style={styles.shareMessageText}>{invitation.shareMessage}</Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                  <Text style={styles.shareButtonText}>Share Invitation</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.createAnotherButton} onPress={resetForm}>
                  <Text style={styles.createAnotherText}>Create Another Invitation</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#999',
    fontWeight: 'bold',
  },
  scrollView: {
    flexGrow: 0,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#999',
  },
  errorView: {
    padding: 20,
    gap: 16,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  formContainer: {
    padding: 20,
    gap: 16,
  },
  description: {
    fontSize: 14,
    color: '#999',
    lineHeight: 20,
    marginBottom: 8,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  input: {
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#fff',
  },
  messageInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
  },
  generateButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  resultContainer: {
    padding: 20,
    gap: 20,
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  successIcon: {
    fontSize: 18,
    color: '#10b981',
    fontWeight: 'bold',
  },
  successText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
  },
  codeContainer: {
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  codeLabel: {
    fontSize: 14,
    color: '#999',
  },
  code: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#3b82f6',
    letterSpacing: 4,
  },
  copyButton: {
    backgroundColor: '#333',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  copyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  expiryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  expiryLabel: {
    fontSize: 14,
    color: '#999',
  },
  expiryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f59e0b',
  },
  shareMessageContainer: {
    gap: 8,
  },
  shareMessageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  shareMessageBox: {
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  shareMessageText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
  shareButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  createAnotherButton: {
    alignItems: 'center',
    padding: 12,
  },
  createAnotherText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
});

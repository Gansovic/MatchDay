import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';

interface DeleteTeamConfirmationProps {
  teamName: string;
  onDelete: () => void;
  isLoading?: boolean;
}

export const DeleteTeamConfirmation: React.FC<DeleteTeamConfirmationProps> = ({
  teamName,
  onDelete,
  isLoading = false,
}) => {
  const handleDeletePress = () => {
    Alert.alert(
      'Delete Team',
      `Are you sure you want to delete "${teamName}"? This action cannot be undone and will remove all team data, including members, stats, and matches.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: onDelete,
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Danger Zone</Text>
      <View style={styles.warningBox}>
        <Text style={styles.warningText}>
          Deleting this team will permanently remove all associated data including team members,
          statistics, and match history.
        </Text>
        <TouchableOpacity
          style={[styles.deleteButton, isLoading && styles.deleteButtonDisabled]}
          onPress={handleDeletePress}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.deleteButtonText}>Delete Team</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  warningBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ef4444',
    gap: 16,
  },
  warningText: {
    fontSize: 14,
    color: '#f87171',
    lineHeight: 20,
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  deleteButtonDisabled: {
    opacity: 0.7,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
});

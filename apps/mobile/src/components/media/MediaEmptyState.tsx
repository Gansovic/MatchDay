import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MediaEmptyStateProps {
  message?: string;
}

export const MediaEmptyState: React.FC<MediaEmptyStateProps> = ({
  message = 'No media uploaded yet',
}) => {
  return (
    <View style={styles.container}>
      <Ionicons name="images-outline" size={64} color="#666" />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  message: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
});

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { generateColorFromString } from '../../lib/utils/icon-helpers';

interface ProfileAvatarUploaderProps {
  currentAvatarUrl?: string | null;
  displayName: string;
  isLoading?: boolean;
  onUploadPress: () => void;
}

export const ProfileAvatarUploader: React.FC<ProfileAvatarUploaderProps> = ({
  currentAvatarUrl,
  displayName,
  isLoading = false,
  onUploadPress,
}) => {
  const [imageError, setImageError] = React.useState(false);
  const showFallback = !currentAvatarUrl || imageError;
  const fallbackColor = generateColorFromString(displayName || 'User');

  // Reset error when URL changes
  React.useEffect(() => {
    setImageError(false);
  }, [currentAvatarUrl]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Profile Picture</Text>

      <View style={styles.uploadArea}>
        {/* Current Avatar or Fallback */}
        <View style={styles.avatarContainer}>
          {showFallback ? (
            <View style={[styles.avatarFallback, { backgroundColor: fallbackColor }]}>
              <Text style={styles.avatarText}>
                {displayName ? displayName.charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
          ) : (
            <Image
              source={{ uri: currentAvatarUrl! }}
              style={styles.avatar}
              onError={() => setImageError(true)}
            />
          )}
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          )}
        </View>

        {/* Upload Button */}
        <View style={styles.uploadInfo}>
          <TouchableOpacity
            style={[styles.uploadButton, isLoading && styles.uploadButtonDisabled]}
            onPress={onUploadPress}
            disabled={isLoading}
          >
            <Text style={styles.uploadButtonText}>
              {currentAvatarUrl && !imageError ? 'Change Picture' : 'Upload Picture'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.uploadHint}>Square image recommended</Text>
          <Text style={styles.uploadHint}>Max size: 5MB</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  uploadArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarFallback: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadInfo: {
    flex: 1,
    gap: 4,
  },
  uploadButton: {
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  uploadButtonDisabled: {
    opacity: 0.5,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  uploadHint: {
    fontSize: 12,
    color: '#666',
  },
});

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { generateColorFromString } from '../../lib/utils/icon-helpers';

interface TeamLogoUploaderProps {
  currentLogoUrl?: string | null;
  teamName: string;
  teamColor: string;
  isLoading?: boolean;
  onUploadPress: () => void;
}

export const TeamLogoUploader: React.FC<TeamLogoUploaderProps> = ({
  currentLogoUrl,
  teamName,
  teamColor,
  isLoading = false,
  onUploadPress,
}) => {
  const [imageError, setImageError] = React.useState(false);
  const showFallback = !currentLogoUrl || imageError;
  const fallbackColor = teamColor || generateColorFromString(teamName);

  // Reset error when URL changes
  React.useEffect(() => {
    setImageError(false);
  }, [currentLogoUrl]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Team Logo</Text>

      <View style={styles.uploadArea}>
        {/* Current Logo or Fallback */}
        <View style={styles.logoContainer}>
          {showFallback ? (
            <View style={[styles.logoFallback, { backgroundColor: fallbackColor }]}>
              <Text style={styles.logoText}>
                {teamName ? teamName.charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
          ) : (
            <Image
              source={{ uri: currentLogoUrl! }}
              style={styles.logo}
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
              {currentLogoUrl && !imageError ? 'Change Logo' : 'Upload Logo'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.uploadHint}>Square image recommended</Text>
          <Text style={styles.uploadHint}>Max size: 10MB</Text>
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
  logoContainer: {
    width: 80,
    height: 80,
    position: 'relative',
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  logoFallback: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
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

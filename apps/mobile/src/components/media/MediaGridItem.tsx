import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { MediaWithUrl } from '../../types/media.types';

interface MediaGridItemProps {
  media: MediaWithUrl;
  size: number;
  onPress: () => void;
}

export const MediaGridItem: React.FC<MediaGridItemProps> = ({
  media,
  size,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, { width: size, height: size }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: media.url }}
        style={styles.image}
        contentFit="cover"
        transition={200}
        cachePolicy="memory-disk"
      />

      {media.media_type === 'video' && (
        <View style={styles.videoIndicator}>
          <Ionicons name="play-circle" size={24} color="#fff" />
        </View>
      )}

      {media.is_repost && (
        <View style={styles.repostBadge}>
          <Ionicons name="repeat" size={12} color="#3b82f6" />
        </View>
      )}

      <View style={styles.privacyBadge}>
        <Ionicons
          name={media.is_public ? 'globe-outline' : 'lock-closed'}
          size={12}
          color={media.is_public ? '#22c55e' : '#f97316'}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    margin: 4,
  },
  image: {
    flex: 1,
  },
  videoIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -12 }, { translateY: -12 }],
  },
  repostBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  privacyBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    padding: 4,
  },
});

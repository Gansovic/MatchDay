import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useMediaGallery } from '../../hooks/useMediaGallery';
import { MediaDetailModal } from '../media/MediaDetailModal';
import { MediaWithUrl } from '../../types/media.types';

const { width } = Dimensions.get('window');
const CONTAINER_PADDING = 16;
const DASHBOARD_PADDING = 20;
const CAROUSEL_SPACING = 12;
// Calculate carousel item width: full container width minus padding
const CAROUSEL_WIDTH = width - (DASHBOARD_PADDING * 2) - (CONTAINER_PADDING * 2);
const CAROUSEL_HEIGHT = CAROUSEL_WIDTH * 0.6; // 16:9.6 aspect ratio

export const MediaPreviewGrid: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [selectedMedia, setSelectedMedia] = useState<MediaWithUrl | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // Fetch user's media (4 most recent)
  const { media, loading, error, refetch } = useMediaGallery({
    player_id: user?.id,
    context_type: 'player_media',
    limit: 4,
  });

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [user?.id])
  );

  // Count recent reposts (< 7 days)
  const newRepostsCount = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return media.filter((item) => {
      if (!item.is_repost) return false;
      const createdAt = new Date(item.created_at);
      return createdAt >= sevenDaysAgo;
    }).length;
  }, [media]);

  const handleViewAll = () => {
    navigation.navigate('PlayerMedia' as never, {
      playerId: user?.id,
      playerName: user?.email?.split('@')[0] || 'My Gallery',
      isOwnProfile: true,
    } as never);
  };

  const handleThumbnailPress = (item: MediaWithUrl) => {
    setSelectedMedia(item);
  };

  if (loading && media.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="images" size={20} color="#3b82f6" />
            <Text style={styles.headerTitle}>My Media Gallery</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="images" size={20} color="#3b82f6" />
            <Text style={styles.headerTitle}>My Media Gallery</Text>
          </View>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={40} color="#ef4444" />
          <Text style={styles.errorText}>Failed to load media</Text>
        </View>
      </View>
    );
  }

  // Empty state
  if (media.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="images" size={20} color="#3b82f6" />
            <Text style={styles.headerTitle}>My Media Gallery</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.emptyState} onPress={handleViewAll}>
          <Ionicons name="images-outline" size={64} color="#666" />
          <Text style={styles.emptyTitle}>No media yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap to upload photos and videos
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="images" size={20} color="#3b82f6" />
          <Text style={styles.headerTitle}>My Media Gallery</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.mediaCount}>{media.length >= 4 ? '4+' : media.length} items</Text>
          {newRepostsCount > 0 && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>{newRepostsCount} new</Text>
            </View>
          )}
        </View>
      </View>

      {/* Horizontal Carousel */}
      <View style={styles.carouselContainer}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={(event) => {
            const offsetX = event.nativeEvent.contentOffset.x;
            const index = Math.round(offsetX / CAROUSEL_WIDTH);
            setCurrentIndex(index);
          }}
          scrollEventThrottle={16}
          decelerationRate="fast"
          snapToInterval={CAROUSEL_WIDTH}
          snapToAlignment="center"
          style={styles.carousel}
        >
          {media.slice(0, 4).map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.carouselItem, { width: CAROUSEL_WIDTH, height: CAROUSEL_HEIGHT }]}
              onPress={() => handleThumbnailPress(item)}
              activeOpacity={0.9}
            >
              <Image
                source={{ uri: item.url }}
                style={styles.carouselImage}
                resizeMode="cover"
              />
              {/* Video indicator */}
              {item.media_type === 'video' && (
                <View style={styles.videoIndicator}>
                  <Ionicons name="play-circle" size={48} color="#fff" />
                </View>
              )}
              {/* Repost badge */}
              {item.is_repost && (
                <View style={styles.repostBadge}>
                  <Ionicons name="repeat" size={16} color="#fff" />
                  <Text style={styles.repostBadgeText}>Reposted</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Pagination dots */}
        {media.length > 1 && (
          <View style={styles.pagination}>
            {media.slice(0, 4).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  currentIndex === index && styles.paginationDotActive,
                ]}
              />
            ))}
          </View>
        )}
      </View>

      {/* View All Button */}
      <TouchableOpacity style={styles.viewAllButton} onPress={handleViewAll}>
        <Text style={styles.viewAllText}>View All</Text>
        <Ionicons name="chevron-forward" size={20} color="#3b82f6" />
      </TouchableOpacity>

      {/* Media Detail Modal */}
      {selectedMedia && (
        <MediaDetailModal
          media={selectedMedia}
          visible={!!selectedMedia}
          onClose={() => setSelectedMedia(null)}
          onDelete={undefined} // Can't delete from preview
          canDelete={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mediaCount: {
    fontSize: 13,
    color: '#999',
    fontWeight: '600',
  },
  newBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  newBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  carouselContainer: {
    marginBottom: 16,
  },
  carousel: {
    marginBottom: 12,
  },
  carouselItem: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#2a2a2a',
  },
  carouselImage: {
    width: '100%',
    height: '100%',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#333',
  },
  paginationDotActive: {
    backgroundColor: '#3b82f6',
    width: 24,
  },
  videoIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  repostBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  repostBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  viewAllText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3b82f6',
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  errorContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#999',
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#999',
  },
});

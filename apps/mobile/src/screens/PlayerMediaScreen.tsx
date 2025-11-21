import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useMediaGallery } from '../hooks/useMediaGallery';
import { useMediaUpload } from '../hooks/useMediaUpload';
import { useMediaDelete } from '../hooks/useMediaDelete';
import { useMediaRepost } from '../hooks/useMediaRepost';
import { MediaGallery } from '../components/media/MediaGallery';

type MediaTab = 'all' | 'uploads' | 'reposts';

interface PlayerMediaScreenProps {
  route: {
    params: {
      playerId: string;
      playerName?: string;
      isOwnProfile?: boolean;
    };
  };
}

export const PlayerMediaScreen: React.FC<PlayerMediaScreenProps> = ({ route }) => {
  const { playerId, playerName = 'Player Media', isOwnProfile = false } = route.params;
  const { user } = useAuth();
  const [mediaFilter, setMediaFilter] = useState<'all' | 'image' | 'video'>('all');
  const [tab, setTab] = useState<MediaTab>('all');

  // Fetch all player media
  const { media: allMedia, loading, error, refetch } = useMediaGallery({
    player_id: playerId,
    context_type: 'player_media',
  });

  const { pickAndUploadMedia, isLoading: isUploading } = useMediaUpload();
  const { deleteMedia, isDeleting } = useMediaDelete();
  const { repostMedia, isReposting } = useMediaRepost();

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [playerId])
  );

  // Filter media based on tab
  const tabFilteredMedia = useMemo(() => {
    switch (tab) {
      case 'uploads':
        return allMedia.filter((m) => !m.is_repost);
      case 'reposts':
        return allMedia.filter((m) => m.is_repost);
      default:
        return allMedia;
    }
  }, [allMedia, tab]);

  // Filter media by type (image/video)
  const filteredMedia = useMemo(() => {
    if (mediaFilter === 'all') return tabFilteredMedia;
    return tabFilteredMedia.filter((item) => item.media_type === mediaFilter);
  }, [tabFilteredMedia, mediaFilter]);

  // Calculate counts for media type filter
  const counts = useMemo(() => {
    return {
      all: tabFilteredMedia.length,
      image: tabFilteredMedia.filter((m) => m.media_type === 'image').length,
      video: tabFilteredMedia.filter((m) => m.media_type === 'video').length,
    };
  }, [tabFilteredMedia]);

  // Calculate tab counts
  const tabCounts = useMemo(() => {
    return {
      all: allMedia.length,
      uploads: allMedia.filter((m) => !m.is_repost).length,
      reposts: allMedia.filter((m) => m.is_repost).length,
    };
  }, [allMedia]);

  const handleUpload = async () => {
    if (!isOwnProfile) {
      Alert.alert('Permission Denied', 'You can only upload to your own gallery');
      return;
    }

    const result = await pickAndUploadMedia({
      context_type: 'player_media',
      player_id: playerId,
      is_public: true,
    });

    if (result) {
      Alert.alert('Success', 'Media uploaded successfully');
      refetch();
    }
  };

  const handleDelete = async (mediaId: string) => {
    const success = await deleteMedia(mediaId);
    if (success) {
      Alert.alert('Success', 'Media deleted successfully');
      refetch();
    } else {
      Alert.alert('Error', 'Failed to delete media');
    }
  };

  const handleRepost = async (mediaId: string) => {
    const result = await repostMedia(mediaId);
    if (result.success) {
      Alert.alert('Success', 'Media reposted to your gallery');
      refetch();
    } else {
      Alert.alert('Error', result.error || 'Failed to repost media');
    }
  };

  if (loading && allMedia.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refetch}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIndicator} />
          <Text style={styles.headerTitle}>{playerName}</Text>
        </View>
        {isOwnProfile && (
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handleUpload}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
                <Text style={styles.uploadButtonText}>Upload</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, tab === 'all' && styles.tabActive]}
          onPress={() => setTab('all')}
        >
          <Text style={[styles.tabText, tab === 'all' && styles.tabTextActive]}>
            All ({tabCounts.all})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'uploads' && styles.tabActive]}
          onPress={() => setTab('uploads')}
        >
          <Text style={[styles.tabText, tab === 'uploads' && styles.tabTextActive]}>
            Uploads ({tabCounts.uploads})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'reposts' && styles.tabActive]}
          onPress={() => setTab('reposts')}
        >
          <Ionicons
            name="repeat"
            size={16}
            color={tab === 'reposts' ? '#3b82f6' : '#999'}
          />
          <Text style={[styles.tabText, tab === 'reposts' && styles.tabTextActive]}>
            Reposts ({tabCounts.reposts})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Media Gallery */}
      <MediaGallery
        media={filteredMedia}
        counts={counts}
        filter={mediaFilter}
        onFilterChange={setMediaFilter}
        onDelete={handleDelete}
        onRepost={!isOwnProfile ? handleRepost : undefined}
        canDelete={isOwnProfile}
        canRepost={!isOwnProfile}
        onRefresh={refetch}
        isRefreshing={loading}
        emptyMessage={
          tab === 'uploads'
            ? isOwnProfile
              ? 'No uploads yet. Upload your first media!'
              : 'No uploads yet'
            : tab === 'reposts'
            ? 'No reposts yet'
            : isOwnProfile
            ? 'No media yet. Upload your first media!'
            : 'No media available'
        }
      />

      {/* Loading overlay for delete/repost */}
      {(isDeleting || isReposting) && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.overlayText}>
            {isDeleting ? 'Deleting...' : 'Reposting...'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerIndicator: {
    width: 4,
    height: 24,
    backgroundColor: '#3b82f6',
    borderRadius: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  tabTextActive: {
    color: '#3b82f6',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  overlayText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});

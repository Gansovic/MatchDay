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

interface MatchMediaScreenProps {
  route: {
    params: {
      matchId: string;
      matchTitle?: string;
      isAdmin?: boolean;
    };
  };
}

export const MatchMediaScreen: React.FC<MatchMediaScreenProps> = ({ route }) => {
  const { matchId, matchTitle = 'Match Media', isAdmin = false } = route.params;
  const { user } = useAuth();
  const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all');

  const { media, loading, error, refetch } = useMediaGallery({
    match_id: matchId,
    context_type: 'match_media',
  });

  const { pickAndUploadMedia, isLoading: isUploading } = useMediaUpload();
  const { deleteMedia, isDeleting } = useMediaDelete();
  const { repostMedia, isReposting } = useMediaRepost();

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [matchId])
  );

  // Filter media by type
  const filteredMedia = useMemo(() => {
    if (filter === 'all') return media;
    return media.filter((item) => item.media_type === filter);
  }, [media, filter]);

  // Calculate counts
  const counts = useMemo(() => {
    return {
      all: media.length,
      image: media.filter((m) => m.media_type === 'image').length,
      video: media.filter((m) => m.media_type === 'video').length,
    };
  }, [media]);

  const handleUpload = async () => {
    if (!isAdmin) {
      Alert.alert('Permission Denied', 'Only administrators can upload match media');
      return;
    }

    const result = await pickAndUploadMedia({
      context_type: 'match_media',
      match_id: matchId,
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
    } else {
      Alert.alert('Error', result.error || 'Failed to repost media');
    }
  };

  // Check if user can delete (admin or uploader)
  const canDelete = useCallback((mediaItem: any) => {
    return isAdmin || mediaItem.uploaded_by === user?.id;
  }, [isAdmin, user?.id]);

  if (loading && media.length === 0) {
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
          <Text style={styles.headerTitle}>{matchTitle}</Text>
        </View>
        {isAdmin && (
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

      {/* Admin-only notice */}
      {!isAdmin && media.length === 0 && (
        <View style={styles.notice}>
          <Ionicons name="information-circle-outline" size={20} color="#3b82f6" />
          <Text style={styles.noticeText}>
            Match media will be uploaded by administrators
          </Text>
        </View>
      )}

      {/* Media Gallery */}
      <MediaGallery
        media={filteredMedia}
        counts={counts}
        filter={filter}
        onFilterChange={setFilter}
        onDelete={handleDelete}
        onRepost={handleRepost}
        canDelete={isAdmin}
        canRepost={true}
        onRefresh={refetch}
        isRefreshing={loading}
        emptyMessage={isAdmin ? 'No match media uploaded yet' : 'No media available'}
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
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: '#3b82f6',
  },
  noticeText: {
    fontSize: 14,
    color: '#3b82f6',
    flex: 1,
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

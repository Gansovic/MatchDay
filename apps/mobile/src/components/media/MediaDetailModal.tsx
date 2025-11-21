import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Share,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { MediaWithUrl } from '../../types/media.types';
import { formatFileSize, formatDate } from '../../lib/utils/media-helpers';

const { width, height } = Dimensions.get('window');

interface MediaDetailModalProps {
  media: MediaWithUrl | null;
  visible: boolean;
  onClose: () => void;
  onDelete?: () => void;
  onRepost?: () => void;
}

export const MediaDetailModal: React.FC<MediaDetailModalProps> = ({
  media,
  visible,
  onClose,
  onDelete,
  onRepost,
}) => {
  const handleShare = async () => {
    if (!media) return;
    try {
      await Share.share({ url: media.url });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  if (!media) {
    return null;
  }

  const handleDelete = () => {
    Alert.alert(
      'Delete Media',
      'Are you sure you want to delete this media? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: onDelete,
        },
      ]
    );
  };

  const handleRepost = () => {
    Alert.alert(
      'Repost Media',
      'Add this media to your gallery?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Repost',
          onPress: onRepost,
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Media Details</Text>
          <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
            <Ionicons name="share-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.mediaContainer}>
          {media.media_type === 'image' ? (
            <Image
              source={{ uri: media.url }}
              style={styles.mediaPreview}
              contentFit="contain"
              transition={200}
            />
          ) : (
            <Video
              source={{ uri: media.url }}
              style={styles.mediaPreview}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
            />
          )}
        </View>

        <ScrollView style={styles.infoSection}>
          <Text style={styles.filename}>
            {media.description || media.original_filename}
          </Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={16} color="#999" />
              <Text style={styles.metaText}>{formatDate(media.created_at)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="document-outline" size={16} color="#999" />
              <Text style={styles.metaText}>{formatFileSize(media.file_size)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons
                name={media.is_public ? 'globe-outline' : 'lock-closed'}
                size={16}
                color={media.is_public ? '#22c55e' : '#f97316'}
              />
              <Text style={styles.metaText}>
                {media.is_public ? 'Public' : 'Private'}
              </Text>
            </View>
          </View>

          {media.tags && media.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {media.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {media.is_repost && (
            <View style={styles.repostInfo}>
              <Ionicons name="repeat" size={20} color="#3b82f6" />
              <Text style={styles.repostText}>Reposted from original</Text>
            </View>
          )}

          {onRepost && !media.is_repost && (
            <TouchableOpacity style={styles.repostButton} onPress={handleRepost}>
              <Ionicons name="repeat-outline" size={20} color="#3b82f6" />
              <Text style={styles.repostButtonText}>Repost to My Gallery</Text>
            </TouchableOpacity>
          )}

          {onDelete && (
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
              <Text style={styles.deleteButtonText}>Delete Media</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#1a1a1a',
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  shareButton: {
    padding: 4,
  },
  mediaContainer: {
    width: width,
    height: height * 0.5,
    backgroundColor: '#000',
  },
  mediaPreview: {
    flex: 1,
  },
  infoSection: {
    flex: 1,
    padding: 20,
  },
  filename: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: '#999',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  tag: {
    backgroundColor: '#1e3a8a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: '#93c5fd',
  },
  repostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3b82f6',
    marginBottom: 12,
  },
  repostText: {
    fontSize: 14,
    color: '#3b82f6',
  },
  repostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3b82f6',
    marginBottom: 12,
  },
  repostButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
});

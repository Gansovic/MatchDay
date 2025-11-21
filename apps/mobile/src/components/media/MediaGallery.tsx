import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, Dimensions, RefreshControl } from 'react-native';
import { MediaWithUrl } from '../../types/media.types';
import { MediaGridItem } from './MediaGridItem';
import { MediaFilterTabs } from './MediaFilterTabs';
import { MediaDetailModal } from './MediaDetailModal';
import { MediaEmptyState } from './MediaEmptyState';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 48) / 3;

interface MediaGalleryProps {
  media: MediaWithUrl[];
  counts: { all: number; image: number; video: number };
  filter: 'all' | 'image' | 'video';
  onFilterChange: (filter: 'all' | 'image' | 'video') => void;
  onDelete?: (mediaId: string) => void;
  onRepost?: (mediaId: string) => void;
  canDelete?: boolean;
  canRepost?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  emptyMessage?: string;
}

export const MediaGallery: React.FC<MediaGalleryProps> = ({
  media,
  counts,
  filter,
  onFilterChange,
  onDelete,
  onRepost,
  canDelete = false,
  canRepost = false,
  onRefresh,
  isRefreshing = false,
  emptyMessage = 'No media uploaded yet',
}) => {
  const [selectedMedia, setSelectedMedia] = useState<MediaWithUrl | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleOpenMedia = useCallback((item: MediaWithUrl) => {
    setSelectedMedia(item);
    setModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
    // Delay clearing selected media to allow modal animation to complete
    setTimeout(() => setSelectedMedia(null), 300);
  }, []);

  const handleDelete = useCallback(() => {
    if (selectedMedia && onDelete) {
      onDelete(selectedMedia.id);
      handleCloseModal();
    }
  }, [selectedMedia, onDelete, handleCloseModal]);

  const handleRepost = useCallback(() => {
    if (selectedMedia && onRepost) {
      onRepost(selectedMedia.id);
      handleCloseModal();
    }
  }, [selectedMedia, onRepost, handleCloseModal]);

  const renderItem = useCallback(({ item }: { item: MediaWithUrl }) => (
    <MediaGridItem
      media={item}
      size={ITEM_SIZE}
      onPress={() => handleOpenMedia(item)}
    />
  ), [handleOpenMedia]);

  const keyExtractor = useCallback((item: MediaWithUrl) => item.id, []);

  if (media.length === 0 && counts.all === 0) {
    return <MediaEmptyState message={emptyMessage} />;
  }

  return (
    <View style={styles.container}>
      <MediaFilterTabs
        currentFilter={filter}
        onFilterChange={onFilterChange}
        counts={counts}
      />

      <FlatList
        data={media}
        numColumns={3}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.grid}
        removeClippedSubviews={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor="#3b82f6"
            />
          ) : undefined
        }
      />

      <MediaDetailModal
        media={selectedMedia}
        visible={modalVisible}
        onClose={handleCloseModal}
        onDelete={canDelete && onDelete ? handleDelete : undefined}
        onRepost={canRepost && onRepost ? handleRepost : undefined}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  grid: {
    padding: 12,
  },
});

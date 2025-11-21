import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MediaGallery } from '../media/MediaGallery';
import { useMediaGallery } from '../../hooks/media/useMediaGallery';

interface MediaTabProps {
  seasonId: string;
  seasonName: string;
}

export const MediaTab: React.FC<MediaTabProps> = React.memo(({ seasonId, seasonName }) => {
  const { media, counts, filter, setFilter, isLoading, refetch } = useMediaGallery({
    season_id: seasonId,
    context_type: 'season_media',
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Season Media</Text>
        <Text style={styles.subtitle}>Photos and videos from {seasonName}</Text>
      </View>

      <MediaGallery
        media={media}
        counts={counts}
        filter={filter}
        onFilterChange={setFilter}
        canDelete={false}
        onRefresh={refetch}
        isRefreshing={isLoading}
        emptyMessage="No media uploaded for this season yet"
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
});

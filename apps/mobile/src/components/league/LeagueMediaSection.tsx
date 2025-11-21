import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MediaGallery } from '../media/MediaGallery';
import { useMediaGallery } from '../../hooks/media/useMediaGallery';

interface LeagueMediaSectionProps {
  leagueId: string;
  leagueName: string;
}

export const LeagueMediaSection: React.FC<LeagueMediaSectionProps> = React.memo(({
  leagueId,
  leagueName,
}) => {
  const {
    media,
    counts,
    filter,
    setFilter,
    isLoading,
    refetch,
  } = useMediaGallery({
    league_id: leagueId,
    context_type: 'league_media',
  });

  // Don't render if no media
  if (counts.all === 0 && !isLoading) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Media Gallery</Text>
      <Text style={styles.subtitle}>Photos and videos from {leagueName}</Text>

      <View style={styles.galleryContainer}>
        <MediaGallery
          media={media}
          counts={counts}
          filter={filter}
          onFilterChange={setFilter}
          canDelete={false}
          onRefresh={refetch}
          isRefreshing={isLoading}
          emptyMessage="No media uploaded for this league yet"
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  galleryContainer: {
    minHeight: 300,
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    overflow: 'hidden',
  },
});

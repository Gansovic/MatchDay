import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { MediaGallery } from '../media/MediaGallery';
import { MediaUploadButton } from '../media/MediaUploadButton';
import { useMediaGallery } from '../../hooks/media/useMediaGallery';
import { useMediaUpload } from '../../hooks/media/useMediaUpload';
import { useMediaDelete } from '../../hooks/media/useMediaDelete';

interface TeamMediaTabProps {
  teamId: string;
  teamName: string;
  canUpload?: boolean;
}

export const TeamMediaTab: React.FC<TeamMediaTabProps> = React.memo(({
  teamId,
  teamName,
  canUpload = false,
}) => {
  console.log('TeamMediaTab render', { teamId, teamName });

  const {
    media,
    counts,
    filter,
    setFilter,
    isLoading,
    error,
    refetch,
    addMedia,
    removeMedia,
  } = useMediaGallery({
    team_id: teamId,
    context_type: 'team_media',
  });

  console.log('TeamMediaTab media count:', media.length, 'isLoading:', isLoading);

  const { pickAndUploadMedia, isUploading, error: uploadError } = useMediaUpload();
  const { deleteMedia, error: deleteError } = useMediaDelete();

  const handleUpload = async () => {
    const uploadedMedia = await pickAndUploadMedia({
      context_type: 'team_media',
      team_id: teamId,
      is_public: true,
      tags: ['team', teamName.toLowerCase().replace(/\s+/g, '-')],
      description: `Media from ${teamName}`,
    });

    if (uploadedMedia.length > 0) {
      addMedia(uploadedMedia);
    }
  };

  const handleDelete = async (mediaId: string) => {
    const success = await deleteMedia(mediaId);
    if (success) {
      removeMedia(mediaId);
    }
  };

  React.useEffect(() => {
    const errorMessage = error || uploadError || deleteError;
    if (errorMessage) {
      Alert.alert('Error', errorMessage);
    }
  }, [error, uploadError, deleteError]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Team Media</Text>
          <Text style={styles.subtitle}>Photos and videos from {teamName}</Text>
        </View>
        {canUpload && (
          <MediaUploadButton onPress={handleUpload} isLoading={isUploading} />
        )}
      </View>

      <MediaGallery
        media={media}
        counts={counts}
        filter={filter}
        onFilterChange={setFilter}
        onDelete={canUpload ? handleDelete : undefined}
        canDelete={canUpload}
        onRefresh={refetch}
        isRefreshing={isLoading}
        emptyMessage="No media uploaded for this team yet"
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1a1a1a',
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

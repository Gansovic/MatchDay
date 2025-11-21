'use client';

import React, { useState, useEffect } from 'react';
import { Upload, Loader2, AlertCircle, Plus } from 'lucide-react';
import { MediaGallery } from './media-gallery';
import { MediaUploadDropzone } from './media-upload-dropzone';
import { ImageCropper } from './image-cropper';
import type { MediaWithUrl } from '@matchday/database';

interface PlayerMediaTabProps {
  playerId: string;
  playerName?: string;
  isOwnProfile?: boolean;
}

type FilterType = 'all' | 'uploads' | 'reposts';

export function PlayerMediaTab({
  playerId,
  playerName = 'Player',
  isOwnProfile = false
}: PlayerMediaTabProps) {
  const [media, setMedia] = useState<MediaWithUrl[]>([]);
  const [filteredMedia, setFilteredMedia] = useState<MediaWithUrl[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [imageToEdit, setImageToEdit] = useState<{ file: File; url: string } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Fetch player media on mount
  useEffect(() => {
    fetchMedia();
  }, [playerId]);

  // Apply filter whenever media or filter changes
  useEffect(() => {
    if (filter === 'all') {
      setFilteredMedia(media);
    } else if (filter === 'uploads') {
      setFilteredMedia(media.filter(m => !m.is_repost));
    } else if (filter === 'reposts') {
      setFilteredMedia(media.filter(m => m.is_repost));
    }
  }, [media, filter]);

  const fetchMedia = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/players/${playerId}/media`);

      if (!response.ok) {
        throw new Error('Failed to fetch media');
      }

      const { data } = await response.json();
      setMedia(data || []);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load media');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);

    // If it's an image, show cropper
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setImageToEdit({ file, url });
    } else {
      // For videos, upload directly
      handleUpload(file);
    }
  };

  const handleCropComplete = async (croppedImage: Blob) => {
    if (!selectedFile) return;

    // Convert blob to file
    const file = new File([croppedImage], selectedFile.name, { type: 'image/jpeg' });

    // Clean up
    if (imageToEdit) {
      URL.revokeObjectURL(imageToEdit.url);
    }
    setImageToEdit(null);

    // Upload the cropped image
    await handleUpload(file);
  };

  const handleCropCancel = () => {
    if (imageToEdit) {
      URL.revokeObjectURL(imageToEdit.url);
    }
    setImageToEdit(null);
    setSelectedFile(null);
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('context_type', 'player_media');
      formData.append('is_public', 'true');
      formData.append('description', `Personal media from ${playerName}`);
      formData.append('tags', JSON.stringify(['personal', playerName.toLowerCase().replace(/\s+/g, '-')]));

      const response = await fetch(`/api/players/${playerId}/media`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();

      // Add new media to the list
      setMedia([result.data.media, ...media]);
      setShowUploadForm(false);
      setSelectedFile(null);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload media');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (mediaId: string) => {
    try {
      const response = await fetch(`/api/media/${mediaId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete media');
      }

      // Remove from local state
      setMedia(media.filter(m => m.id !== mediaId));
    } catch (err) {
      console.error('Delete error:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete media');
    }
  };

  const handleRepost = async (mediaId: string) => {
    try {
      const response = await fetch(`/api/media/${mediaId}/repost`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to repost');
      }

      const { data } = await response.json();

      // Add reposted media to the list
      setMedia([data, ...media]);
    } catch (err) {
      console.error('Repost error:', err);
      setError(err instanceof Error ? err.message : 'Failed to repost media');
    }
  };

  // Calculate counts for filter tabs
  const totalCount = media.length;
  const uploadsCount = media.filter(m => !m.is_repost).length;
  const repostsCount = media.filter(m => m.is_repost).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isOwnProfile ? 'My Media' : `${playerName}'s Media`}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {isOwnProfile
              ? 'Your personal photos, videos, and reposts'
              : `Photos and videos from ${playerName}`}
          </p>
        </div>

        {isOwnProfile && (
          <button
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Upload Media
          </button>
        )}
      </div>

      {/* Upload Form */}
      {showUploadForm && isOwnProfile && !isUploading && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Upload Personal Media
          </h3>
          <MediaUploadDropzone
            accept="both"
            maxSize={100}
            onFileSelected={handleFileSelected}
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
            Upload your personal photos and videos. You can also repost media from your matches and teams.
          </p>
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="flex items-center justify-center gap-3 p-6 bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl">
          <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Uploading media...
          </span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900 dark:text-red-100">
              Error
            </p>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              {error}
            </p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
          >
            <AlertCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setFilter('all')}
            className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            All ({totalCount})
          </button>
          <button
            onClick={() => setFilter('uploads')}
            className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
              filter === 'uploads'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            My Uploads ({uploadsCount})
          </button>
          <button
            onClick={() => setFilter('reposts')}
            className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
              filter === 'reposts'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Reposts ({repostsCount})
          </button>
        </nav>
      </div>

      {/* Media Gallery */}
      <MediaGallery
        media={filteredMedia}
        onDelete={isOwnProfile ? handleDelete : undefined}
        onRepost={isOwnProfile ? handleRepost : undefined}
        canDelete={isOwnProfile}
        canRepost={isOwnProfile}
        emptyMessage={
          filter === 'all'
            ? isOwnProfile
              ? 'No media yet. Upload photos and videos or repost from your matches and teams.'
              : 'No media available.'
            : filter === 'uploads'
            ? isOwnProfile
              ? 'No personal uploads yet. Click "Upload Media" to add photos and videos.'
              : 'No personal uploads available.'
            : isOwnProfile
            ? 'No reposts yet. Browse your matches and teams to repost media.'
            : 'No reposts available.'
        }
      />

      {/* Image Cropper Modal */}
      {imageToEdit && (
        <ImageCropper
          image={imageToEdit.url}
          aspect={16 / 9}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  );
}

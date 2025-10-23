'use client';

import React, { useState, useEffect } from 'react';
import { Upload, Loader2, AlertCircle, Plus } from 'lucide-react';
import { MediaGallery } from '../media/media-gallery';
import { MediaUploadDropzone } from '../media/media-upload-dropzone';
import { ImageCropper } from '../media/image-cropper';
import type { MediaWithUrl } from '@matchday/database';

interface TeamMediaTabProps {
  teamId: string;
  teamName: string;
  canUpload?: boolean;
}

export function TeamMediaTab({
  teamId,
  teamName,
  canUpload = false
}: TeamMediaTabProps) {
  const [media, setMedia] = useState<MediaWithUrl[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [imageToEdit, setImageToEdit] = useState<{ file: File; url: string } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Fetch media on mount
  useEffect(() => {
    fetchMedia();
  }, [teamId]);

  const fetchMedia = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/media?team_id=${teamId}&context_type=team_media`);

      if (!response.ok) {
        throw new Error('Failed to fetch media');
      }

      const data = await response.json();
      console.log('🎬 Player TeamMediaTab - Fetched media:', data);
      setMedia(data);
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
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('context_type', 'team_media');
      formData.append('team_id', teamId);
      formData.append('is_public', 'true'); // Team media is public to everyone
      formData.append('description', `Media from ${teamName}`);
      formData.append('tags', JSON.stringify(['team', teamName.toLowerCase().replace(/\s+/g, '-')]));

      // Upload to API
      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();

      // Add new media to the list
      setMedia([result.media, ...media]);
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
            Team Media
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Photos and videos from {teamName}
          </p>
        </div>

        {canUpload && (
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
      {showUploadForm && canUpload && !isUploading && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Upload New Media
          </h3>
          <MediaUploadDropzone
            accept="both"
            maxSize={100}
            onFileSelected={handleFileSelected}
          />
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
        </div>
      )}

      {/* Media Gallery */}
      <MediaGallery
        media={media}
        onDelete={canUpload ? handleDelete : undefined}
        canDelete={canUpload}
        emptyMessage="No media uploaded for this team yet"
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

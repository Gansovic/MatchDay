'use client';

import React, { useState } from 'react';
import { ImageIcon, Loader2, AlertCircle, X } from 'lucide-react';
import Image from 'next/image';
import { MediaUploadDropzone } from './media-upload-dropzone';
import { ImageCropper } from './image-cropper';
import { useAuth } from '@/components/auth/auth-provider';

type IconContextType = 'league_icon' | 'season_icon';

interface IconUploadProps {
  /** Current icon URL to display */
  currentIconUrl?: string;
  /** Type of icon being uploaded */
  contextType: IconContextType;
  /** Entity ID (league or season ID) */
  entityId: string;
  /** League ID (required for both league and season icons) */
  leagueId: string;
  /** Display name for the entity */
  entityName: string;
  /** Optional callback when upload completes */
  onUploadComplete?: (url: string, mediaId: string) => void;
  /** Optional callback when icon is deleted */
  onDelete?: () => void | Promise<void>;
  /** Show delete button */
  showDelete?: boolean;
}

export function IconUpload({
  currentIconUrl,
  contextType,
  entityId,
  leagueId,
  entityName,
  onUploadComplete,
  onDelete,
  showDelete = false
}: IconUploadProps) {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageToEdit, setImageToEdit] = useState<string | null>(null);
  const [iconUrl, setIconUrl] = useState(currentIconUrl);

  const iconLabel = contextType === 'league_icon' ? 'League Icon' : 'Season Icon';
  const entityType = contextType === 'league_icon' ? 'league' : 'season';

  const handleFileSelected = (file: File) => {
    // Create object URL for the cropper
    const url = URL.createObjectURL(file);
    setImageToEdit(url);
  };

  const handleCropComplete = async (croppedImage: Blob) => {
    console.log(`🎨 IconUpload - Starting ${contextType} upload...`);
    setIsUploading(true);
    setError(null);

    try {
      // Validate user is logged in
      if (!user?.id) {
        throw new Error('You must be logged in to upload icons');
      }

      // Convert blob to file
      const fileName = `${entityName.toLowerCase().replace(/\s+/g, '-')}-${entityType}-icon.jpg`;
      const file = new File([croppedImage], fileName, {
        type: 'image/jpeg'
      });

      console.log(`🎨 IconUpload - File created:`, {
        name: file.name,
        size: file.size,
        type: file.type,
        contextType,
        entityId,
        leagueId,
        userId: user.id
      });

      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('context_type', contextType);
      formData.append('league_id', leagueId);
      formData.append('uploaded_by', user.id);

      if (contextType === 'season_icon') {
        formData.append('season_id', entityId);
      }

      formData.append('is_public', 'true');
      formData.append('description', `${iconLabel} for ${entityName}`);
      formData.append('tags', JSON.stringify([entityType, 'icon']));

      console.log(`🎨 IconUpload - FormData prepared with context_type=${contextType}, user_id=${user.id}`);

      // Upload to API
      console.log('🎨 IconUpload - Sending upload request to /api/media/upload...');

      // Log FormData contents for debugging
      const formDataEntries: Record<string, any> = {};
      formData.forEach((value, key) => {
        formDataEntries[key] = key === 'file' ? `File: ${file.name}` : value;
      });
      console.log('🎨 IconUpload - FormData contents:', formDataEntries);

      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });

      console.log('🎨 IconUpload - Upload response status:', response.status);

      if (!response.ok) {
        let errorMessage = 'Upload failed';
        try {
          const errorData = await response.json();
          console.error('🎨 IconUpload - Upload failed:', {
            status: response.status,
            statusText: response.statusText,
            errorData
          });
          errorMessage = errorData.error || errorData.message || `Upload failed with status ${response.status}`;
        } catch (parseError) {
          console.error('🎨 IconUpload - Could not parse error response:', parseError);
          errorMessage = `Upload failed with status ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('🎨 IconUpload - Upload successful:', {
        hasMedia: !!result.media,
        mediaId: result.media?.id,
        mediaUrl: result.media?.url
      });

      // Update local state
      setIconUrl(result.media.url);
      setImageToEdit(null);
      console.log('🎨 IconUpload - Local state updated, calling onUploadComplete callback');

      // Call callback
      if (onUploadComplete) {
        onUploadComplete(result.media.url, result.media.id);
      }
    } catch (err) {
      console.error('🎨 IconUpload - Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload icon');
    } finally {
      setIsUploading(false);
      console.log('🎨 IconUpload - Upload process completed');
    }
  };

  const handleCropCancel = () => {
    if (imageToEdit) {
      URL.revokeObjectURL(imageToEdit);
    }
    setImageToEdit(null);
  };

  const handleDelete = async () => {
    if (!iconUrl || !onDelete) return;

    console.log(`🗑️ IconUpload - Deleting ${contextType}...`);
    setIsDeleting(true);
    setError(null);

    try {
      // Call the parent's delete handler
      await onDelete();
      setIconUrl(undefined);
      console.log('🗑️ IconUpload - Icon deleted successfully');
    } catch (err) {
      console.error('🗑️ IconUpload - Delete error:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete icon');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Current Icon Preview */}
      <div className="flex items-center gap-6">
        <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 shadow-sm">
          {iconUrl ? (
            <Image
              src={iconUrl}
              alt={`${entityName} icon`}
              fill
              className="object-contain p-2"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-10 h-10 text-gray-400" />
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              {iconLabel}
            </h3>
            {showDelete && iconUrl && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4" />
                    Remove Icon
                  </>
                )}
              </button>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Upload a square icon for {entityName}. Works best with transparent backgrounds.
          </p>
        </div>
      </div>

      {/* Upload Area */}
      {!isUploading && user && (
        <MediaUploadDropzone
          accept="image"
          maxSize={10}
          onFileSelected={handleFileSelected}
        />
      )}

      {/* Not Logged In Message */}
      {!user && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            You must be logged in to upload icons.
          </p>
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="flex items-center justify-center gap-3 p-6 bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl">
          <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Uploading {iconLabel.toLowerCase()}...
          </span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900 dark:text-red-100">
              Operation failed
            </p>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* Image Cropper Modal */}
      {imageToEdit && (
        <ImageCropper
          image={imageToEdit}
          aspect={1}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  );
}

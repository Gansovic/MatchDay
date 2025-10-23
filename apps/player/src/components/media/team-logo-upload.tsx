'use client';

import React, { useState } from 'react';
import { Shield, Loader2, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { MediaUploadDropzone } from './media-upload-dropzone';
import { ImageCropper } from './image-cropper';

interface TeamLogoUploadProps {
  currentLogoUrl?: string;
  teamId: string;
  teamName: string;
  onUploadComplete?: (url: string, mediaId: string) => void;
}

export function TeamLogoUpload({
  currentLogoUrl,
  teamId,
  teamName,
  onUploadComplete
}: TeamLogoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageToEdit, setImageToEdit] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState(currentLogoUrl);

  const handleFileSelected = (file: File) => {
    // Create object URL for the cropper
    const url = URL.createObjectURL(file);
    setImageToEdit(url);
  };

  const handleCropComplete = async (croppedImage: Blob) => {
    setIsUploading(true);
    setError(null);

    try {
      // Convert blob to file
      const file = new File([croppedImage], `${teamName.toLowerCase().replace(/\s+/g, '-')}-logo.jpg`, {
        type: 'image/jpeg'
      });

      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('context_type', 'team_logo');
      formData.append('team_id', teamId);
      formData.append('is_public', 'true');
      formData.append('description', `Logo for ${teamName}`);
      formData.append('tags', JSON.stringify(['team', 'logo']));

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
      console.log('🛡️ TeamLogoUpload - Upload successful:', {
        hasMedia: !!result.media,
        mediaId: result.media?.id,
        mediaUrl: result.media?.url
      });

      // Update local state
      setLogoUrl(result.media.url);
      setImageToEdit(null);

      // Call callback
      if (onUploadComplete) {
        onUploadComplete(result.media.url, result.media.id);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload logo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCropCancel = () => {
    if (imageToEdit) {
      URL.revokeObjectURL(imageToEdit);
    }
    setImageToEdit(null);
  };

  return (
    <div className="space-y-4">
      {/* Current Logo Preview */}
      <div className="flex items-center gap-6">
        <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 shadow-sm">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={`${teamName} logo`}
              fill
              className="object-contain p-2"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Shield className="w-10 h-10 text-gray-400" />
            </div>
          )}
        </div>

        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
            Team Logo
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Upload a square logo for {teamName}. Works best with transparent backgrounds.
          </p>
        </div>
      </div>

      {/* Upload Area */}
      {!isUploading && (
        <MediaUploadDropzone
          accept="image"
          maxSize={10}
          onFileSelected={handleFileSelected}
        />
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="flex items-center justify-center gap-3 p-6 bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl">
          <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Uploading team logo...
          </span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900 dark:text-red-100">
              Upload failed
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

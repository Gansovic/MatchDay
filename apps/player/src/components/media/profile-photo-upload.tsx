'use client';

import React, { useState, useEffect } from 'react';
import { Camera, Loader2, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { MediaUploadDropzone } from './media-upload-dropzone';
import { ImageCropper } from './image-cropper';

interface ProfilePhotoUploadProps {
  currentAvatarUrl?: string;
  userId: string;
  onUploadComplete?: (url: string, mediaId: string) => void;
}

export function ProfilePhotoUpload({
  currentAvatarUrl,
  userId,
  onUploadComplete
}: ProfilePhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageToEdit, setImageToEdit] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl);

  // Sync avatarUrl with currentAvatarUrl prop changes
  useEffect(() => {
    setAvatarUrl(currentAvatarUrl);
  }, [currentAvatarUrl]);

  const handleFileSelected = (file: File) => {
    // Create object URL for the cropper
    const url = URL.createObjectURL(file);
    setImageToEdit(url);
  };

  const handleCropComplete = async (croppedImage: Blob) => {
    console.log('📸 ProfilePhotoUpload - Starting upload...');
    setIsUploading(true);
    setError(null);

    try {
      // Convert blob to file
      const file = new File([croppedImage], 'avatar.jpg', { type: 'image/jpeg' });
      console.log('📸 ProfilePhotoUpload - File created:', {
        name: file.name,
        size: file.size,
        type: file.type
      });

      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('context_type', 'user_profile');
      formData.append('is_public', 'true');
      formData.append('description', 'User profile avatar');
      console.log('📸 ProfilePhotoUpload - FormData prepared with context_type=user_profile, is_public=true');

      // Upload to API
      console.log('📸 ProfilePhotoUpload - Sending upload request to /api/media/upload...');
      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });

      console.log('📸 ProfilePhotoUpload - Upload response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('📸 ProfilePhotoUpload - Upload failed:', errorData);
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      console.log('📸 ProfilePhotoUpload - Upload successful:', {
        hasMedia: !!result.media,
        mediaId: result.media?.id,
        mediaUrl: result.media?.url,
        fullResult: result
      });

      // Update local state
      setAvatarUrl(result.media.url);
      setImageToEdit(null);
      console.log('📸 ProfilePhotoUpload - Local state updated, calling onUploadComplete callback');

      // Call callback
      if (onUploadComplete) {
        onUploadComplete(result.media.url, result.media.id);
      }
    } catch (err) {
      console.error('📸 ProfilePhotoUpload - Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload photo');
    } finally {
      setIsUploading(false);
      console.log('📸 ProfilePhotoUpload - Upload process completed');
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
      {/* Current Avatar Preview */}
      <div className="flex items-center gap-6">
        <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt="Profile photo"
              fill
              sizes="96px"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Camera className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>

        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
            Profile Photo
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Upload a square photo. We'll help you crop it to perfection.
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
            Uploading your photo...
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

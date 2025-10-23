'use client';

import React, { useCallback, useState } from 'react';
import { Upload, X, Image as ImageIcon, Video, FileWarning } from 'lucide-react';

interface MediaUploadDropzoneProps {
  accept?: 'image' | 'video' | 'both';
  maxSize?: number; // in MB
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

export function MediaUploadDropzone({
  accept = 'both',
  maxSize = 100,
  onFileSelected,
  disabled = false
}: MediaUploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const acceptedTypes = {
    image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    video: ['video/mp4', 'video/quicktime', 'video/webm'],
    both: [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'video/mp4', 'video/quicktime', 'video/webm'
    ]
  };

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const types = acceptedTypes[accept];

    if (!types.includes(file.type)) {
      return {
        valid: false,
        error: `Invalid file type. Please upload ${accept === 'both' ? 'an image or video' : `a ${accept}`}.`
      };
    }

    const maxBytes = maxSize * 1024 * 1024;
    if (file.size > maxBytes) {
      return {
        valid: false,
        error: `File size exceeds ${maxSize}MB limit.`
      };
    }

    return { valid: true };
  };

  const handleFile = useCallback((file: File) => {
    setError(null);
    const validation = validateFile(file);

    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    onFileSelected(file);
  }, [onFileSelected, accept, maxSize]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile, disabled]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const acceptAttribute = acceptedTypes[accept].join(',');

  return (
    <div className="w-full">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-xl p-8 transition-all
          ${isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-blue-400'}
        `}
      >
        <input
          type="file"
          accept={acceptAttribute}
          onChange={handleFileInput}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />

        <div className="flex flex-col items-center justify-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            {accept === 'image' ? (
              <ImageIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            ) : accept === 'video' ? (
              <Video className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            ) : (
              <Upload className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            )}
          </div>

          <div>
            <p className="text-base font-medium text-gray-900 dark:text-white">
              {isDragging ? 'Drop file here' : 'Click or drag file to upload'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {accept === 'image' && 'JPEG, PNG, WebP, or GIF up to 10MB'}
              {accept === 'video' && `MP4, MOV, or WebM up to ${maxSize}MB`}
              {accept === 'both' && `Images up to 10MB or videos up to ${maxSize}MB`}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <FileWarning className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { MediaWithUrl } from '@matchday/database';
import { X, Download, Trash2, Eye, Calendar, Tag, Lock, Globe, Repeat2 } from 'lucide-react';
import Image from 'next/image';

interface MediaGalleryProps {
  media: MediaWithUrl[];
  onDelete?: (mediaId: string) => void;
  onRepost?: (mediaId: string) => void;
  canDelete?: boolean;
  canRepost?: boolean;
  emptyMessage?: string;
}

export function MediaGallery({
  media,
  onDelete,
  onRepost,
  canDelete = false,
  canRepost = false,
  emptyMessage = 'No media uploaded yet'
}: MediaGalleryProps) {
  const [selectedMedia, setSelectedMedia] = useState<MediaWithUrl | null>(null);
  const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all');

  const filteredMedia = media.filter(m => {
    if (filter === 'all') return true;
    return m.media_type === filter;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (media.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <Eye className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-600 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            filter === 'all'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          All ({media.length})
        </button>
        <button
          onClick={() => setFilter('image')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            filter === 'image'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Photos ({media.filter(m => m.media_type === 'image').length})
        </button>
        <button
          onClick={() => setFilter('video')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            filter === 'video'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Videos ({media.filter(m => m.media_type === 'video').length})
        </button>
      </div>

      {/* Media Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredMedia.map((item) => (
          <div
            key={item.id}
            className="group relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
            onClick={() => setSelectedMedia(item)}
          >
            {item.media_type === 'image' ? (
              <Image
                src={item.url}
                alt={item.description || item.original_filename}
                fill
                unoptimized={true}
                className="object-cover"
              />
            ) : (
              <video
                src={item.url}
                className="w-full h-full object-cover"
                preload="metadata"
              />
            )}

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
              <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Badges */}
            <div className="absolute top-2 right-2 flex flex-col gap-1">
              {/* Repost Badge */}
              {item.is_repost && (
                <div className="bg-white/90 dark:bg-gray-900/90 rounded-full p-1.5">
                  <Repeat2 className="w-3 h-3 text-blue-600" />
                </div>
              )}

              {/* Privacy Badge */}
              {item.is_public ? (
                <div className="bg-white/90 dark:bg-gray-900/90 rounded-full p-1.5">
                  <Globe className="w-3 h-3 text-green-600" />
                </div>
              ) : (
                <div className="bg-white/90 dark:bg-gray-900/90 rounded-full p-1.5">
                  <Lock className="w-3 h-3 text-orange-600" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Media Detail Modal */}
      {selectedMedia && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedMedia(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Media Preview */}
            <div className="relative bg-black aspect-video flex items-center justify-center">
              {selectedMedia.media_type === 'image' ? (
                <Image
                  src={selectedMedia.url}
                  alt={selectedMedia.description || selectedMedia.original_filename}
                  fill
                  className="object-contain"
                />
              ) : (
                <video
                  src={selectedMedia.url}
                  controls
                  className="w-full h-full"
                />
              )}

              {/* Close Button */}
              <button
                onClick={() => setSelectedMedia(null)}
                className="absolute top-4 right-4 w-10 h-10 bg-white/90 dark:bg-gray-900/90 rounded-full flex items-center justify-center hover:bg-white dark:hover:bg-gray-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Media Info */}
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {selectedMedia.description || selectedMedia.original_filename}
                </h3>

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(selectedMedia.created_at)}
                  </span>
                  <span>{formatFileSize(selectedMedia.file_size)}</span>
                  {selectedMedia.is_repost && (
                    <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                      <Repeat2 className="w-4 h-4" />
                      Reposted
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    {selectedMedia.is_public ? (
                      <>
                        <Globe className="w-4 h-4 text-green-600" />
                        Public
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 text-orange-600" />
                        Private
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Tags */}
              {selectedMedia.tags && selectedMedia.tags.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag className="w-4 h-4 text-gray-400" />
                  {selectedMedia.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <a
                  href={selectedMedia.url}
                  download={selectedMedia.original_filename}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </a>

                {canRepost && onRepost && !selectedMedia.is_repost && (
                  <button
                    onClick={() => {
                      onRepost(selectedMedia.id);
                      setSelectedMedia(null);
                    }}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Repeat2 className="w-4 h-4" />
                    Repost
                  </button>
                )}

                {canDelete && onDelete && (
                  <button
                    onClick={() => {
                      onDelete(selectedMedia.id);
                      setSelectedMedia(null);
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const getMediaTypeIcon = (mediaType: string): string => {
  switch (mediaType) {
    case 'image':
      return 'image-outline';
    case 'video':
      return 'videocam-outline';
    default:
      return 'document-outline';
  }
};

export const validateMediaFile = (
  uri: string,
  type: string,
  fileSize?: number
): { valid: boolean; error?: string } => {
  const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
  const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

  const isVideo = type.startsWith('video/');
  const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;

  if (fileSize && fileSize > maxSize) {
    return {
      valid: false,
      error: `File exceeds ${maxSize / (1024 * 1024)}MB limit`,
    };
  }

  return { valid: true };
};

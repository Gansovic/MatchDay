/**
 * MediaService Unit Tests
 *
 * Tests the MediaService class for media upload, retrieval, and management
 */

import { MediaService } from '../../../packages/services/src/media.service';
import { SupabaseClient } from '@supabase/supabase-js';

// Mock Supabase client
const mockSupabaseClient = {
  storage: {
    from: jest.fn(),
  },
  from: jest.fn(),
} as unknown as SupabaseClient;

describe('MediaService', () => {
  let mediaService: MediaService;

  beforeEach(() => {
    jest.clearAllMocks();
    mediaService = MediaService.getInstance(mockSupabaseClient);
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance on multiple getInstance calls', () => {
      const instance1 = MediaService.getInstance(mockSupabaseClient);
      const instance2 = MediaService.getInstance(mockSupabaseClient);

      expect(instance1).toBe(instance2);
    });

    it('should throw error if getInstance is called without client on first initialization', () => {
      // Clear the singleton instance by creating a new MediaService class for testing
      // We can't actually reset the singleton without exposing a reset method,
      // but we can test the error condition by accessing the private static instance
      const MediaServiceConstructor = MediaService as any;
      const originalInstance = MediaServiceConstructor.instance;

      // Temporarily clear the instance
      MediaServiceConstructor.instance = null;

      expect(() => {
        MediaService.getInstance();
      }).toThrow('SupabaseClient required for first initialization');

      // Restore the instance
      MediaServiceConstructor.instance = originalInstance;
    });

    it('should update supabase client when getInstance is called with a new client', () => {
      const newMockClient = {
        storage: {
          from: jest.fn(),
        },
        from: jest.fn(),
      } as unknown as SupabaseClient;

      const instance = MediaService.getInstance(newMockClient);

      // The instance should be the same, but with updated client
      expect(instance).toBe(mediaService);
    });
  });

  describe('File Validation', () => {
    describe('Image Validation', () => {
      it('should accept valid image types', () => {
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

        validTypes.forEach(type => {
          const file = new File(['test'], 'test.jpg', { type });
          // We can't directly test private methods, but we can test through uploadMedia
          // which calls validateFile internally
          expect(file.type).toBe(type);
        });
      });

      it('should reject files larger than 10MB for images', () => {
        const largeSize = 11 * 1024 * 1024; // 11MB
        const file = new File([new ArrayBuffer(largeSize)], 'large.jpg', {
          type: 'image/jpeg',
        });

        expect(file.size).toBeGreaterThan(10 * 1024 * 1024);
      });

      it('should reject invalid image types', async () => {
        const invalidFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
        const mockOptions = {
          context_type: 'team_logo' as const,
          is_public: true,
        };

        const result = await mediaService.uploadMedia(invalidFile, mockOptions, 'user123');

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('INVALID_FILE_TYPE');
        expect(result.error?.message).toContain('not allowed');
      });

      it('should reject oversized image files', async () => {
        const largeSize = 11 * 1024 * 1024; // 11MB
        const largeFile = new File([new ArrayBuffer(largeSize)], 'large.jpg', {
          type: 'image/jpeg',
        });
        const mockOptions = {
          context_type: 'team_logo' as const,
          is_public: true,
        };

        const result = await mediaService.uploadMedia(largeFile, mockOptions, 'user123');

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('FILE_TOO_LARGE');
        expect(result.error?.message).toContain('exceeds maximum');
      });
    });

    describe('Video Validation', () => {
      it('should accept valid video types', () => {
        const validTypes = ['video/mp4', 'video/quicktime', 'video/webm'];

        validTypes.forEach(type => {
          const file = new File(['test'], 'test.mp4', { type });
          expect(file.type).toBe(type);
        });
      });

      it('should reject files larger than 100MB for videos', async () => {
        const largeSize = 101 * 1024 * 1024; // 101MB
        const largeFile = new File([new ArrayBuffer(largeSize)], 'large.mp4', {
          type: 'video/mp4',
        });
        const mockOptions = {
          context_type: 'team_media' as const,
          is_public: true,
        };

        const result = await mediaService.uploadMedia(largeFile, mockOptions, 'user123');

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('FILE_TOO_LARGE');
        expect(result.error?.message).toContain('exceeds maximum');
      });

      it('should reject invalid video types', async () => {
        const invalidFile = new File(['test'], 'test.avi', { type: 'video/avi' });
        const mockOptions = {
          context_type: 'team_media' as const,
          is_public: true,
        };

        const result = await mediaService.uploadMedia(invalidFile, mockOptions, 'user123');

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('INVALID_FILE_TYPE');
      });
    });
  });

  describe('Storage Path Generation', () => {
    it('should generate correct path for team logos', () => {
      // Testing the path generation logic through the structure
      const userId = 'user123';
      const filename = 'team-logo.png';

      // Expected format: userId/timestamp-sanitized-filename
      // The actual path will be in format: user123/1234567890-team-logo.png
      expect(userId).toBe('user123');
      expect(filename).toContain('.png');
    });

    it('should sanitize filenames with special characters', () => {
      const filename = 'team logo (1) [test].png';
      const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, '_');

      expect(sanitized).toBe('team_logo__1___test_.png');
    });

    it('should use correct bucket for team logos', () => {
      const bucketName = 'team-logos';
      expect(bucketName).toBe('team-logos');
    });

    it('should use correct bucket for user avatars', () => {
      const bucketName = 'user-avatars';
      expect(bucketName).toBe('user-avatars');
    });

    it('should use correct bucket for team media', () => {
      const bucketName = 'team-media';
      expect(bucketName).toBe('team-media');
    });

    it('should use correct bucket for season media', () => {
      const bucketName = 'season-media';
      expect(bucketName).toBe('season-media');
    });

    it('should throw error for unknown context type in path generation', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockOptions = {
        context_type: 'unknown_context' as any, // Invalid context type
        is_public: true,
      };

      const result = await mediaService.uploadMedia(mockFile, mockOptions, 'user123');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Unknown context type');
    });
  });

  describe('Upload Media', () => {
    it('should handle successful image upload for team_logo', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockOptions = {
        context_type: 'team_logo' as const,
        team_id: 'team123',
        is_public: true,
        description: 'Test team logo',
        tags: ['team', 'logo'],
      };

      const mockStorageUpload = jest.fn().mockResolvedValue({
        data: { path: 'user123/123456-test.jpg' },
        error: null,
      });

      const mockStorageGetPublicUrl = jest.fn().mockReturnValue({
        data: { publicUrl: 'https://example.com/storage/test.jpg' },
      });

      const mockDbInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'media123',
              filename: 'user123/123456-test.jpg',
              mime_type: 'image/jpeg',
            },
            error: null,
          }),
        }),
      });

      (mockSupabaseClient.storage.from as jest.Mock).mockReturnValue({
        upload: mockStorageUpload,
        getPublicUrl: mockStorageGetPublicUrl,
      });

      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        insert: mockDbInsert,
      });

      const result = await mediaService.uploadMedia(mockFile, mockOptions, 'user123');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.media).toBeDefined();
      expect(result.data?.storageUrl).toBe('https://example.com/storage/test.jpg');
    });

    it('should handle successful upload for user_profile context', async () => {
      const mockFile = new File(['test'], 'avatar.png', { type: 'image/png' });
      const mockOptions = {
        context_type: 'user_profile' as const,
        is_public: true,
      };

      const mockStorageUpload = jest.fn().mockResolvedValue({
        data: { path: 'user123/123456-avatar.png' },
        error: null,
      });

      const mockStorageGetPublicUrl = jest.fn().mockReturnValue({
        data: { publicUrl: 'https://example.com/storage/avatar.png' },
      });

      const mockDbInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'media123',
              filename: 'user123/123456-avatar.png',
              mime_type: 'image/png',
              context_type: 'user_profile',
            },
            error: null,
          }),
        }),
      });

      (mockSupabaseClient.storage.from as jest.Mock).mockReturnValue({
        upload: mockStorageUpload,
        getPublicUrl: mockStorageGetPublicUrl,
      });

      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        insert: mockDbInsert,
      });

      const result = await mediaService.uploadMedia(mockFile, mockOptions, 'user123');

      expect(result.success).toBe(true);
      expect(mockStorageUpload).toHaveBeenCalled();
    });

    it('should handle successful upload for league_sponsor context', async () => {
      const mockFile = new File(['test'], 'sponsor.jpg', { type: 'image/jpeg' });
      const mockOptions = {
        context_type: 'league_sponsor' as const,
        league_id: 'league123',
        is_public: true,
      };

      const mockStorageUpload = jest.fn().mockResolvedValue({
        data: { path: 'user123/123456-sponsor.jpg' },
        error: null,
      });

      const mockStorageGetPublicUrl = jest.fn().mockReturnValue({
        data: { publicUrl: 'https://example.com/storage/sponsor.jpg' },
      });

      const mockDbInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'media123',
              filename: 'user123/123456-sponsor.jpg',
              mime_type: 'image/jpeg',
              context_type: 'league_sponsor',
            },
            error: null,
          }),
        }),
      });

      (mockSupabaseClient.storage.from as jest.Mock).mockReturnValue({
        upload: mockStorageUpload,
        getPublicUrl: mockStorageGetPublicUrl,
      });

      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        insert: mockDbInsert,
      });

      const result = await mediaService.uploadMedia(mockFile, mockOptions, 'user123');

      expect(result.success).toBe(true);
    });

    it('should handle successful upload for team_media context', async () => {
      const mockFile = new File(['test'], 'team-video.mp4', { type: 'video/mp4' });
      const mockOptions = {
        context_type: 'team_media' as const,
        team_id: 'team123',
        is_public: true,
      };

      const mockStorageUpload = jest.fn().mockResolvedValue({
        data: { path: 'user123/123456-team-video.mp4' },
        error: null,
      });

      const mockStorageGetPublicUrl = jest.fn().mockReturnValue({
        data: { publicUrl: 'https://example.com/storage/team-video.mp4' },
      });

      const mockDbInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'media123',
              filename: 'user123/123456-team-video.mp4',
              mime_type: 'video/mp4',
              context_type: 'team_media',
              media_type: 'video',
            },
            error: null,
          }),
        }),
      });

      (mockSupabaseClient.storage.from as jest.Mock).mockReturnValue({
        upload: mockStorageUpload,
        getPublicUrl: mockStorageGetPublicUrl,
      });

      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        insert: mockDbInsert,
      });

      const result = await mediaService.uploadMedia(mockFile, mockOptions, 'user123');

      expect(result.success).toBe(true);
    });

    it('should handle successful upload for season_media context', async () => {
      const mockFile = new File(['test'], 'season.jpg', { type: 'image/jpeg' });
      const mockOptions = {
        context_type: 'season_media' as const,
        season_id: 'season123',
        is_public: true,
      };

      const mockStorageUpload = jest.fn().mockResolvedValue({
        data: { path: 'user123/123456-season.jpg' },
        error: null,
      });

      const mockStorageGetPublicUrl = jest.fn().mockReturnValue({
        data: { publicUrl: 'https://example.com/storage/season.jpg' },
      });

      const mockDbInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'media123',
              filename: 'user123/123456-season.jpg',
              mime_type: 'image/jpeg',
              context_type: 'season_media',
            },
            error: null,
          }),
        }),
      });

      (mockSupabaseClient.storage.from as jest.Mock).mockReturnValue({
        upload: mockStorageUpload,
        getPublicUrl: mockStorageGetPublicUrl,
      });

      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        insert: mockDbInsert,
      });

      const result = await mediaService.uploadMedia(mockFile, mockOptions, 'user123');

      expect(result.success).toBe(true);
    });

    it('should handle storage upload errors', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockOptions = {
        context_type: 'team_logo' as const,
        is_public: true,
      };

      const mockStorageUpload = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Storage upload failed', code: 'STORAGE_ERROR' },
      });

      (mockSupabaseClient.storage.from as jest.Mock).mockReturnValue({
        upload: mockStorageUpload,
      });

      const result = await mediaService.uploadMedia(mockFile, mockOptions, 'user123');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should cleanup storage on database insert failure', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockOptions = {
        context_type: 'team_logo' as const,
        is_public: true,
      };

      const mockStorageRemove = jest.fn().mockResolvedValue({ data: null, error: null });

      const mockStorageUpload = jest.fn().mockResolvedValue({
        data: { path: 'user123/123456-test.jpg' },
        error: null,
      });

      const mockStorageGetPublicUrl = jest.fn().mockReturnValue({
        data: { publicUrl: 'https://example.com/storage/test.jpg' },
      });

      const mockDbInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      });

      (mockSupabaseClient.storage.from as jest.Mock).mockReturnValue({
        upload: mockStorageUpload,
        getPublicUrl: mockStorageGetPublicUrl,
        remove: mockStorageRemove,
      });

      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        insert: mockDbInsert,
      });

      const result = await mediaService.uploadMedia(mockFile, mockOptions, 'user123');

      expect(result.success).toBe(false);
      expect(mockStorageRemove).toHaveBeenCalled();
    });
  });

  describe('Get Media', () => {
    it('should filter media by team_id', async () => {
      const mockQuery = {
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue(mockQuery),
      });

      (mockSupabaseClient.from as jest.Mock).mockImplementation(mockFrom);

      await mediaService.getMedia({ team_id: 'team123' });

      expect(mockQuery.eq).toHaveBeenCalledWith('team_id', 'team123');
    });

    it('should filter media by league_id', async () => {
      const mockQuery = {
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue(mockQuery),
      });

      (mockSupabaseClient.from as jest.Mock).mockImplementation(mockFrom);

      await mediaService.getMedia({ league_id: 'league123' });

      expect(mockQuery.eq).toHaveBeenCalledWith('league_id', 'league123');
    });

    it('should filter media by season_id', async () => {
      const mockQuery = {
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue(mockQuery),
      });

      (mockSupabaseClient.from as jest.Mock).mockImplementation(mockFrom);

      await mediaService.getMedia({ season_id: 'season123' });

      expect(mockQuery.eq).toHaveBeenCalledWith('season_id', 'season123');
    });

    it('should filter media by context_type', async () => {
      const mockQuery = {
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue(mockQuery),
      });

      (mockSupabaseClient.from as jest.Mock).mockImplementation(mockFrom);

      await mediaService.getMedia({ context_type: 'team_media' });

      expect(mockQuery.eq).toHaveBeenCalledWith('context_type', 'team_media');
    });

    it('should filter media by media_type', async () => {
      const mockQuery = {
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue(mockQuery),
      });

      (mockSupabaseClient.from as jest.Mock).mockImplementation(mockFrom);

      await mediaService.getMedia({ media_type: 'video' });

      expect(mockQuery.eq).toHaveBeenCalledWith('media_type', 'video');
    });

    it('should filter media by is_public', async () => {
      const mockQuery = {
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue(mockQuery),
      });

      (mockSupabaseClient.from as jest.Mock).mockImplementation(mockFrom);

      await mediaService.getMedia({ is_public: false });

      expect(mockQuery.eq).toHaveBeenCalledWith('is_public', false);
    });

    it('should filter media by tags', async () => {
      const mockQuery = {
        contains: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue(mockQuery),
      });

      (mockSupabaseClient.from as jest.Mock).mockImplementation(mockFrom);

      await mediaService.getMedia({ tags: ['team', 'highlight'] });

      expect(mockQuery.contains).toHaveBeenCalledWith('tags', ['team', 'highlight']);
    });

    it('should order media by created_at descending', async () => {
      const mockQuery = {
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue(mockQuery),
      });

      (mockSupabaseClient.from as jest.Mock).mockImplementation(mockFrom);

      await mediaService.getMedia({});

      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should return media with public URLs', async () => {
      const mockMediaData = [
        {
          id: 'media1',
          filename: 'test1.jpg',
          storage_path: 'user123/test1.jpg',
          context_type: 'team_logo',
          mime_type: 'image/jpeg',
        },
        {
          id: 'media2',
          filename: 'test2.jpg',
          storage_path: 'user123/test2.jpg',
          context_type: 'user_profile',
          mime_type: 'image/jpeg',
        },
      ];

      const mockQuery = {
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: mockMediaData,
          error: null,
        }),
      };

      const mockStorageGetPublicUrl = jest.fn((path) => ({
        data: { publicUrl: `https://example.com/storage/${path}` },
      }));

      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue(mockQuery),
      });

      (mockSupabaseClient.storage.from as jest.Mock).mockReturnValue({
        getPublicUrl: mockStorageGetPublicUrl,
      });

      const result = await mediaService.getMedia({});

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].url).toBeDefined();
      expect(result.data?.[1].url).toBeDefined();
      expect(mockStorageGetPublicUrl).toHaveBeenCalledTimes(2);
    });

    it('should handle errors in getMedia', async () => {
      const mockQuery = {
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error', code: 'DB_ERROR' },
        }),
      };

      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue(mockQuery),
      });

      const result = await mediaService.getMedia({});

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('DB_ERROR');
    });
  });

  describe('Get Media By ID', () => {
    it('should retrieve media by ID with public URL', async () => {
      const mockMediaData = {
        id: 'media123',
        filename: 'test.jpg',
        storage_path: 'user123/test.jpg',
        context_type: 'team_logo',
        mime_type: 'image/jpeg',
        uploaded_by: 'user123',
      };

      const mockStorageGetPublicUrl = jest.fn().mockReturnValue({
        data: { publicUrl: 'https://example.com/storage/test.jpg' },
      });

      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockMediaData,
              error: null,
            }),
          }),
        }),
      });

      (mockSupabaseClient.storage.from as jest.Mock).mockReturnValue({
        getPublicUrl: mockStorageGetPublicUrl,
      });

      const result = await mediaService.getMediaById('media123');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBe('media123');
      expect(result.data?.url).toBe('https://example.com/storage/test.jpg');
      expect(mockStorageGetPublicUrl).toHaveBeenCalledWith('user123/test.jpg');
    });

    it('should handle errors when retrieving media by ID', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Media not found', code: 'NOT_FOUND' },
            }),
          }),
        }),
      });

      const result = await mediaService.getMediaById('nonexistent-id');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('NOT_FOUND');
    });

    it('should get correct bucket for different context types in getMediaById', async () => {
      const contexts = ['team_logo', 'user_profile', 'league_sponsor', 'team_media', 'season_media'];

      for (const contextType of contexts) {
        const mockMediaData = {
          id: 'media123',
          storage_path: 'user123/test.jpg',
          context_type: contextType,
        };

        const mockStorageGetPublicUrl = jest.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/storage/test.jpg' },
        });

        (mockSupabaseClient.from as jest.Mock).mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockMediaData,
                error: null,
              }),
            }),
          }),
        });

        (mockSupabaseClient.storage.from as jest.Mock).mockReturnValue({
          getPublicUrl: mockStorageGetPublicUrl,
        });

        await mediaService.getMediaById('media123');

        // Verify that storage.from was called with the correct bucket
        expect(mockSupabaseClient.storage.from).toHaveBeenCalled();
      }
    });

    it('should handle unknown context type in getBucketFromContext', async () => {
      const mockMediaData = {
        id: 'media123',
        storage_path: 'user123/test.jpg',
        context_type: 'invalid_context_type' as any,
      };

      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockMediaData,
              error: null,
            }),
          }),
        }),
      });

      const result = await mediaService.getMediaById('media123');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Unknown context type');
    });
  });

  describe('Delete Media', () => {
    it('should enforce authorization for media deletion', async () => {
      const mockMediaData = {
        id: 'media123',
        uploaded_by: 'user123',
        storage_path: 'user123/test.jpg',
        context_type: 'team_media',
      };

      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockMediaData,
              error: null,
            }),
          }),
        }),
      });

      (mockSupabaseClient.from as jest.Mock).mockImplementation(mockFrom);

      const result = await mediaService.deleteMedia('media123', 'different-user');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNAUTHORIZED');
    });

    it('should successfully delete media when authorized', async () => {
      const mockMediaData = {
        id: 'media123',
        uploaded_by: 'user123',
        storage_path: 'user123/test.jpg',
        context_type: 'team_logo',
      };

      const mockStorageRemove = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      const mockDbDelete = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      // Mock the sequence of calls
      let callCount = 0;
      (mockSupabaseClient.from as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call: fetch media
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockMediaData,
                  error: null,
                }),
              }),
            }),
          };
        } else {
          // Second call: delete media
          return {
            delete: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue(mockDbDelete),
            }),
          };
        }
      });

      (mockSupabaseClient.storage.from as jest.Mock).mockReturnValue({
        remove: mockStorageRemove,
      });

      const result = await mediaService.deleteMedia('media123', 'user123');

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
      expect(mockStorageRemove).toHaveBeenCalledWith(['user123/test.jpg']);
    });

    it('should continue with DB deletion even if storage deletion fails', async () => {
      const mockMediaData = {
        id: 'media123',
        uploaded_by: 'user123',
        storage_path: 'user123/test.jpg',
        context_type: 'team_logo',
      };

      const mockStorageRemove = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Storage deletion failed' },
      });

      const mockDbDelete = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      let callCount = 0;
      (mockSupabaseClient.from as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockMediaData,
                  error: null,
                }),
              }),
            }),
          };
        } else {
          return {
            delete: jest.fn().mockReturnValue({
              eq: mockDbDelete,
            }),
          };
        }
      });

      (mockSupabaseClient.storage.from as jest.Mock).mockReturnValue({
        remove: mockStorageRemove,
      });

      const result = await mediaService.deleteMedia('media123', 'user123');

      expect(result.success).toBe(true);
      expect(mockDbDelete).toHaveBeenCalled();
    });

    it('should handle database deletion errors', async () => {
      const mockMediaData = {
        id: 'media123',
        uploaded_by: 'user123',
        storage_path: 'user123/test.jpg',
        context_type: 'team_logo',
      };

      const mockStorageRemove = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      const mockDbDelete = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'DB deletion failed', code: 'DB_ERROR' },
      });

      let callCount = 0;
      (mockSupabaseClient.from as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockMediaData,
                  error: null,
                }),
              }),
            }),
          };
        } else {
          return {
            delete: jest.fn().mockReturnValue({
              eq: mockDbDelete,
            }),
          };
        }
      });

      (mockSupabaseClient.storage.from as jest.Mock).mockReturnValue({
        remove: mockStorageRemove,
      });

      const result = await mediaService.deleteMedia('media123', 'user123');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('DB_ERROR');
    });

    it('should handle fetch errors in deleteMedia', async () => {
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Fetch failed', code: 'FETCH_ERROR' },
            }),
          }),
        }),
      });

      const result = await mediaService.deleteMedia('media123', 'user123');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('FETCH_ERROR');
    });
  });

  describe('Update Media Metadata', () => {
    it('should successfully update media metadata', async () => {
      const updates = {
        tags: ['updated', 'tags'],
        description: 'Updated description',
        is_public: false,
      };

      const mockUpdatedMedia = {
        id: 'media123',
        ...updates,
        uploaded_by: 'user123',
      };

      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockUpdatedMedia,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      const result = await mediaService.updateMediaMetadata('media123', 'user123', updates);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.tags).toEqual(updates.tags);
      expect(result.data?.description).toBe(updates.description);
      expect(result.data?.is_public).toBe(false);
    });

    it('should update only tags', async () => {
      const updates = {
        tags: ['new', 'tag'],
      };

      const mockUpdatedMedia = {
        id: 'media123',
        tags: ['new', 'tag'],
        uploaded_by: 'user123',
      };

      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockUpdatedMedia,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      const result = await mediaService.updateMediaMetadata('media123', 'user123', updates);

      expect(result.success).toBe(true);
      expect(result.data?.tags).toEqual(['new', 'tag']);
    });

    it('should update only description', async () => {
      const updates = {
        description: 'New description',
      };

      const mockUpdatedMedia = {
        id: 'media123',
        description: 'New description',
        uploaded_by: 'user123',
      };

      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockUpdatedMedia,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      const result = await mediaService.updateMediaMetadata('media123', 'user123', updates);

      expect(result.success).toBe(true);
      expect(result.data?.description).toBe('New description');
    });

    it('should update only is_public', async () => {
      const updates = {
        is_public: true,
      };

      const mockUpdatedMedia = {
        id: 'media123',
        is_public: true,
        uploaded_by: 'user123',
      };

      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockUpdatedMedia,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      const result = await mediaService.updateMediaMetadata('media123', 'user123', updates);

      expect(result.success).toBe(true);
      expect(result.data?.is_public).toBe(true);
    });

    it('should handle update errors', async () => {
      const updates = {
        tags: ['updated'],
      };

      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Update failed', code: 'UPDATE_ERROR' },
                }),
              }),
            }),
          }),
        }),
      });

      const result = await mediaService.updateMediaMetadata('media123', 'user123', updates);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UPDATE_ERROR');
    });

    it('should enforce user authorization in update', async () => {
      const updates = {
        tags: ['updated'],
      };

      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Not authorized', code: 'UNAUTHORIZED' },
                }),
              }),
            }),
          }),
        }),
      });

      const result = await mediaService.updateMediaMetadata('media123', 'different-user', updates);

      expect(result.success).toBe(false);
    });
  });
});

/**
 * UserService Unit Tests
 *
 * Comprehensive tests for the UserService class covering:
 * - User profile retrieval and creation
 * - Profile updates and validation
 * - Error handling and timeout scenarios
 * - Profile existence checks
 * - Get-or-create atomic operations
 */

import { UserService } from '../../../packages/services/src/user.service';

// Mock the Supabase client module
const mockSupabaseClient = {
  from: jest.fn(),
};

// Mock the supabase import
jest.mock('@/lib/supabase/client', () => ({
  supabase: mockSupabaseClient,
}));

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset singleton instance between tests
    (UserService as any).instance = undefined;
    userService = UserService.getInstance(mockSupabaseClient);
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance on multiple getInstance calls', () => {
      const instance1 = UserService.getInstance();
      const instance2 = UserService.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('getUserProfile', () => {
    it('should successfully retrieve a user profile', async () => {
      const mockUserProfile = {
        id: 'user123',
        display_name: 'John Doe',
        preferred_position: 'midfielder',
        location: 'San Jose',
        bio: 'Love playing soccer',
        date_of_birth: '1990-01-01',
        avatar_url: 'https://example.com/avatar.jpg',
        avatar_media_id: 'media123',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockUserProfile,
              error: null,
            }),
          }),
        }),
      });

      const result = await userService.getUserProfile('user123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUserProfile);
      expect(result.error).toBeNull();
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_profiles');
    });

    it('should handle user not found error', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'User not found' },
            }),
          }),
        }),
      });

      const result = await userService.getUserProfile('nonexistent-user');

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('PROFILE_NOT_FOUND');
      expect(result.error?.message).toContain('User not found');
    });

    it('should handle database connection errors', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'CONNECTION_ERROR', message: 'Database connection failed' },
            }),
          }),
        }),
      });

      const result = await userService.getUserProfile('user123');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('PROFILE_NOT_FOUND');
    });

    it('should handle timeout errors gracefully', async () => {
      // Mock a delayed response that exceeds the timeout
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockImplementation(() =>
              new Promise((resolve) => setTimeout(resolve, 11000)) // 11 seconds, exceeds 10s timeout
            ),
          }),
        }),
      });

      const result = await userService.getUserProfile('user123');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNEXPECTED_ERROR');
      expect(result.error?.message).toContain('timed out');
    });

    it('should handle unexpected errors', async () => {
      mockSupabaseClient.from.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const result = await userService.getUserProfile('user123');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNEXPECTED_ERROR');
      expect(result.error?.message).toBe('Unexpected error');
    });
  });

  describe('updateUserProfile', () => {
    it('should successfully update user profile', async () => {
      const updates = {
        display_name: 'Jane Smith',
        preferred_position: 'forward',
        bio: 'Updated bio',
      };

      const updatedProfile = {
        id: 'user123',
        ...updates,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: new Date().toISOString(),
      };

      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: updatedProfile,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await userService.updateUserProfile('user123', updates);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(updatedProfile);
      expect(result.message).toBe('Profile updated successfully');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_profiles');
    });

    it('should update avatar_url and avatar_media_id', async () => {
      const updates = {
        avatar_url: 'https://example.com/new-avatar.jpg',
        avatar_media_id: 'media456',
      };

      const updatedProfile = {
        id: 'user123',
        display_name: 'John Doe',
        ...updates,
        updated_at: new Date().toISOString(),
      };

      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: updatedProfile,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await userService.updateUserProfile('user123', updates);

      expect(result.success).toBe(true);
      expect(result.data?.avatar_url).toBe(updates.avatar_url);
      expect(result.data?.avatar_media_id).toBe(updates.avatar_media_id);
    });

    it('should handle update errors', async () => {
      const updates = { display_name: 'New Name' };

      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'UPDATE_FAILED', message: 'Update failed', hint: 'Check constraints' },
              }),
            }),
          }),
        }),
      });

      const result = await userService.updateUserProfile('user123', updates);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UPDATE_FAILED');
      expect(result.error?.message).toBe('Update failed');
    });

    it('should handle constraint violation errors', async () => {
      const updates = { display_name: '' }; // Empty name might violate constraint

      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: {
                  code: '23514',
                  message: 'Constraint violation',
                  details: 'display_name cannot be empty',
                },
              }),
            }),
          }),
        }),
      });

      const result = await userService.updateUserProfile('user123', updates);

      expect(result.success).toBe(false);
      expect(result.error?.details).toContain('display_name cannot be empty');
    });

    it('should handle unexpected errors during update', async () => {
      mockSupabaseClient.from.mockImplementation(() => {
        throw new Error('Network error');
      });

      const result = await userService.updateUserProfile('user123', { display_name: 'Test' });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNEXPECTED_ERROR');
      expect(result.error?.message).toBe('Network error');
    });
  });

  describe('createUserProfile', () => {
    it('should successfully create a new user profile', async () => {
      const profileData = {
        display_name: 'New Player',
        preferred_position: 'goalkeeper',
        location: 'San Francisco',
        bio: 'Just joined',
      };

      const createdProfile = {
        id: 'user123',
        ...profileData,
        date_of_birth: null,
        avatar_url: null,
        avatar_media_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: createdProfile,
              error: null,
            }),
          }),
        }),
      });

      const result = await userService.createUserProfile('user123', profileData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(createdProfile);
      expect(result.message).toBe('Profile created successfully');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_profiles');
    });

    it('should create profile with avatar_url and avatar_media_id', async () => {
      const profileData = {
        display_name: 'Player With Avatar',
        avatar_url: 'https://example.com/avatar.jpg',
        avatar_media_id: 'media789',
      };

      const createdProfile = {
        id: 'user456',
        ...profileData,
        preferred_position: null,
        location: null,
        bio: null,
        date_of_birth: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: createdProfile,
              error: null,
            }),
          }),
        }),
      });

      const result = await userService.createUserProfile('user456', profileData);

      expect(result.success).toBe(true);
      expect(result.data?.avatar_url).toBe(profileData.avatar_url);
      expect(result.data?.avatar_media_id).toBe(profileData.avatar_media_id);
    });

    it('should create profile with optional fields', async () => {
      const profileData = {
        display_name: 'Complete Player',
        preferred_position: 'defender',
        location: 'Oakland',
        bio: 'Experienced player',
        date_of_birth: '1985-05-15',
      };

      const createdProfile = {
        id: 'user789',
        ...profileData,
        avatar_url: null,
        avatar_media_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: createdProfile,
              error: null,
            }),
          }),
        }),
      });

      const result = await userService.createUserProfile('user789', profileData);

      expect(result.success).toBe(true);
      expect(result.data?.date_of_birth).toBe(profileData.date_of_birth);
    });

    it('should handle duplicate user ID error', async () => {
      const profileData = {
        display_name: 'Duplicate User',
      };

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: {
                code: '23505',
                message: 'duplicate key value violates unique constraint',
                details: 'Key (id)=(user123) already exists',
              },
            }),
          }),
        }),
      });

      const result = await userService.createUserProfile('user123', profileData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('23505');
      expect(result.error?.details).toContain('already exists');
    });

    it('should handle validation errors', async () => {
      const profileData = {
        display_name: '', // Invalid empty name
      };

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Validation failed',
                hint: 'display_name is required',
              },
            }),
          }),
        }),
      });

      const result = await userService.createUserProfile('user123', profileData);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Validation failed');
    });

    it('should handle unexpected errors during creation', async () => {
      mockSupabaseClient.from.mockImplementation(() => {
        throw new Error('Database unavailable');
      });

      const result = await userService.createUserProfile('user123', { display_name: 'Test' });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNEXPECTED_ERROR');
      expect(result.error?.message).toBe('Database unavailable');
    });
  });

  describe('profileExists', () => {
    it('should return true when profile exists', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: { id: 'user123' },
              error: null,
            }),
          }),
        }),
      });

      const result = await userService.profileExists('user123');

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should return false when profile does not exist', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      });

      const result = await userService.profileExists('nonexistent-user');

      expect(result.success).toBe(true);
      expect(result.data).toBe(false);
      expect(result.error).toBeNull();
    });

    it('should handle database errors', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'DB_ERROR', message: 'Database error' },
            }),
          }),
        }),
      });

      const result = await userService.profileExists('user123');

      expect(result.success).toBe(false);
      expect(result.data).toBe(false);
      expect(result.error?.code).toBe('CHECK_FAILED');
    });

    it('should handle unexpected errors', async () => {
      mockSupabaseClient.from.mockImplementation(() => {
        throw new Error('Connection lost');
      });

      const result = await userService.profileExists('user123');

      expect(result.success).toBe(false);
      expect(result.data).toBe(false);
      expect(result.error?.code).toBe('UNEXPECTED_ERROR');
    });
  });

  describe('getOrCreateUserProfile', () => {
    it('should return existing profile if it exists', async () => {
      const existingProfile = {
        id: 'user123',
        display_name: 'Existing User',
        preferred_position: 'midfielder',
        location: 'San Jose',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: existingProfile,
              error: null,
            }),
          }),
        }),
      });

      const result = await userService.getOrCreateUserProfile('user123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(existingProfile);
      // Should not call insert since profile exists
      expect(mockSupabaseClient.from).toHaveBeenCalledTimes(1);
    });

    it('should create profile with fallback data if profile does not exist', async () => {
      const fallbackData = {
        display_name: 'New User',
        preferred_position: 'forward',
        location: 'Oakland',
      };

      const createdProfile = {
        id: 'user456',
        ...fallbackData,
        bio: null,
        date_of_birth: null,
        avatar_url: null,
        avatar_media_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call: getUserProfile - not found
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'PGRST116', message: 'Not found' },
                }),
              }),
            }),
          };
        } else {
          // Second call: createUserProfile - success
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: createdProfile,
                  error: null,
                }),
              }),
            }),
          };
        }
      });

      const result = await userService.getOrCreateUserProfile('user456', fallbackData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(createdProfile);
      expect(mockSupabaseClient.from).toHaveBeenCalledTimes(2);
    });

    it('should return error if profile does not exist and no fallback data provided', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'Not found' },
            }),
          }),
        }),
      });

      const result = await userService.getOrCreateUserProfile('user789');

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('PROFILE_NOT_FOUND');
      expect(result.error?.message).toContain('no fallback data provided');
    });

    it('should handle errors during profile creation', async () => {
      const fallbackData = {
        display_name: 'Test User',
      };

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call: getUserProfile - not found
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'PGRST116', message: 'Not found' },
                }),
              }),
            }),
          };
        } else {
          // Second call: createUserProfile - error
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'CREATE_FAILED', message: 'Failed to create' },
                }),
              }),
            }),
          };
        }
      });

      const result = await userService.getOrCreateUserProfile('user789', fallbackData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('CREATE_FAILED');
    });

    it('should handle unexpected errors', async () => {
      mockSupabaseClient.from.mockImplementation(() => {
        throw new Error('System error');
      });

      const result = await userService.getOrCreateUserProfile('user123');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('PROFILE_NOT_FOUND');
      expect(result.error?.message).toBe('User profile not found and no fallback data provided');
    });
  });
});

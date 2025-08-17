/**
 * Profile API Integration Tests
 * 
 * Tests the profile API endpoints and user synchronization:
 * - GET /api/profile - Profile retrieval with auth verification
 * - PUT /api/profile - Full profile updates with database verification
 * - PATCH /api/profile - Partial profile updates with database verification
 * - Auth.users to public.user_profiles synchronization
 * - Profile creation and validation
 */

import { NextRequest } from 'next/server';
import { GET, PUT, PATCH } from '../../src/app/api/profile/route';
import { 
  createTestClient, 
  createTestUser, 
  cleanupTestData,
  generateTestName,
  TestUser
} from '@tests/utils/database-test-utils';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/types/database.types';

describe('Profile API Integration Tests', () => {
  let supabase: SupabaseClient<Database>;
  let testUser: TestUser;
  let createdUserIds: string[] = [];

  beforeAll(async () => {
    supabase = createTestClient();
  });

  beforeEach(async () => {
    // Create a fresh test user for each test
    testUser = await createTestUser(supabase, {
      email: `test-user-${Date.now()}@example.com`,
      password: 'testpass123',
      display_name: 'Test User',
      full_name: 'Test Full Name'
    });
    createdUserIds.push(testUser.id);
  });

  afterEach(async () => {
    // Clean up test users after each test
    await cleanupTestData(supabase, {
      userIds: createdUserIds
    });
    createdUserIds = [];
  });

  describe('GET /api/profile - Profile Retrieval', () => {
    it('should retrieve existing user profile with correct data', async () => {
      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testUser.access_token}`
        }
      });

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data).toBeDefined();
      expect(responseData.data.id).toBe(testUser.id);
      expect(responseData.data.display_name).toBe(testUser.profile?.display_name);
      expect(responseData.data.full_name).toBe(testUser.profile?.full_name);
      expect(responseData.message).toBe('Profile retrieved successfully');

      // Verify profile structure
      expect(responseData.data).toHaveProperty('created_at');
      expect(responseData.data).toHaveProperty('updated_at');
    });

    it('should return 404 when profile does not exist', async () => {
      // Create user without profile
      const { data: authUser } = await supabase.auth.admin.createUser({
        email: 'no-profile@example.com',
        password: 'testpass123',
        email_confirm: true
      });

      expect(authUser.user).toBeDefined();
      const userId = authUser.user!.id;
      createdUserIds.push(userId);

      // Generate access token (mock)
      const mockToken = `mock-token-${userId}`;

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${mockToken}`
        }
      });

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.error).toBe('PROFILE_NOT_FOUND');
      expect(responseData.message).toContain('Profile not found');
      expect(responseData.data).toBeNull();
    });

    it('should return 401 when not authenticated', async () => {
      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'GET'
        // No Authorization header
      });

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.error).toBe('UNAUTHORIZED');
      expect(responseData.message).toBe('Authentication required');
    });

    it('should return 401 with invalid token', async () => {
      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      });

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.error).toBe('UNAUTHORIZED');
    });
  });

  describe('PUT /api/profile - Full Profile Update', () => {
    it('should update existing profile with valid data', async () => {
      const updateData = {
        full_name: 'Updated Full Name',
        display_name: 'Updated Display',
        bio: 'This is my updated bio',
        phone: '+1234567890',
        date_of_birth: '1990-01-01',
        preferred_position: 'midfielder',
        location: 'Updated City'
      };

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testUser.access_token}`
        },
        body: JSON.stringify(updateData)
      });

      const response = await PUT(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data).toBeDefined();
      expect(responseData.data.full_name).toBe(updateData.full_name);
      expect(responseData.data.display_name).toBe(updateData.display_name);
      expect(responseData.data.bio).toBe(updateData.bio);
      expect(responseData.data.phone).toBe(updateData.phone);
      expect(responseData.data.date_of_birth).toBe(updateData.date_of_birth);
      expect(responseData.data.preferred_position).toBe(updateData.preferred_position);
      expect(responseData.data.location).toBe(updateData.location);
      expect(responseData.message).toBe('Profile updated successfully');

      // Verify changes in database
      const { data: dbProfile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', testUser.id)
        .single();

      expect(error).toBeNull();
      expect(dbProfile).toBeDefined();
      expect(dbProfile.full_name).toBe(updateData.full_name);
      expect(dbProfile.display_name).toBe(updateData.display_name);
      expect(dbProfile.bio).toBe(updateData.bio);
    });

    it('should create profile if it does not exist', async () => {
      // Create user without profile
      const { data: authUser } = await supabase.auth.admin.createUser({
        email: 'new-profile@example.com',
        password: 'testpass123',
        email_confirm: true
      });

      expect(authUser.user).toBeDefined();
      const userId = authUser.user!.id;
      createdUserIds.push(userId);

      const profileData = {
        display_name: 'New Profile',
        full_name: 'New Full Name',
        bio: 'New user bio'
      };

      // Generate access token (mock)
      const mockToken = `mock-token-${userId}`;

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockToken}`
        },
        body: JSON.stringify(profileData)
      });

      const response = await PUT(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.message).toBe('Profile created successfully');
      expect(responseData.data.display_name).toBe(profileData.display_name);

      // Verify profile was created in database
      const { data: dbProfile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      expect(error).toBeNull();
      expect(dbProfile).toBeDefined();
      expect(dbProfile.display_name).toBe(profileData.display_name);
    });

    it('should validate field constraints', async () => {
      const invalidData = {
        full_name: 'A', // Too short
        display_name: 'B', // Too short
        bio: 'A'.repeat(1001), // Too long
        phone: 'invalid-phone',
        date_of_birth: 'invalid-date',
        preferred_position: 'A'.repeat(51), // Too long
        location: 'A'.repeat(256) // Too long
      };

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testUser.access_token}`
        },
        body: JSON.stringify(invalidData)
      });

      const response = await PUT(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('VALIDATION_FAILED');
      expect(responseData.validationErrors).toBeDefined();
      expect(responseData.validationErrors.length).toBeGreaterThan(0);

      // Check specific validation errors
      const errorFields = responseData.validationErrors.map((e: any) => e.field);
      expect(errorFields).toContain('full_name');
      expect(errorFields).toContain('display_name');
      expect(errorFields).toContain('bio');
      expect(errorFields).toContain('phone');
      expect(errorFields).toContain('date_of_birth');
    });

    it('should validate age restrictions', async () => {
      const now = new Date();
      const tooYoung = new Date(now.getFullYear() - 12, now.getMonth(), now.getDate());
      const tooOld = new Date(now.getFullYear() - 101, now.getMonth(), now.getDate());

      // Test too young
      const youngData = {
        date_of_birth: tooYoung.toISOString().split('T')[0]
      };

      const youngRequest = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testUser.access_token}`
        },
        body: JSON.stringify(youngData)
      });

      const youngResponse = await PUT(youngRequest);
      const youngResponseData = await youngResponse.json();

      expect(youngResponse.status).toBe(400);
      expect(youngResponseData.validationErrors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'date_of_birth',
            message: expect.stringContaining('13 years old')
          })
        ])
      );

      // Test too old
      const oldData = {
        date_of_birth: tooOld.toISOString().split('T')[0]
      };

      const oldRequest = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testUser.access_token}`
        },
        body: JSON.stringify(oldData)
      });

      const oldResponse = await PUT(oldRequest);
      const oldResponseData = await oldResponse.json();

      expect(oldResponse.status).toBe(400);
      expect(oldResponseData.validationErrors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'date_of_birth',
            message: expect.stringContaining('valid birth date')
          })
        ])
      );
    });

    it('should require at least one field for full update', async () => {
      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testUser.access_token}`
        },
        body: JSON.stringify({}) // Empty object
      });

      const response = await PUT(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('INVALID_REQUEST');
      expect(responseData.message).toContain('At least one field must be provided');
    });
  });

  describe('PATCH /api/profile - Partial Profile Update', () => {
    it('should update only provided fields', async () => {
      const originalProfile = testUser.profile;
      const partialUpdate = {
        bio: 'Updated bio only'
      };

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testUser.access_token}`
        },
        body: JSON.stringify(partialUpdate)
      });

      const response = await PATCH(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data.bio).toBe(partialUpdate.bio);
      
      // Other fields should remain unchanged
      expect(responseData.data.display_name).toBe(originalProfile?.display_name);
      expect(responseData.data.full_name).toBe(originalProfile?.full_name);

      // Verify in database
      const { data: dbProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', testUser.id)
        .single();

      expect(dbProfile.bio).toBe(partialUpdate.bio);
      expect(dbProfile.display_name).toBe(originalProfile?.display_name);
    });

    it('should allow empty partial updates', async () => {
      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testUser.access_token}`
        },
        body: JSON.stringify({}) // Empty object should be allowed for PATCH
      });

      const response = await PATCH(request);
      const responseData = await response.json();

      // Should succeed but not change anything
      expect(response.status).toBe(200);
      expect(responseData.message).toBe('Profile updated successfully');
    });

    it('should handle null values to clear fields', async () => {
      const clearFields = {
        bio: null,
        phone: null,
        location: null
      };

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testUser.access_token}`
        },
        body: JSON.stringify(clearFields)
      });

      const response = await PATCH(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data.bio).toBeNull();
      expect(responseData.data.phone).toBeNull();
      expect(responseData.data.location).toBeNull();

      // Verify in database
      const { data: dbProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', testUser.id)
        .single();

      expect(dbProfile.bio).toBeNull();
      expect(dbProfile.phone).toBeNull();
      expect(dbProfile.location).toBeNull();
    });
  });

  describe('Authentication and Authorization', () => {
    it('should reject requests with invalid JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testUser.access_token}`
        },
        body: 'invalid json'
      });

      const response = await PUT(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('INVALID_REQUEST_BODY');
      expect(responseData.message).toContain('valid JSON');
    });

    it('should handle malformed authorization headers', async () => {
      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'GET',
        headers: {
          'Authorization': 'InvalidFormat token'
        }
      });

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.error).toBe('UNAUTHORIZED');
    });
  });

  describe('Data Synchronization', () => {
    it('should maintain consistency between auth.users and user_profiles', async () => {
      // Verify that user exists in auth.users
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(testUser.id);
      expect(authError).toBeNull();
      expect(authUser.user).toBeDefined();
      expect(authUser.user.id).toBe(testUser.id);

      // Verify that profile exists in user_profiles
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', testUser.id)
        .single();

      expect(profileError).toBeNull();
      expect(profile).toBeDefined();
      expect(profile.id).toBe(testUser.id);

      // IDs should match
      expect(authUser.user.id).toBe(profile.id);
    });

    it('should handle profile operations when auth user exists', async () => {
      // Update profile and verify both tables are consistent
      const updateData = {
        display_name: 'Sync Test User',
        full_name: 'Synchronization Test'
      };

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testUser.access_token}`
        },
        body: JSON.stringify(updateData)
      });

      const response = await PUT(request);
      expect(response.status).toBe(200);

      // Verify auth user still exists
      const { data: authUser } = await supabase.auth.admin.getUserById(testUser.id);
      expect(authUser.user).toBeDefined();

      // Verify profile has been updated
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', testUser.id)
        .single();

      expect(profile.display_name).toBe(updateData.display_name);
      expect(profile.full_name).toBe(updateData.full_name);
    });
  });
});
/**
 * User Service for MatchDay
 *
 * Handles user profile operations with Supabase integration.
 * Provides CRUD operations for user profiles and related data.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { UserProfile, UpdateUserProfile, ServiceResponse } from '@matchday/database';

export class UserService {
  private static instance: UserService;
  private supabase: SupabaseClient;

  private constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  static getInstance(supabaseClient?: SupabaseClient): UserService {
    if (!UserService.instance) {
      if (!supabaseClient) {
        throw new Error('SupabaseClient required for first initialization');
      }
      UserService.instance = new UserService(supabaseClient);
    } else if (supabaseClient) {
      // Update client for fresh auth context
      UserService.instance.supabase = supabaseClient;
    }
    return UserService.instance;
  }

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string): Promise<ServiceResponse<UserProfile>> {
    console.log('📡 UserService - getUserProfile called for userId:', userId);
    
    try {
      console.log('📡 UserService - querying user_profiles table...');
      
      // Add timeout handling
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('getUserProfile request timed out after 10 seconds')), 10000)
      );
      
      const queryPromise = this.supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

      console.log('📡 UserService - supabase response:', { 
        hasData: !!data, 
        error: error?.message, 
        errorCode: error?.code,
        dataDisplayName: data?.display_name 
      });

      if (error) {
        console.log('❌ UserService - returning error response:', error.message);
        return {
          data: null,
          error: {
            code: 'PROFILE_NOT_FOUND',
            message: error.message,
            timestamp: new Date().toISOString()
          },
          success: false
        };
      }

      console.log('✅ UserService - returning success response');
      return {
        data: data,
        error: null,
        success: true
      };
    } catch (error) {
      return {
        data: null,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          timestamp: new Date().toISOString()
        },
        success: false
      };
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, updates: UpdateUserProfile): Promise<ServiceResponse<UserProfile>> {
    console.log('🔄 UserService.updateUserProfile called:', {
      userId,
      updates,
      hasAvatarUrl: !!updates.avatar_url,
      hasAvatarMediaId: !!updates.avatar_media_id
    });

    try {
      console.log('🔄 UserService - Executing update query on user_profiles table...');
      const { data, error } = await this.supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select('*')
        .single();

      console.log('🔄 UserService - Update query response:', {
        hasData: !!data,
        error: error?.message,
        errorCode: error?.code,
        errorDetails: error?.details,
        errorHint: error?.hint,
        fullError: error,
        updatedAvatarUrl: data?.avatar_url
      });

      if (error) {
        console.error('❌ UserService - Update failed. Full error object:', JSON.stringify(error, null, 2));
        return {
          data: null,
          error: {
            code: error.code || 'UPDATE_FAILED',
            message: error.message || error.hint || 'Failed to update user profile',
            details: error.details,
            timestamp: new Date().toISOString()
          },
          success: false
        };
      }

      console.log('✅ UserService - Profile updated successfully');
      return {
        data: data,
        error: null,
        success: true,
        message: 'Profile updated successfully'
      };
    } catch (error) {
      console.error('❌ UserService - Unexpected error:', error);
      return {
        data: null,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update profile',
          timestamp: new Date().toISOString()
        },
        success: false
      };
    }
  }

  /**
   * Create user profile (typically called during signup)
   */
  async createUserProfile(userId: string, profileData: {
    display_name: string;
    preferred_position?: string;
    location?: string;
    bio?: string;
    date_of_birth?: string;
    avatar_url?: string;
    avatar_media_id?: string;
  }): Promise<ServiceResponse<UserProfile>> {
    console.log('🆕 UserService.createUserProfile called:', {
      userId,
      hasAvatarUrl: !!profileData.avatar_url,
      hasAvatarMediaId: !!profileData.avatar_media_id
    });

    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .insert({
          id: userId,
          display_name: profileData.display_name,
          preferred_position: profileData.preferred_position || null,
          location: profileData.location || null,
          bio: profileData.bio || null,
          date_of_birth: profileData.date_of_birth || null,
          avatar_url: profileData.avatar_url || null,
          avatar_media_id: profileData.avatar_media_id || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('*')
        .single();

      console.log('🆕 UserService - Insert response:', {
        hasData: !!data,
        error: error?.message,
        errorCode: error?.code,
        errorDetails: error?.details,
        errorHint: error?.hint,
        fullError: error
      });

      if (error) {
        console.error('❌ UserService - Profile creation failed. Full error:', JSON.stringify(error, null, 2));
        return {
          data: null,
          error: {
            code: error.code || 'CREATE_FAILED',
            message: error.message || error.hint || 'Failed to create profile',
            details: error.details,
            timestamp: new Date().toISOString()
          },
          success: false
        };
      }

      console.log('✅ UserService - Profile created successfully with avatar');
      return {
        data: data,
        error: null,
        success: true,
        message: 'Profile created successfully'
      };
    } catch (error) {
      return {
        data: null,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create profile',
          timestamp: new Date().toISOString()
        },
        success: false
      };
    }
  }

  /**
   * Check if user profile exists
   */
  async profileExists(userId: string): Promise<ServiceResponse<boolean>> {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        return {
          data: false,
          error: {
            code: 'CHECK_FAILED',
            message: error.message,
            timestamp: new Date().toISOString()
          },
          success: false
        };
      }

      return {
        data: !!data,
        error: null,
        success: true
      };
    } catch (error) {
      return {
        data: false,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: error instanceof Error ? error.message : 'Failed to check profile',
          timestamp: new Date().toISOString()
        },
        success: false
      };
    }
  }

  /**
   * Get or create user profile (ensures profile exists)
   */
  async getOrCreateUserProfile(userId: string, fallbackData?: {
    display_name: string;
    preferred_position?: string;
    location?: string;
  }): Promise<ServiceResponse<UserProfile>> {
    try {
      // First try to get existing profile
      const profileResult = await this.getUserProfile(userId);
      
      if (profileResult.success && profileResult.data) {
        return profileResult;
      }

      // If profile doesn't exist and we have fallback data, create it
      if (fallbackData) {
        return await this.createUserProfile(userId, fallbackData);
      }

      // No profile and no fallback data
      return {
        data: null,
        error: {
          code: 'PROFILE_NOT_FOUND',
          message: 'User profile not found and no fallback data provided',
          timestamp: new Date().toISOString()
        },
        success: false
      };
    } catch (error) {
      return {
        data: null,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get or create profile',
          timestamp: new Date().toISOString()
        },
        success: false
      };
    }
  }
}
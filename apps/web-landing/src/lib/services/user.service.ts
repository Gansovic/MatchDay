/**
 * User Service for MatchDay
 * 
 * Handles user profile operations with Supabase integration.
 * Provides CRUD operations for user profiles and related data.
 */

import { supabase } from '@/lib/supabase/client';
import type { UserProfile, UpdateUserProfile, ServiceResponse } from '@/lib/types/database.types';

export class UserService {
  private static instance: UserService;
  
  static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
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
      
      const queryPromise = supabase
        .from('users')
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
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select('*')
        .single();

      if (error) {
        return {
          data: null,
          error: {
            code: 'UPDATE_FAILED',
            message: error.message,
            timestamp: new Date().toISOString()
          },
          success: false
        };
      }

      return {
        data: data,
        error: null,
        success: true,
        message: 'Profile updated successfully'
      };
    } catch (error) {
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
  }): Promise<ServiceResponse<UserProfile>> {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: userId,
          display_name: profileData.display_name,
          preferred_position: profileData.preferred_position,
          location: profileData.location,
          bio: profileData.bio,
          date_of_birth: profileData.date_of_birth,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('*')
        .single();

      if (error) {
        return {
          data: null,
          error: {
            code: 'CREATE_FAILED',
            message: error.message,
            timestamp: new Date().toISOString()
          },
          success: false
        };
      }

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
      const { data, error } = await supabase
        .from('users')
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
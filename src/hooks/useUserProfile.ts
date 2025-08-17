/**
 * User Profile Hooks for MatchDay
 * 
 * Custom hooks for managing user profile data, preferences,
 * and profile-related operations
 */

'use client';

import { useApi } from './useApi';
import { useAsync } from './useAsync';
import { UserService } from '@/lib/services/user.service';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';

// Hook for fetching current user's profile
export function useUserProfile() {
  const { user } = useAuth();
  const userService = UserService.getInstance(supabase);
  
  const apiHook = useApi(
    async () => {
      if (!user?.id) return null;
      
      // Try to get existing profile first
      const result = await userService.getUserProfile(user.id);
      
      if (result.success && result.data) {
        return result.data;
      }
      
      // If profile doesn't exist, try to create one with basic info
      if (result.error?.code === 'PROFILE_NOT_FOUND') {
        const fallbackData = {
          display_name: user.user_metadata?.display_name || 
                       user.user_metadata?.full_name || 
                       user.email?.split('@')[0] || 
                       'User'
        };
        
        const createResult = await userService.getOrCreateUserProfile(user.id, fallbackData);
        
        if (createResult.success) {
          return createResult.data;
        }
        
        // If creation also fails, return null (profile will show as not available)
        console.warn('Failed to create user profile:', createResult.error?.message);
        return null;
      }
      
      // For other errors, log and return null
      console.error('Error fetching user profile:', result.error?.message);
      return null;
    },
    [user?.id],
    {
      immediate: !!user?.id,
      cacheKey: user?.id ? `user-profile-${user.id}` : undefined,
      cacheTime: 2 * 60 * 1000 // 2 minutes
    }
  );

  // Update profile function
  const updateProfile = async (updates: {
    display_name?: string;
    bio?: string;
    location?: string;
    preferred_position?: string;
    avatar_url?: string;
    date_of_birth?: string;
    phone_number?: string;
  }) => {
    if (!user?.id) {
      throw new Error('User must be authenticated to update profile');
    }

    const result = await userService.updateUserProfile(user.id, updates);

    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to update profile');
    }

    // Refresh the cache after successful update
    apiHook.refresh();
    
    return result.data;
  };

  return {
    ...apiHook,
    updateProfile
  };
}

// Hook for updating user profile
export function useUpdateProfile() {
  const userService = UserService.getInstance(supabase);
  const { user } = useAuth();

  return useAsync(
    async (updates: {
      display_name?: string;
      bio?: string;
      location?: string;
      preferred_position?: string;
      avatar_url?: string;
      date_of_birth?: string;
      phone_number?: string;
    }) => {
      if (!user?.id) {
        throw new Error('User must be authenticated to update profile');
      }

      const result = await userService.updateUserProfile(user.id, updates);

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to update profile');
      }

      return result.data;
    }
  );
}

// Hook for uploading user avatar
export function useUploadAvatar() {
  const userService = UserService.getInstance(supabase);
  const { user } = useAuth();

  return useAsync(
    async (file: File) => {
      if (!user?.id) {
        throw new Error('User must be authenticated to upload avatar');
      }

      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          upsert: true
        });

      if (uploadError) {
        throw new Error(`Failed to upload avatar: ${uploadError.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update user profile with new avatar URL
      const result = await userService.updateUserProfile(user.id, {
        avatar_url: publicUrl
      });

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to update profile with avatar');
      }

      return publicUrl;
    }
  );
}

// Hook for getting user's activity history
export function useUserActivity() {
  const { user } = useAuth();
  const userService = UserService.getInstance(supabase);
  
  return useApi(
    async () => {
      if (!user?.id) return [];
      
      // This would fetch user's recent activities
      // For now, return empty array as the activity system isn't fully implemented
      return [];
    },
    [user?.id],
    {
      immediate: !!user?.id,
      cacheKey: user?.id ? `user-activity-${user.id}` : undefined,
      cacheTime: 1 * 60 * 1000 // 1 minute
    }
  );
}

// Hook for checking if profile is complete
export function useProfileCompletion() {
  const { data: profile, loading } = useUserProfile();

  const completion = {
    isComplete: false,
    percentage: 0,
    missingFields: [] as string[]
  };

  if (!loading && profile) {
    const requiredFields = [
      'display_name',
      'preferred_position',
      'location',
      'bio'
    ];

    const completedFields = requiredFields.filter(field => {
      const value = profile[field as keyof typeof profile];
      return value && value.toString().trim() !== '';
    });

    completion.percentage = Math.round((completedFields.length / requiredFields.length) * 100);
    completion.isComplete = completion.percentage === 100;
    completion.missingFields = requiredFields.filter(field => {
      const value = profile[field as keyof typeof profile];
      return !value || value.toString().trim() === '';
    });
  }

  return {
    ...completion,
    loading
  };
}
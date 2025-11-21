import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export interface ProfileUpdateData {
  display_name?: string;
  full_name?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
}

export const useUpdateProfile = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProfile = async (userId: string, updates: ProfileUpdateData): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('useUpdateProfile - Starting update for user:', userId);
      console.log('useUpdateProfile - Updates:', updates);

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      console.log('useUpdateProfile - Existing profile:', existingProfile);

      if (existingProfile) {
        // Update existing profile
        console.log('useUpdateProfile - Updating existing profile');
        const { data: updatedData, error: updateError } = await supabase
          .from('user_profiles')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId)
          .select();

        console.log('useUpdateProfile - Update result:', updatedData);
        console.log('useUpdateProfile - Update error:', updateError);

        if (updateError) throw updateError;
      } else {
        // Create new profile
        console.log('useUpdateProfile - Creating new profile');
        const { data: insertedData, error: insertError } = await supabase
          .from('user_profiles')
          .insert({
            id: userId,
            ...updates,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select();

        console.log('useUpdateProfile - Insert result:', insertedData);
        console.log('useUpdateProfile - Insert error:', insertError);

        if (insertError) throw insertError;
      }

      console.log('useUpdateProfile - Success!');
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update profile';
      setError(errorMessage);
      console.error('useUpdateProfile - Error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { updateProfile, isLoading, error, clearError: () => setError(null) };
};

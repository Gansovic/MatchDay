import { supabase } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  email: string;
  display_name?: string;
  full_name?: string;
  avatar_url?: string;
  role?: string;
}

export class UserService {
  static async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error getting current user:', error);
        return null;
      }
      return user;
    } catch (error) {
      console.error('Unexpected error getting current user:', error);
      return null;
    }
  }

  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error getting user profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Unexpected error getting user profile:', error);
      return null;
    }
  }

  static async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating user profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Unexpected error updating user profile:', error);
      return null;
    }
  }

  static async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  static async signUp(email: string, password: string, userData?: Partial<UserProfile>) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData || {}
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      throw error;
    }
  }

  static async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      throw error;
    }
  }
}
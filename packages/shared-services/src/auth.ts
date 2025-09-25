import { supabase } from './supabase';
import type { User } from '@matchday/shared-types';

export const authService = {
  getCurrentUser: async (): Promise<User | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    return user ? {
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.name || user.email || 'Unknown User',
      avatar_url: user.user_metadata?.avatar_url,
      created_at: user.created_at,
      updated_at: user.updated_at || user.created_at,
    } : null;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }
};
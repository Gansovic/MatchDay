/**
 * Supabase Authentication Provider
 * 
 * Real authentication system using Supabase Auth.
 * Provides authentication context and hooks for the entire application.
 */

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (data: {
    email: string;
    password: string;
    displayName?: string;
    preferredPosition?: string;
    location?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  signIn: (data: {
    email: string;
    password: string;
  }) => Promise<{ success: boolean; error?: string }>;
  signInWithOAuth: (provider: 'google' | 'github' | 'discord') => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: {
    display_name?: string;
    avatar_url?: string;
    preferred_position?: string;
    bio?: string;
    date_of_birth?: string;
    location?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  getSession: () => Promise<Session | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.email);
      
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);

      // Handle sign in success - create/update user profile
      if (event === 'SIGNED_IN' && session?.user) {
        await ensureUserProfile(session.user);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Ensure user profile exists in database
  const ensureUserProfile = async (user: User) => {
    try {
      // Check if user profile exists
      const { data: existingProfile } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!existingProfile) {
        // Create user profile if it doesn't exist
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email!,
            role: 'player',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          console.error('Error creating user profile:', insertError);
        } else {
          console.log('Created user profile for:', user.email);
        }
      }
    } catch (error) {
      console.error('Error ensuring user profile:', error);
    }
  };

  const signUp = async (data: {
    email: string;
    password: string;
    displayName?: string;
    preferredPosition?: string;
    location?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            display_name: data.displayName,
            preferred_position: data.preferredPosition,
            location: data.location,
          }
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to sign up' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (data: {
    email: string;
    password: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        return { success: false, error: error.message };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Sign in exception:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to sign in' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithOAuth = async (provider: 'google' | 'github' | 'discord'): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to sign in with OAuth' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase.auth.signOut();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to sign out' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: {
    display_name?: string;
    avatar_url?: string;
    preferred_position?: string;
    bio?: string;
    date_of_birth?: string;
    location?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!user) {
        return { success: false, error: 'Not authenticated' };
      }

      // Update user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: updates
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update profile' 
      };
    }
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send reset email' 
      };
    }
  };

  const getSession = async (): Promise<Session | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  };

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    signUp,
    signIn,
    signInWithOAuth,
    signOut,
    updateProfile,
    resetPassword,
    getSession
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Helper hook for protected routes
export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Redirect to login page
      window.location.href = '/auth/login';
    }
  }, [isAuthenticated, isLoading]);

  return { isAuthenticated, isLoading };
}
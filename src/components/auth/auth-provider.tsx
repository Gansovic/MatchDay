/**
 * Authentication Provider Component
 * 
 * React context provider that manages authentication state across the application.
 * Follows LEVER principles by providing centralized auth state management.
 * 
 * @example
 * ```typescript
 * <AuthProvider supabaseClient={supabase}>
 *   <App />
 * </AuthProvider>
 * 
 * // In components:
 * const { user, signIn, signOut, isLoading } = useAuth();
 * ```
 */

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';

// Test environment variables first
console.log('🚀 AuthProvider loading...', {
  hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 10) + '...'
});

let supabase: any = null;

try {
  // Use the fixed client that handles CORS issues
  const { supabaseNoClientInfo } = require('@/lib/supabase/client-fixed');
  supabase = supabaseNoClientInfo;
  console.log('✅ Supabase client loaded successfully (using fixed version without X-Client-Info)');
} catch (error) {
  console.error('🚨 Failed to load Supabase client:', error);
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (data: {
    email: string;
    password: string;
    displayName: string;
    preferredPosition?: string;
    location?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  signIn: (data: {
    email: string;
    password: string;
  }) => Promise<{ success: boolean; error?: string }>;
  signInWithOAuth: (provider: 'google' | 'github' | 'discord') => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: {
    display_name?: string;
    avatar_url?: string;
    preferred_position?: string;
    bio?: string;
    date_of_birth?: string;
    location?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  hasPermission: (permission: 'create_league' | 'manage_team' | 'admin') => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({
  children
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Debug environment variables
    console.log('🔧 Environment check:', {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 10) + '...'
    });

    // Subscribe to auth state changes with Supabase directly
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: any) => {
        console.log('Auth state change:', event, session?.user ? 'User present' : 'No user');
        
        if (event === 'SIGNED_OUT' || !session?.user) {
          // Ensure complete cleanup on sign out
          setUser(null);
          
          // Clear localStorage on sign out event
          if (typeof window !== 'undefined') {
            Object.keys(localStorage).forEach(key => {
              if (key.includes('supabase') || key.includes('auth')) {
                localStorage.removeItem(key);
              }
            });
          }
        } else if (session?.user) {
          setUser(session.user);
        }
        
        setIsLoading(false);
      }
    );

    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    };

    getInitialSession();

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signUp = async (data: {
    email: string;
    password: string;
    displayName: string;
    preferredPosition?: string;
    location?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create account'
      };
    }
  };

  const signIn = async (data: {
    email: string;
    password: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('🔐 Attempting sign in with:', { 
        email: data.email, 
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      });

      console.log('🔐 Authenticating with Supabase client...');
      
      try {
        const { data: authData, error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password
        });

        if (error) {
          console.error('🚨 Supabase auth error:', error);
          return { success: false, error: error.message };
        }

        console.log('✅ Supabase authentication successful:', { 
          user: authData.user?.email,
          hasSession: !!authData.session 
        });

        return { success: true };
      } catch (networkError) {
        console.error('🚨 Network error during Supabase auth:', networkError);
        
        // Fallback: Try direct fetch as a last resort
        try {
          console.log('🔄 Attempting direct fetch fallback...');
          const directResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`, {
            method: 'POST',
            headers: {
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              'Content-Type': 'application/json',
              'Origin': window.location.origin
            },
            body: JSON.stringify({
              email: data.email,
              password: data.password
            })
          });
          
          if (directResponse.ok) {
            const result = await directResponse.json();
            console.log('✅ Direct fetch authentication successful as fallback!', { user: result.user?.email });
            
            // Manually set the session in Supabase client
            if (result.access_token) {
              await supabase.auth.setSession({
                access_token: result.access_token,
                refresh_token: result.refresh_token
              });
            }
            
            return { success: true };
          } else {
            const errorText = await directResponse.text();
            console.error('🚨 Direct fetch fallback also failed:', directResponse.status, errorText);
            return { success: false, error: `Network error: ${errorText}` };
          }
        } catch (fallbackError) {
          console.error('🚨 Both Supabase client and direct fetch failed:', fallbackError);
          return { 
            success: false, 
            error: `Authentication failed: ${networkError instanceof Error ? networkError.message : 'Network error'}`
          };
        }
      }
    } catch (error) {
      console.error('🚨 Unexpected auth error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to sign in'
      };
    }
  };

  const signInWithOAuth = async (
    provider: 'google' | 'github' | 'discord'
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to sign in'
      };
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      // Clear Supabase session
      await supabase.auth.signOut();
      
      // Manually clear localStorage to ensure all tokens are removed
      if (typeof window !== 'undefined') {
        // Clear Supabase auth tokens
        localStorage.removeItem('sb-' + process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('http://', '').replace('https://', '').split('.')[0] + '-auth-token');
        
        // Clear any other auth-related items
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('supabase.auth') || key.includes('auth-token')) {
            localStorage.removeItem(key);
          }
        });
      }
      
      // Clear user state immediately
      setUser(null);
      
    } catch (error) {
      console.error('Sign out error:', error);
      // Even if logout fails, clear local state to prevent UI issues
      setUser(null);
      
      // Clear localStorage anyway
      if (typeof window !== 'undefined') {
        Object.keys(localStorage).forEach(key => {
          if (key.includes('supabase') || key.includes('auth')) {
            localStorage.removeItem(key);
          }
        });
      }
      
      throw error; // Re-throw so UI can handle the error
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
      const { error } = await supabase.auth.updateUser({
        data: updates
      });

      if (error) {
        return { success: false, error: error.message };
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

  const hasPermission = (permission: 'create_league' | 'manage_team' | 'admin'): boolean => {
    if (!user) return false;
    
    // For now, all authenticated users can create leagues and manage teams
    switch (permission) {
      case 'create_league':
      case 'manage_team':
        return true;
      case 'admin':
        // Check if user has admin role (would be stored in user metadata)
        return user.user_metadata?.role === 'admin';
      default:
        return false;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    signUp,
    signIn,
    signInWithOAuth,
    signOut,
    updateProfile,
    resetPassword,
    hasPermission
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Higher-order component for protecting routes
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> => {
  return function AuthenticatedComponent(props: P) {
    const { user, isLoading } = useAuth();

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (!user) {
      // Redirect to sign in page or show sign in modal
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Authentication Required
            </h2>
            <p className="text-gray-600 mb-8">
              Please sign in to access this page.
            </p>
            {/* You would typically redirect to a sign-in page here */}
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
};

// Hook for requiring authentication
export const useRequireAuth = (): User => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    throw new Promise(() => {}); // Suspend until loading is complete
  }

  if (!user) {
    throw new Error('Authentication required');
  }

  return user;
};
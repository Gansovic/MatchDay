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
  signOut: () => Promise<{ success: boolean; error?: string; canForceLogout?: boolean }>;
  forceSignOut: () => Promise<{ success: boolean; error?: string }>;
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
  const [hasExplicitlyLoggedOut, setHasExplicitlyLoggedOut] = useState(false);

  // Initialize auth state
  useEffect(() => {
    // Get initial session with timeout protection
    const getInitialSession = async () => {
      console.log('🔑 Starting getInitialSession...');
      
      try {
        // Check if user has explicitly logged out
        const loggedOutFlag = localStorage.getItem('explicitly_logged_out');
        console.log('🔑 Checking logout flag:', loggedOutFlag);
        
        if (loggedOutFlag === 'true') {
          console.log('🚪 User has explicitly logged out, clearing any existing session and skipping restore');
          
          // Force clear any existing session that might have persisted
          try {
            await supabase.auth.signOut({ scope: 'global' });
            console.log('🚪 Session cleared successfully');
          } catch (signOutError) {
            console.warn('🚪 Error clearing session, but continuing:', signOutError);
          }
          
          setSession(null);
          setUser(null);
          setHasExplicitlyLoggedOut(true);
          setIsLoading(false);
          console.log('🚪 Logout state set, loading: false');
          return;
        }
        
        console.log('🔑 No logout flag found, getting initial session...');
        
        // Add timeout protection to prevent infinite loading
        console.log('🔑 Calling supabase.auth.getSession() with 10s timeout...');
        
        try {
          const sessionPromise = supabase.auth.getSession();
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Session retrieval timeout after 10 seconds')), 10000)
          );
          
          const result = await Promise.race([sessionPromise, timeoutPromise]) as any;
          console.log('🔑 Session call completed successfully');
          
          const { data: { session: initialSession }, error } = result;
          
          if (error) {
            console.error('🔑 Supabase returned error:', error);
            throw error;
          }
          
          console.log('🔑 Initial session found:', !!initialSession, initialSession?.user?.email || 'no email');
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          console.log('🔑 Success case: session/user set, loading will be false');
          
        } catch (timeoutOrNetworkError) {
          console.error('🔑 Session retrieval failed:', timeoutOrNetworkError);
          
          // If it's a timeout, try one more time with a longer timeout
          if (timeoutOrNetworkError.message.includes('timeout')) {
            console.log('🔑 First attempt timed out, trying once more with 15s timeout...');
            
            try {
              const retryPromise = supabase.auth.getSession();
              const longTimeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Final session retrieval timeout')), 15000)
              );
              
              const retryResult = await Promise.race([retryPromise, longTimeoutPromise]) as any;
              console.log('🔑 Retry session call succeeded');
              
              const { data: { session: retrySession }, error: retryError } = retryResult;
              
              if (retryError) {
                console.error('🔑 Retry returned error:', retryError);
                throw retryError;
              }
              
              console.log('🔑 Retry session found:', !!retrySession, retrySession?.user?.email || 'no email');
              setSession(retrySession);
              setUser(retrySession?.user ?? null);
              
            } catch (finalError) {
              console.error('🔑 Final retry also failed:', finalError);
              console.log('🔑 Defaulting to logged out state due to connection issues');
              setSession(null);
              setUser(null);
            }
          } else {
            console.log('🔑 Non-timeout error, defaulting to logged out state');
            setSession(null);
            setUser(null);
          }
        }
      } catch (error) {
        console.error('🔑 Exception getting initial session (including timeout):', error);
        console.log('🔑 Exception case: defaulting to logged out state');
        setSession(null);
        setUser(null);
      } finally {
        console.log('🔑 Setting isLoading to false - auth state will be determined');
        setIsLoading(false);
        
        // Log final auth state for debugging
        setTimeout(() => {
          console.log('🔑 Final auth state - User:', user?.email || 'null', 'Session:', !!session, 'Loading:', false);
        }, 100);
        
        console.log('🔑 getInitialSession completed');
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state change:', event, session?.user?.email || 'no user');
      
      // Always update state based on actual Supabase auth events
      // This ensures UI reflects the true authentication state
      console.log('🔄 Updating auth state - Event:', event, 'HasSession:', !!session, 'HasUser:', !!session?.user);
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      
      console.log('🔄 Auth state updated - User:', session?.user?.email || 'null', 'Loading:', false);

      // Handle sign in success - create/update user profile and clear logout flag
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('🔑 User signed in, clearing logout flag and ensuring profile');
        // Clear logout flag since user is now successfully signed in
        if (typeof window !== 'undefined') {
          localStorage.removeItem('explicitly_logged_out');
          setHasExplicitlyLoggedOut(false);
        }
        await ensureUserProfile(session.user);
      }
      
      // Handle sign out - respect the logout flag for UI consistency
      if (event === 'SIGNED_OUT' || !session) {
        console.log('🔄 User signed out or session ended');
        const loggedOutFlag = localStorage.getItem('explicitly_logged_out');
        if (loggedOutFlag === 'true') {
          console.log('🔄 Logout flag present, maintaining explicit logout state');
          setHasExplicitlyLoggedOut(true);
        }
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
      
      // Clear explicit logout flag on successful login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('explicitly_logged_out');
        setHasExplicitlyLoggedOut(false);
        console.log('🔑 Cleared logout flag on successful login');
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
      console.log('🚪 Starting logout process...');
      
      // Get current session before clearing
      const currentSession = await supabase.auth.getSession();
      console.log('🚪 Current session before logout:', !!currentSession.data.session);
      
      if (!currentSession.data.session) {
        console.log('🚪 No active session found, user already logged out');
        // Clean up any remaining state
        setUser(null);
        setSession(null);
        if (typeof window !== 'undefined') {
          localStorage.setItem('explicitly_logged_out', 'true');
          setHasExplicitlyLoggedOut(true);
        }
        return { success: true };
      }
      
      // Force clear Supabase auth session with global scope
      console.log('🚪 Calling supabase.auth.signOut() with timeout protection...');
      
      // Add timeout protection for signOut (shorter timeout for faster feedback)
      const signOutPromise = supabase.auth.signOut({ scope: 'global' });
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('SignOut timeout after 8 seconds')), 8000)
      );
      
      const { error } = await Promise.race([signOutPromise, timeoutPromise]) as any;
      
      if (error) {
        console.error('🚪 Supabase signOut failed:', error);
        // Don't clear local state if signOut failed - keep user logged in
        
        // Provide more helpful error message based on error type
        let errorMessage = `Logout failed: ${error.message}`;
        if (error.message.includes('timeout')) {
          errorMessage = 'Logout timed out due to network issues. You can try again or use "Force Logout" to clear local session only.';
        }
        
        return { 
          success: false, 
          error: errorMessage,
          canForceLogout: true  // Signal that force logout is available
        };
      }
      
      console.log('🚪 Supabase signOut call completed');
      
      // Verify session is actually cleared with retry
      let sessionCleared = false;
      let retries = 0;
      const maxRetries = 3;
      
      while (!sessionCleared && retries < maxRetries) {
        // Wait a bit for the session to be cleared
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const afterSession = await supabase.auth.getSession();
        sessionCleared = !afterSession.data.session;
        
        console.log(`🚪 Session verification attempt ${retries + 1}: cleared=${sessionCleared}`);
        
        if (!sessionCleared && retries < maxRetries - 1) {
          console.log('🚪 Session still active, retrying signOut...');
          await supabase.auth.signOut({ scope: 'global' });
        }
        
        retries++;
      }
      
      if (!sessionCleared) {
        console.error('🚪 Failed to clear session after multiple attempts');
        return { 
          success: false, 
          error: 'Unable to complete logout. Please refresh the page and try again.' 
        };
      }
      
      console.log('🚪 Session successfully cleared, now safe to update UI state...');
      
      // Only now clear local state since we confirmed session is cleared
      setUser(null);
      setSession(null);
      
      // Set logout flag and clear storage only after successful signOut
      if (typeof window !== 'undefined') {
        console.log('🚪 Setting logout flag after successful signOut...');
        localStorage.setItem('explicitly_logged_out', 'true');
        setHasExplicitlyLoggedOut(true);
        
        console.log('🚪 Clearing Supabase-specific browser storage...');
        
        // Get all storage keys
        const localKeys = Object.keys(localStorage);
        console.log('🚪 LocalStorage keys before clear:', localKeys.length);
        
        // Identify and remove Supabase-specific keys from localStorage
        const supabaseLocalKeys = localKeys.filter(key => 
          key.includes('supabase') || 
          key.includes('sb-') || 
          (key.includes('auth') && key !== 'explicitly_logged_out') ||
          key.startsWith('supabase.') ||
          key.includes('access_token') ||
          key.includes('refresh_token')
        );
        
        console.log('🚪 Removing Supabase localStorage keys:', supabaseLocalKeys);
        supabaseLocalKeys.forEach(key => {
          localStorage.removeItem(key);
          console.log(`🚪 Removed localStorage key: ${key}`);
        });
        
        // Clear all sessionStorage
        sessionStorage.clear();
        console.log('🚪 Cleared all sessionStorage');
        
        // Ensure logout flag persists
        localStorage.setItem('explicitly_logged_out', 'true');
        
        const remainingKeys = Object.keys(localStorage);
        console.log('🚪 Remaining localStorage keys after cleanup:', remainingKeys);
      }

      console.log('🚪 Logout completed successfully - session cleared and UI updated');
      return { success: true };
    } catch (error) {
      console.error('🚪 SignOut exception:', error);
      return { 
        success: false,
        error: error instanceof Error ? error.message : 'Logout failed due to unexpected error' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const forceSignOut = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      console.log('🚪 FORCE LOGOUT: Clearing local state without waiting for Supabase');
      
      // Clear local state immediately
      setUser(null);
      setSession(null);
      
      // Set logout flag
      if (typeof window !== 'undefined') {
        localStorage.setItem('explicitly_logged_out', 'true');
        setHasExplicitlyLoggedOut(true);
        
        // Clear all Supabase-related storage
        const allKeys = Object.keys(localStorage);
        const supabaseKeys = allKeys.filter(key => 
          key.includes('supabase') || 
          key.includes('sb-') || 
          (key.includes('auth') && key !== 'explicitly_logged_out') ||
          key.startsWith('supabase.') ||
          key.includes('access_token') ||
          key.includes('refresh_token')
        );
        
        supabaseKeys.forEach(key => localStorage.removeItem(key));
        sessionStorage.clear();
        
        // Restore logout flag
        localStorage.setItem('explicitly_logged_out', 'true');
      }
      
      // Try to signOut in background without waiting (best effort)
      supabase.auth.signOut({ scope: 'global' }).catch(error => {
        console.warn('🚪 Background signOut failed (expected with network issues):', error);
      });
      
      console.log('🚪 FORCE LOGOUT: Local state cleared. Note: Server session may still be active.');
      return { 
        success: true,
        error: 'Local logout completed. Server session may remain active due to network issues.'
      };
    } catch (error) {
      console.error('🚪 Force logout error:', error);
      return { 
        success: false,
        error: error instanceof Error ? error.message : 'Force logout failed' 
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
    forceSignOut,
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
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
import { AuthService, AuthUser } from '@/lib/auth/auth.service';
import { LoadingDialog } from '@/components/ui/loading-dialog';

interface AuthContextType {
  user: AuthUser | null;
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
  supabaseClient: any;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  supabaseClient
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const authService = AuthService.getInstance();

  useEffect(() => {
    // Initialize auth service with Supabase client
    authService.setSupabaseClient(supabaseClient);

    // Subscribe to auth state changes
    const unsubscribe = authService.onAuthStateChange((user) => {
      setUser(user);
      setIsLoading(false);
    });

    // Initial user check
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setIsLoading(false);

    return unsubscribe;
  }, [supabaseClient]);

  const signUp = async (data: {
    email: string;
    password: string;
    displayName: string;
    preferredPosition?: string;
    location?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await LoadingDialog.show({
        title: 'Creating Account',
        message: 'Setting up your player profile...',
        operation: () => authService.signUp(data)
      });

      if (result.error) {
        return { success: false, error: result.error.message };
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
      const result = await LoadingDialog.show({
        title: 'Signing In',
        message: 'Authenticating your account...',
        operation: () => authService.signIn(data)
      });

      if (result.error) {
        return { success: false, error: result.error.message };
      }

      return { success: true };
    } catch (error) {
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
      const result = await authService.signInWithOAuth(provider);

      if (result.error) {
        return { success: false, error: result.error.message };
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
      await LoadingDialog.show({
        title: 'Signing Out',
        message: 'Ending your session...',
        operation: () => authService.signOut()
      });
    } catch (error) {
      console.error('Sign out error:', error);
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
      const result = await LoadingDialog.show({
        title: 'Updating Profile',
        message: 'Saving your changes...',
        operation: () => authService.updateProfile(updates)
      });

      if (result.error) {
        return { success: false, error: result.error.message };
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
      const result = await authService.resetPassword(email);

      if (result.error) {
        return { success: false, error: result.error.message };
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
    return authService.hasPermission(permission);
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
export const useRequireAuth = (): AuthUser => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    throw new Promise(() => {}); // Suspend until loading is complete
  }

  if (!user) {
    throw new Error('Authentication required');
  }

  return user;
};
/**
 * Development Authentication Provider
 * 
 * A wrapper that provides mock authentication for development when real auth is problematic.
 * Set NEXT_PUBLIC_USE_MOCK_AUTH=true to use mock auth instead of Supabase.
 */

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { mockAuthService, type MockUser, type MockSession } from '@/lib/auth/mock-auth.service';

// Development mode flag - set this to true to bypass real auth
const USE_MOCK_AUTH = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true' || true; // Force mock auth for now

interface DevAuthContextType {
  user: MockUser | null;
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
  getSession: () => Promise<MockSession | null>;
}

const DevAuthContext = createContext<DevAuthContextType | undefined>(undefined);

interface DevAuthProviderProps {
  children: React.ReactNode;
}

export const DevAuthProvider: React.FC<DevAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<MockUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('🧪 Development Auth Provider initialized with mock auth:', USE_MOCK_AUTH);

    if (USE_MOCK_AUTH) {
      // Subscribe to mock auth state changes
      const { data } = mockAuthService.onAuthStateChange((event: string, session: MockSession | null) => {
        console.log('🔄 Mock auth state change:', event, session?.user ? 'User present' : 'No user');
        
        if (event === 'SIGNED_OUT' || !session?.user) {
          setUser(null);
        } else if (session?.user) {
          setUser(session.user);
        }
        
        setIsLoading(false);
      });

      // Get initial session
      const getInitialSession = async () => {
        const { data: sessionData } = await mockAuthService.getSession();
        if (sessionData.session?.user) {
          setUser(sessionData.session.user);
          setIsLoading(false);
        } else {
          // For development, let user manually login via /dev-login page
          console.log('🔑 No session found - user needs to visit /dev-login to authenticate');
          setUser(null);
          setIsLoading(false);
        }
      };

      getInitialSession();

      return () => {
        data.subscription?.unsubscribe();
      };
    }
  }, []);

  const signUp = async (data: {
    email: string;
    password: string;
    displayName: string;
    preferredPosition?: string;
    location?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      // For mock auth, just create a user and sign them in
      const signInResult = await signIn({ email: data.email, password: data.password });
      return signInResult;
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
      console.log('🔐 Mock auth sign in attempt:', { email: data.email });
      
      const { data: authData, error } = await mockAuthService.signInWithPassword(data.email, data.password);
      
      if (error) {
        console.error('🚨 Mock auth error:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Mock authentication successful:', { 
        user: authData?.user?.email,
        hasSession: !!authData?.session
      });

      return { success: true };
    } catch (error) {
      console.error('🚨 Mock auth unexpected error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to sign in'
      };
    }
  };

  const signInWithOAuth = async (
    provider: 'google' | 'github' | 'discord'
  ): Promise<{ success: boolean; error?: string }> => {
    // For development, just simulate OAuth success with a default user
    return signIn({ email: 'player@matchday.com', password: 'player123!' });
  };

  const signOut = async (): Promise<void> => {
    try {
      await mockAuthService.signOut();
      setUser(null);
    } catch (error) {
      console.error('Mock sign out error:', error);
      setUser(null);
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
      // For mock auth, just simulate success
      console.log('🔧 Mock profile update:', updates);
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
      // For mock auth, just simulate success
      console.log('📧 Mock password reset for:', email);
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
    
    // For development, all authenticated users have permissions
    switch (permission) {
      case 'create_league':
      case 'manage_team':
        return true;
      case 'admin':
        return user.user_metadata?.role === 'admin' || user.role === 'admin';
      default:
        return false;
    }
  };

  const getSession = async (): Promise<MockSession | null> => {
    if (USE_MOCK_AUTH) {
      const { data } = await mockAuthService.getSession();
      return data.session;
    }
    return null;
  };

  const value: DevAuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    signUp,
    signIn,
    signInWithOAuth,
    signOut,
    updateProfile,
    resetPassword,
    hasPermission,
    getSession
  };

  return (
    <DevAuthContext.Provider value={value}>
      {children}
    </DevAuthContext.Provider>
  );
};

export const useDevAuth = (): DevAuthContextType => {
  const context = useContext(DevAuthContext);
  if (context === undefined) {
    throw new Error('useDevAuth must be used within a DevAuthProvider');
  }
  return context;
};

// Alias for backwards compatibility
export const useAuth = useDevAuth;

// Development utilities
export const devAuthUtils = {
  switchToUser: (email: string) => {
    const mockUsers = {
      'test@matchday.com': 'test123456',
      'admin@matchday.com': 'admin123!',
      'player@matchday.com': 'player123!',
      'john.doe@example.com': 'admin123!',
      'jane.smith@example.com': 'admin123!',
      'mike.wilson@example.com': 'admin123!'
    };
    
    const password = mockUsers[email as keyof typeof mockUsers];
    if (password) {
      mockAuthService.signInWithPassword(email, password);
    }
  },
  
  autoLogin: () => {
    mockAuthService.signInWithPassword('player@matchday.com', 'player123!');
  },
  
  getMockUsers: () => {
    return Object.keys({
      'test@matchday.com': 'test123456',
      'admin@matchday.com': 'admin123!',
      'player@matchday.com': 'player123!',
      'john.doe@example.com': 'admin123!',
      'jane.smith@example.com': 'admin123!',
      'mike.wilson@example.com': 'admin123!'
    });
  }
};

// Make utilities available globally in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).devAuth = devAuthUtils;
  console.log('🧪 Development auth utilities available at window.devAuth');
}
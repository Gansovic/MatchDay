import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthService, AuthUser } from '@matchday/auth';
import { supabase } from '../../lib/supabase';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Initialize auth service
    const authService = AuthService.getInstance();
    authService.setSupabaseClient(supabase);

    let hasInitialized = false;

    // Subscribe to auth changes
    const unsubscribe = authService.onAuthStateChange((authUser) => {
      setUser(authUser);
      // Only set loading to false after we've received a real session check
      // The first callback with a user (or confirmed null) indicates initialization is complete
      if (!hasInitialized) {
        hasInitialized = true;
        // Small delay to allow for potential second auth event with actual user
        setTimeout(() => {
          setLoading(false);
        }, 50);
      } else {
        setLoading(false);
      }
    });

    // Fallback: Set loading to false after 2 seconds if no auth event fires
    const fallbackTimeout = setTimeout(() => {
      if (loading && !hasInitialized) {
        setLoading(false);
      }
    }, 2000);

    return () => {
      unsubscribe();
      clearTimeout(fallbackTimeout);
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const authService = AuthService.getInstance();
    const { error } = await authService.signIn({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    const authService = AuthService.getInstance();
    const { error } = await authService.signUp({ email, password, displayName });
    return { error };
  };

  const signOut = async () => {
    const authService = AuthService.getInstance();
    await authService.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

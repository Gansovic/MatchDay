'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/supabase-auth-provider';

interface DevAuthHelperProps {
  children: React.ReactNode;
}

export default function DevAuthHelper({ children }: DevAuthHelperProps) {
  const { user, signIn, isLoading } = useAuth();
  const [authAttempted, setAuthAttempted] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const ensureAuth = async () => {
      if (process.env.NODE_ENV !== 'development') {
        setAuthLoading(false);
        return;
      }

      if (isLoading) {
        return; // Wait for auth provider to finish loading
      }

      if (user) {
        setAuthLoading(false);
        return; // User is already authenticated
      }

      if (!authAttempted) {
        console.log('🔑 Development: Auto-authenticating user...');
        setAuthAttempted(true);
        
        try {
          const result = await signIn({
            email: 'player@matchday.com',
            password: 'player123!'
          });
          
          if (result.success) {
            console.log('✅ Development auto-authentication successful');
          } else {
            console.error('❌ Development auto-authentication failed:', result.error);
          }
        } catch (error) {
          console.error('❌ Development auto-authentication error:', error);
        }
      }
      
      setAuthLoading(false);
    };

    ensureAuth();
  }, [user, isLoading, signIn, authAttempted]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            {process.env.NODE_ENV === 'development' ? 'Setting up development authentication...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  if (!user && process.env.NODE_ENV === 'development') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔑</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Authentication Required
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please visit the development login page to authenticate.
          </p>
          <a
            href="/dev-login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            🔑 Development Login
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
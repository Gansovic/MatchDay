/**
 * OAuth Callback Page for MatchDay
 * 
 * Handles OAuth authentication callbacks from providers like Google, GitHub, etc.
 * Processes the auth code exchange and redirects appropriately.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

type CallbackState = 'loading' | 'success' | 'error';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<CallbackState>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        // Handle OAuth errors
        if (error) {
          console.error('OAuth error:', error, errorDescription);
          setError(errorDescription || 'Authentication failed');
          setState('error');
          return;
        }

        // Handle missing code
        if (!code) {
          console.error('Missing authorization code');
          setError('Missing authorization code');
          setState('error');
          return;
        }

        // Exchange code for session
        const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

        if (sessionError) {
          console.error('Session exchange error:', sessionError);
          setError(sessionError.message);
          setState('error');
          return;
        }

        if (!data.session) {
          console.error('No session received');
          setError('Failed to create session');
          setState('error');
          return;
        }

        // Success! Set state and redirect
        setState('success');

        // Wait a moment to show success state
        setTimeout(() => {
          // Check for return URL in the state parameter
          const returnUrl = searchParams.get('state');
          
          if (returnUrl) {
            try {
              // Validate the return URL
              const url = new URL(returnUrl, window.location.origin);
              if (url.origin === window.location.origin) {
                router.push(returnUrl);
                return;
              }
            } catch {
              // Invalid return URL, fallback to dashboard
            }
          }

          // Default redirect to dashboard
          router.push('/dashboard');
        }, 2000);

      } catch (error) {
        console.error('Unexpected callback error:', error);
        setError('An unexpected error occurred');
        setState('error');
      }
    };

    handleAuthCallback();
  }, [searchParams, router]);

  const handleRetryLogin = () => {
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-900 shadow-2xl rounded-2xl p-8 text-center">
          {state === 'loading' && (
            <>
              {/* Loading State */}
              <div className="mx-auto w-16 h-16 mb-6 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Completing Sign In
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Please wait while we set up your account...
              </p>
            </>
          )}

          {state === 'success' && (
            <>
              {/* Success State */}
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Sign In Successful!
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Welcome to MatchDay! Redirecting you to your dashboard...
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                Redirecting...
              </div>
            </>
          )}

          {state === 'error' && (
            <>
              {/* Error State */}
              <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
                <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Sign In Failed
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {error || 'There was a problem signing you in. Please try again.'}
              </p>

              {/* Error Details */}
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-left">
                <h3 className="font-medium text-red-900 dark:text-red-100 mb-2 text-sm">
                  What you can do:
                </h3>
                <ul className="text-sm text-red-800 dark:text-red-200 space-y-1">
                  <li>• Try signing in again</li>
                  <li>• Check your internet connection</li>
                  <li>• Clear your browser cache and cookies</li>
                  <li>• Contact support if the problem persists</li>
                </ul>
              </div>

              {/* Retry Button */}
              <button
                onClick={handleRetryLogin}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
              >
                Back to Sign In
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Having trouble? Contact our support team for help.
          </p>
        </div>
      </div>
    </div>
  );
}
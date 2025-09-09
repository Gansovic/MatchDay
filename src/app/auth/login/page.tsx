/**
 * Login Page for MatchDay
 * 
 * Professional login experience with:
 * - Redirect handling for protected routes
 * - Error message display
 * - Social authentication
 * - Responsive design
 */

'use client';

import React, { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/supabase-auth-provider';
import { LoginForm } from '@/components/auth/login-form';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

function LoginPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [showForgotPassword, setShowForgotPassword] = React.useState(false);

  const returnUrl = searchParams.get('returnUrl');
  const error = searchParams.get('error');

  // Redirect authenticated users
  useEffect(() => {
    if (!isLoading && user) {
      // User is already logged in, redirect them
      if (returnUrl) {
        try {
          // Validate the return URL is safe
          const url = new URL(returnUrl, window.location.origin);
          if (url.origin === window.location.origin) {
            router.push(returnUrl);
            return;
          }
        } catch {
          // Invalid return URL, fallback to dashboard
        }
      }
      
      router.push('/dashboard');
    }
  }, [user, isLoading, returnUrl, router]);

  const handleLoginSuccess = () => {
    if (returnUrl) {
      try {
        // Validate the return URL is safe
        const url = new URL(returnUrl, window.location.origin);
        if (url.origin === window.location.origin) {
          router.push(returnUrl);
          return;
        }
      } catch {
        // Invalid return URL, fallback to dashboard
      }
    }
    
    router.push('/dashboard');
  };

  const handleSwitchToSignup = () => {
    const params = new URLSearchParams();
    if (returnUrl) params.set('returnUrl', returnUrl);
    router.push(`/auth/signup?${params.toString()}`);
  };

  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'callback_error':
        return 'There was an error signing you in. Please try again.';
      case 'access_denied':
        return 'Access denied. Please sign in to continue.';
      default:
        return 'An error occurred during authentication.';
    }
  };

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show loading while redirecting authenticated users
  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">You're already signed in. Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-center">
            {getErrorMessage(error)}
          </div>
        )}

        {/* Return URL Notice */}
        {returnUrl && (
          <div className="mb-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 text-center text-sm">
            Please sign in to continue to your requested page.
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white dark:bg-gray-900 shadow-2xl rounded-2xl p-8">
          {showForgotPassword ? (
            <ForgotPasswordForm
              onBackToLogin={() => setShowForgotPassword(false)}
            />
          ) : (
            <>
              <LoginForm
                onSuccess={handleLoginSuccess}
                onSwitchToSignup={handleSwitchToSignup}
              />
              
            </>
          )}
        </div>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
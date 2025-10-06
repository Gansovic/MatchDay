'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log the error to console in development
    console.error('Authentication error:', error);
  }, [error]);

  const getErrorMessage = (error: Error) => {
    const message = error.message.toLowerCase();
    
    if (message.includes('invalid login credentials')) {
      return 'The email or password you entered is incorrect. Please try again.';
    }
    if (message.includes('email not confirmed')) {
      return 'Please check your email to confirm your account before signing in.';
    }
    if (message.includes('user not found')) {
      return "We couldn't find an account with that email address.";
    }
    if (message.includes('network')) {
      return 'Network error. Please check your connection and try again.';
    }
    
    return 'An error occurred during authentication. Please try again.';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        <div className="text-center">
          {/* Error Icon */}
          <div className="mx-auto w-20 h-20 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mb-6">
            <svg
              className="w-10 h-10 text-yellow-600 dark:text-yellow-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          {/* Error Message */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            Authentication Error
          </h2>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {getErrorMessage(error)}
          </p>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push('/auth/login')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
            >
              Back to Login
            </button>
            <button
              onClick={reset}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl transition-colors"
            >
              Try Again
            </button>
          </div>

          {/* Help Text */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Need help?{' '}
              <button
                onClick={() => router.push('/auth/forgot-password')}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Reset your password
              </button>
              {' '}or{' '}
              <button
                onClick={() => router.push('/auth/signup')}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                create a new account
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
/**
 * Signup Page for MatchDay
 * 
 * Professional registration experience with:
 * - Player onboarding flow
 * - Social authentication
 * - Redirect handling
 * - Success state management
 */

'use client';

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SignupForm } from '@/components/auth/signup-form';
import { CheckCircle, ArrowRight } from 'lucide-react';

function SignupPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isSuccess, setIsSuccess] = React.useState(false);

  const returnUrl = searchParams.get('returnUrl');

  const handleSignupSuccess = () => {
    setIsSuccess(true);
  };

  const handleSwitchToLogin = () => {
    const params = new URLSearchParams();
    if (returnUrl) params.set('returnUrl', returnUrl);
    router.push(`/auth/login?${params.toString()}`);
  };

  const handleContinueToDashboard = () => {
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
    
    router.push('/');
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-900 shadow-2xl rounded-2xl p-8 text-center">
            {/* Success Icon */}
            <div className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>

            {/* Success Message */}
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Welcome to MatchDay!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Your player account has been created successfully. 
              You're now part of the league!
            </p>

            {/* Continue Button */}
            <button
              onClick={handleContinueToDashboard}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            >
              Continue to Dashboard
              <ArrowRight className="w-5 h-5" />
            </button>

            {/* Welcome Message */}
            <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                What's Next?
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 text-left">
                <li>• Complete your player profile</li>
                <li>• Browse and join leagues</li>
                <li>• Connect with other players</li>
                <li>• Start competing like a pro!</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Return URL Notice */}
        {returnUrl && (
          <div className="mb-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 text-center text-sm">
            Create an account to continue to your requested page.
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white dark:bg-gray-900 shadow-2xl rounded-2xl p-8">
          <SignupForm
            onSuccess={handleSignupSuccess}
            onSwitchToLogin={handleSwitchToLogin}
          />
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Already have an account?{' '}
            <button
              type="button"
              onClick={handleSwitchToLogin}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
            >
              Sign in here
            </button>
          </p>
        </div>

        {/* Trust Indicators */}
        <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
          <p>Secure • Encrypted • GDPR Compliant</p>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    }>
      <SignupPageContent />
    </Suspense>
  );
}
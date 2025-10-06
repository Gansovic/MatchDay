/**
 * Professional Forgot Password Form Component for MatchDay
 * 
 * Features:
 * - Simple email submission for password reset
 * - Professional sports league design
 * - Success state handling
 * - Email validation with Zod
 * - Loading states
 */

'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, ArrowLeft, Loader2, ArrowRight, CheckCircle } from 'lucide-react';
import { useAuth } from './auth-provider';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address')
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

interface ForgotPasswordFormProps {
  onBackToLogin?: () => void;
  className?: string;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onBackToLogin,
  className = ''
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { resetPassword } = useAuth();

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting }
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema)
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await resetPassword(data.email);
      
      if (!result.success) {
        setError(result.error || 'Failed to send reset email');
        return;
      }

      setIsSuccess(true);
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className={`w-full max-w-md mx-auto ${className}`}>
        <div className="text-center">
          {/* Success Icon */}
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>

          {/* Success Message */}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Check Your Email
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            We've sent a password reset link to:
          </p>
          <p className="text-gray-900 dark:text-gray-100 font-medium mb-8">
            {getValues('email')}
          </p>

          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6 text-left">
            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              What's next?
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Check your email inbox (and spam folder)</li>
              <li>• Click the reset link in the email</li>
              <li>• Create a new password</li>
              <li>• Sign in with your new password</li>
            </ul>
          </div>

          {/* Back to Login Button */}
          <button
            type="button"
            onClick={onBackToLogin}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Sign In
          </button>

          {/* Resend Email */}
          <div className="mt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Didn't receive the email?{' '}
              <button
                type="button"
                onClick={() => setIsSuccess(false)}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
              >
                Try again
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Forgot Password?
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          No worries! Enter your email and we'll send you a reset link.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Forgot Password Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              {...register('email')}
              type="email"
              id="email"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="Enter your email address"
              disabled={isLoading || isSubmitting}
              autoFocus
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || isSubmitting}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        >
          {(isLoading || isSubmitting) ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Sending Reset Link...
            </>
          ) : (
            <>
              Send Reset Link
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>

        {/* Back to Login Button */}
        <button
          type="button"
          onClick={onBackToLogin}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Sign In
        </button>
      </form>

      {/* Help Text */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <strong>Having trouble?</strong> Make sure to check your spam folder. 
          The reset link will expire in 24 hours for security reasons.
        </p>
      </div>
    </div>
  );
};
/**
 * Professional Login Form Component for MatchDay
 * 
 * Features:
 * - React Hook Form with Zod validation
 * - Professional sports league design
 * - OAuth integration (Google, GitHub, Discord)
 * - Loading states and error handling
 * - Responsive design with Tailwind CSS v4
 */

'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from './dev-auth-provider';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToSignup?: () => void;
  className?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onSwitchToSignup,
  className = ''
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn, signInWithOAuth } = useAuth();

  const {
    register,
    handleSubmit,
    setValue,
    clearErrors,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn(data);
      
      if (!result.success) {
        setError(result.error || 'Failed to sign in');
        return;
      }

      onSuccess?.();
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'github' | 'discord') => {
    setError(null);
    
    try {
      const result = await signInWithOAuth(provider);
      
      if (!result.success) {
        setError(result.error || `Failed to sign in with ${provider}`);
      }
      // OAuth will redirect, so no need to handle success here
    } catch (error) {
      setError('An unexpected error occurred');
    }
  };

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Welcome Back
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Sign in to your player account
        </p>
        
        {/* Development Player Credentials */}
        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-700 dark:text-green-300 font-medium mb-3">
            Development Test Accounts:
          </p>
          
          {/* Mock Development Accounts */}
          <div className="mb-3 p-3 bg-green-100 dark:bg-green-800/30 rounded">
            <div className="text-xs text-green-600 dark:text-green-400 space-y-1 mb-2">
              <div><strong>Player Account:</strong> <code className="bg-green-200 dark:bg-green-700 px-1 rounded">player@matchday.com</code></div>
              <div><strong>Password:</strong> <code className="bg-green-200 dark:bg-green-700 px-1 rounded">player123!</code></div>
            </div>
            <button
              type="button"
              onClick={() => {
                setValue('email', 'player@matchday.com');
                setValue('password', 'player123!');
                clearErrors();
              }}
              className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded transition-colors mr-2"
            >
              Use Player Account
            </button>
            <button
              type="button"
              onClick={() => {
                setValue('email', 'john.doe@example.com');
                setValue('password', 'admin123!');
                clearErrors();
              }}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded transition-colors"
            >
              Use Captain Account
            </button>
          </div>
          
          {/* Test Account Note */}
          <div className="text-xs text-green-600 dark:text-green-400 text-center">
            <strong>Note:</strong> Other test accounts may have different passwords. Use the working account above for testing.
          </div>
        </div>
      </div>

      {/* OAuth Buttons */}
      <div className="space-y-3 mb-6">
        <button
          type="button"
          onClick={() => handleOAuthSignIn('google')}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <button
          type="button"
          onClick={() => handleOAuthSignIn('github')}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
          </svg>
          Continue with GitHub
        </button>
      </div>

      {/* Divider */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-600" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
            Or continue with email
          </span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              placeholder="Enter your email"
              disabled={isLoading || isSubmitting}
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              id="password"
              className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="Enter your password"
              disabled={isLoading || isSubmitting}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              disabled={isLoading || isSubmitting}
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Forgot Password Link */}
        <div className="text-right">
          <button
            type="button"
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            Forgot your password?
          </button>
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
              Signing In...
            </>
          ) : (
            <>
              Sign In
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>

      {/* Sign Up Link */}
      <div className="mt-6 text-center">
        <p className="text-gray-600 dark:text-gray-400">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToSignup}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
          >
            Sign up for free
          </button>
        </p>
      </div>
    </div>
  );
};
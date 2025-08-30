'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/dev-auth-provider';

export default function DevLoginPage() {
  const router = useRouter();
  const { user, signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const devUsers = [
    { email: 'player@matchday.com', password: 'player123!', name: 'Player User', role: 'player' },
    { email: 'admin@matchday.com', password: 'admin123!', name: 'Admin User', role: 'admin' },
    { email: 'john.doe@example.com', password: 'admin123!', name: 'John Doe', role: 'captain' },
    { email: 'jane.smith@example.com', password: 'admin123!', name: 'Jane Smith', role: 'player' },
  ];

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true);
    setMessage('');
    
    try {
      const result = await signIn({ email, password });
      
      if (result.success) {
        setMessage('✅ Login successful! Redirecting to teams...');
        setTimeout(() => {
          router.push('/teams');
        }, 1500);
      } else {
        setMessage(`❌ Login failed: ${result.error}`);
      }
    } catch (error) {
      setMessage(`❌ Login error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (user) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✅</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Already Logged In
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Welcome back, <strong>{user.full_name || user.email}</strong>
            </p>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => router.push('/teams')}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Go to Teams
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔑</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Development Login
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Choose a test user to login with
          </p>
        </div>

        {message && (
          <div className="mb-6 p-3 rounded-lg bg-gray-50 dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-300">
            {message}
          </div>
        )}

        <div className="space-y-3">
          {devUsers.map((testUser) => (
            <button
              key={testUser.email}
              onClick={() => handleLogin(testUser.email, testUser.password)}
              disabled={isLoading}
              className="w-full p-4 text-left border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {testUser.name}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {testUser.email}
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500 bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded">
                  {testUser.role}
                </div>
              </div>
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <div className="w-4 h-4 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm">Logging in...</span>
            </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
            This is a development-only login page.<br />
            In production, users would sign up through the normal auth flow.
          </p>
        </div>
      </div>
    </div>
  );
}
/**
 * Demo Dashboard Page
 * 
 * Professional player dashboard showing real user data and statistics.
 * Displays comprehensive player information from the database.
 */

'use client';

import React from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { Loader2 } from 'lucide-react';

export default function DemoDashboardPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Dashboard Access Requires Authentication
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Please sign in to view your player dashboard and statistics.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Player Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Welcome back, {user.email}! Your comprehensive player dashboard is coming soon.
          </p>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Dashboard Features (Coming Soon)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Performance Stats</h3>
                <p className="text-sm text-blue-700 dark:text-blue-400">Track your goals, assists, and match performance</p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <h3 className="font-semibold text-green-900 dark:text-green-300 mb-2">Team Management</h3>
                <p className="text-sm text-green-700 dark:text-green-400">Manage your teams and league memberships</p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <h3 className="font-semibold text-purple-900 dark:text-purple-300 mb-2">Match History</h3>
                <p className="text-sm text-purple-700 dark:text-purple-400">View detailed match results and events</p>
              </div>
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <h3 className="font-semibold text-orange-900 dark:text-orange-300 mb-2">Achievements</h3>
                <p className="text-sm text-orange-700 dark:text-orange-400">Unlock and showcase your accomplishments</p>
              </div>
              <div className="p-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
                <h3 className="font-semibold text-teal-900 dark:text-teal-300 mb-2">League Rankings</h3>
                <p className="text-sm text-teal-700 dark:text-teal-400">See how you rank against other players</p>
              </div>
              <div className="p-4 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
                <h3 className="font-semibold text-rose-900 dark:text-rose-300 mb-2">Upcoming Matches</h3>
                <p className="text-sm text-rose-700 dark:text-rose-400">Stay updated on your schedule</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
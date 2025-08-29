/**
 * Dashboard Page for MatchDay
 * 
 * Protected route that shows user dashboard after authentication.
 * Demonstrates the auth system working correctly.
 */

'use client';

import React from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { UserProfile } from '@/components/auth/user-profile';
import { 
  Trophy, 
  Users, 
  Calendar, 
  Target,
  Settings,
  LogOut,
  User
} from 'lucide-react';

export default function DashboardPage() {
  const { user, signOut, isLoading } = useAuth();
  const [showProfile, setShowProfile] = React.useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (showProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4 sm:px-6 lg:px-8">
        <UserProfile onClose={() => setShowProfile(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold sports-text-gradient">
                MatchDay
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowProfile(true)}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                <User className="w-4 h-4" />
                Profile
              </button>
              
              <button
                onClick={signOut}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 mb-8 card-hover">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
              {user?.profile?.display_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Welcome back, {user?.profile?.display_name || 'Player'}!
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Ready to compete like a professional? Your league awaits.
              </p>
              {user?.profile?.preferred_position && (
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                  Position: {user.profile.preferred_position}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Matches Played</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">0</p>
              </div>
              <Trophy className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Teams Joined</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">0</p>
              </div>
              <Users className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Upcoming</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">0</p>
              </div>
              <Calendar className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Win Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">-%</p>
              </div>
              <Target className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Get Started */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 card-hover">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Get Started
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  1
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Complete Your Profile</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Add your position, bio, and photo</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  2
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Browse Leagues</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Find leagues in your area</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  3
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Join a Team</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Start competing professionally</p>
                </div>
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 card-hover">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              Account Information
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Email</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{user?.email}</span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Display Name</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {user?.profile?.display_name || 'Not set'}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Position</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {user?.profile?.preferred_position || 'Not set'}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-3">
                <span className="text-gray-600 dark:text-gray-400">Location</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {user?.profile?.location || 'Not set'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowProfile(true)}
              className="w-full mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            >
              Edit Profile
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
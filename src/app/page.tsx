'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
            MatchDay
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Join leagues, track your stats, and feel like a professional player in amateur sports.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 mt-16 max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4 mx-auto">
                ⚽
              </div>
              <h3 className="text-lg font-semibold mb-2">Join Leagues</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Discover and join leagues that match your skill level and location.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4 mx-auto">
                📊
              </div>
              <h3 className="text-lg font-semibold mb-2">Track Stats</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Monitor your performance across all leagues with detailed statistics.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4 mx-auto">
                🏆
              </div>
              <h3 className="text-lg font-semibold mb-2">Feel Professional</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Compare yourself with players across all leagues and earn achievements.
              </p>
            </div>
          </div>
          
          <div className="mt-12">
            <Link
              href="/demo-dashboard"
              className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
/**
 * PlayerStatsBar Component
 *
 * Horizontal stats bar showing key player metrics (Playtomic-style).
 * All data comes from actual database queries, no mock data.
 */

'use client';

import React from 'react';
import { Trophy, Target, TrendingUp, Users, Zap } from 'lucide-react';

interface PlayerStatsBarProps {
  matchesPlayed: number;
  winRate: number;
  goalsScored: number;
  teamsJoined: number;
  recentForm: ('W' | 'D' | 'L')[];
  isLoading?: boolean;
}

export const PlayerStatsBar: React.FC<PlayerStatsBarProps> = ({
  matchesPlayed,
  winRate,
  goalsScored,
  teamsJoined,
  recentForm,
  isLoading = false
}) => {
  const getFormBadgeColor = (result: 'W' | 'D' | 'L') => {
    switch (result) {
      case 'W': return 'bg-green-500 text-white';
      case 'D': return 'bg-yellow-500 text-white';
      case 'L': return 'bg-red-500 text-white';
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
            <div className="w-full h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      {/* Matches Played */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <Trophy className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
          {matchesPlayed}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Matches Played
        </div>
      </div>

      {/* Win Rate */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
        </div>
        <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
          {winRate.toFixed(0)}%
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Win Rate
        </div>
      </div>

      {/* Goals Scored */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
        </div>
        <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
          {goalsScored}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Goals Scored
        </div>
      </div>

      {/* Teams */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <Users className="w-6 h-6 text-orange-600 dark:text-orange-400" />
        </div>
        <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
          {teamsJoined}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Teams
        </div>
      </div>

      {/* Current Form */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <Zap className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
        </div>
        <div className="flex gap-1 mb-2">
          {recentForm.length > 0 ? (
            recentForm.slice(-5).map((result, index) => (
              <div
                key={index}
                className={`w-7 h-7 rounded flex items-center justify-center text-xs font-bold ${getFormBadgeColor(result)}`}
              >
                {result}
              </div>
            ))
          ) : (
            <span className="text-sm text-gray-500 dark:text-gray-400">No matches</span>
          )}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Recent Form
        </div>
      </div>
    </div>
  );
};

/**
 * Global Leaderboard Component
 * 
 * Professional-looking leaderboard that showcases players across ALL leagues,
 * making amateur players feel like professionals by comparing themselves globally.
 * 
 * @example
 * ```typescript
 * <GlobalLeaderboard
 *   category="goals"
 *   timeframe="current_season"
 *   sportType="soccer"
 *   currentUserId={userId}
 * />
 * ```
 */

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ProfessionalCard } from '@/components/ui/professional-card';
import { StatsDisplay } from '@/components/ui/stats-display';
import { NumberFormatters } from '@/lib/utils/formatters';
import { AnalyticsService } from '@matchday/services';
import Image from 'next/image';

interface GlobalLeaderboardProps {
  category: 'goals' | 'assists' | 'games_played' | 'goals_per_game';
  timeframe: 'current_season' | 'all_time' | 'last_30_days';
  sportType?: string;
  currentUserId?: string;
  limit?: number;
  className?: string;
}

const categoryLabels = {
  goals: 'Top Goal Scorers',
  assists: 'Top Assist Leaders', 
  games_played: 'Most Active Players',
  goals_per_game: 'Best Goal Average'
};

const categoryIcons = {
  goals: '⚽',
  assists: '🅰️',
  games_played: '🏃',
  goals_per_game: '📈'
};

export const GlobalLeaderboard: React.FC<GlobalLeaderboardProps> = ({
  category,
  timeframe,
  sportType,
  currentUserId,
  limit = 50,
  className = ''
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe);
  const [selectedCategory, setSelectedCategory] = useState(category);

  const { data: leaderboard, isLoading, error } = useQuery({
    queryKey: ['global-leaderboard', selectedCategory, selectedTimeframe, sportType, limit],
    queryFn: () => AnalyticsService.getInstance().getGlobalLeaderboards({
      category: selectedCategory,
      timeframe: selectedTimeframe,
      sportType,
      limit
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: userRanking } = useQuery({
    queryKey: ['user-global-ranking', currentUserId],
    queryFn: () => currentUserId 
      ? AnalyticsService.getInstance().getGlobalPlayerRanking(currentUserId)
      : null,
    enabled: !!currentUserId,
    staleTime: 5 * 60 * 1000,
  });

  const formatValue = (value: number, category: string): string => {
    switch (category) {
      case 'goals':
        return NumberFormatters.formatGoals(value);
      case 'assists':
        return NumberFormatters.formatAssists(value);
      case 'games_played':
        return `${value} games`;
      case 'goals_per_game':
        return value.toFixed(2);
      default:
        return value.toString();
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'same') => {
    switch (trend) {
      case 'up':
        return <span className="text-green-500">↗️</span>;
      case 'down':
        return <span className="text-red-500">↘️</span>;
      default:
        return <span className="text-gray-400">➡️</span>;
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Failed to load leaderboard</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              {categoryIcons[selectedCategory]} {categoryLabels[selectedCategory]}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Global rankings across all leagues • {selectedTimeframe.replace('_', ' ')}
            </p>
          </div>
          
          <div className="flex gap-2">
            {/* Category Selector */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="goals">Goals</option>
              <option value="assists">Assists</option>
              <option value="games_played">Games Played</option>
              <option value="goals_per_game">Goals/Game</option>
            </select>
            
            {/* Timeframe Selector */}
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value as any)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="current_season">Current Season</option>
              <option value="all_time">All Time</option>
              <option value="last_30_days">Last 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Current User's Ranking (if available) */}
      {userRanking && (
        <ProfessionalCard
          title="Your Global Standing"
          variant="player"
          className="border-blue-200 dark:border-blue-800"
          stats={[
            { label: 'Global Rank', value: `#${userRanking.globalRank}`, highlight: true },
            { label: 'Percentile', value: `${userRanking.percentileRank}%` },
            { label: 'Total Goals', value: userRanking.totalGoals },
            { label: 'Leagues', value: userRanking.leaguesPlayed }
          ]}
        />
      )}

      {/* Leaderboard */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-gray-100 dark:bg-gray-700 rounded-lg h-20 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Top 3 Podium */}
          {leaderboard && leaderboard.players.length >= 3 && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto">
                {/* 2nd Place */}
                <div className="text-center order-1">
                  <div className="w-16 h-16 mx-auto mb-2 relative">
                    {leaderboard.players[1]?.avatarUrl ? (
                      <Image
                        src={leaderboard.players[1].avatarUrl}
                        alt={leaderboard.players[1].displayName}
                        fill
                        className="rounded-full object-cover border-2 border-gray-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-lg font-bold">
                        {leaderboard.players[1]?.displayName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="text-3xl mb-1">🥈</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {leaderboard.players[1]?.displayName}
                  </div>
                  <div className="text-lg font-bold text-gray-700 dark:text-gray-300">
                    {formatValue(leaderboard.players[1]?.value || 0, selectedCategory)}
                  </div>
                </div>

                {/* 1st Place */}
                <div className="text-center order-2">
                  <div className="w-20 h-20 mx-auto mb-2 relative">
                    {leaderboard.players[0]?.avatarUrl ? (
                      <Image
                        src={leaderboard.players[0].avatarUrl}
                        alt={leaderboard.players[0].displayName}
                        fill
                        className="rounded-full object-cover border-2 border-yellow-400"
                      />
                    ) : (
                      <div className="w-full h-full bg-yellow-400 rounded-full flex items-center justify-center text-yellow-900 text-xl font-bold">
                        {leaderboard.players[0]?.displayName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="text-4xl mb-1">🥇</div>
                  <div className="font-bold text-lg text-gray-900 dark:text-white">
                    {leaderboard.players[0]?.displayName}
                  </div>
                  <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                    {formatValue(leaderboard.players[0]?.value || 0, selectedCategory)}
                  </div>
                </div>

                {/* 3rd Place */}
                <div className="text-center order-3">
                  <div className="w-16 h-16 mx-auto mb-2 relative">
                    {leaderboard.players[2]?.avatarUrl ? (
                      <Image
                        src={leaderboard.players[2].avatarUrl}
                        alt={leaderboard.players[2].displayName}
                        fill
                        className="rounded-full object-cover border-2 border-orange-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-orange-300 rounded-full flex items-center justify-center text-orange-900 text-lg font-bold">
                        {leaderboard.players[2]?.displayName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="text-3xl mb-1">🥉</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {leaderboard.players[2]?.displayName}
                  </div>
                  <div className="text-lg font-bold text-gray-700 dark:text-gray-300">
                    {formatValue(leaderboard.players[2]?.value || 0, selectedCategory)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Full Rankings List */}
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {leaderboard?.players.map((player, index) => (
              <div
                key={player.playerId}
                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                  player.playerId === currentUserId ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className="text-2xl font-bold text-gray-400 dark:text-gray-500 w-12 text-center">
                    {getRankBadge(player.rank)}
                  </div>

                  {/* Avatar */}
                  <div className="w-12 h-12 relative">
                    {player.avatarUrl ? (
                      <Image
                        src={player.avatarUrl}
                        alt={player.displayName}
                        fill
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold">
                        {player.displayName.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* Player Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-white truncate">
                      {player.displayName}
                      {player.playerId === currentUserId && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {player.leagues.join(', ')}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatValue(player.value, selectedCategory)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      {getTrendIcon(player.trend)}
                      <span>vs last period</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
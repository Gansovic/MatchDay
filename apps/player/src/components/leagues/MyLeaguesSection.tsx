/**
 * MyLeaguesSection Component
 *
 * Displays user's active league participations with green-themed cards
 * Horizontal scroll on mobile, grid on desktop
 * Shows team name, position, and next match
 */

'use client';

import React from 'react';
import {
  Trophy,
  TrendingUp,
  Calendar,
  Users,
  ChevronRight,
  Target,
  Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UserLeagueData {
  leagueId: string;
  leagueName: string;
  leagueType: 'recreational' | 'competitive' | 'semi-pro';
  teamName: string;
  teamColor?: string;
  position?: number;
  totalTeams?: number;
  points?: number;
  nextMatchDate?: string;
  nextOpponent?: string;
}

interface MyLeaguesSectionProps {
  userLeagues: UserLeagueData[];
  isLoading?: boolean;
  onViewStandings?: (leagueId: string) => void;
  onViewDetails?: (leagueId: string) => void;
}

export const MyLeaguesSection: React.FC<MyLeaguesSectionProps> = ({
  userLeagues,
  isLoading = false,
  onViewStandings,
  onViewDetails
}) => {
  const router = useRouter();

  const getLeagueTypeEmoji = (type: string) => {
    switch (type) {
      case 'recreational': return '🌟';
      case 'competitive': return '🔥';
      case 'semi-pro': return '⚡';
      default: return '🏆';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getPositionColor = (position?: number, total?: number) => {
    if (!position || !total) return 'text-gray-600';
    const percentage = (position / total) * 100;
    if (percentage <= 25) return 'text-green-600 dark:text-green-400'; // Top 25%
    if (percentage <= 50) return 'text-blue-600 dark:text-blue-400'; // Top 50%
    if (percentage <= 75) return 'text-yellow-600 dark:text-yellow-400'; // Top 75%
    return 'text-red-600 dark:text-red-400'; // Bottom 25%
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        </div>
      </div>
    );
  }

  if (userLeagues.length === 0) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-xl border-2 border-dashed border-green-300 dark:border-green-700 p-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
            <Trophy className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            No Active Leagues
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            You haven't joined any leagues yet. Browse available leagues below to get started with competitive play!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 bg-green-600 rounded-full"></div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            My Leagues
          </h2>
          <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium rounded-full">
            {userLeagues.length}
          </span>
        </div>
      </div>

      {/* Leagues List - Full width rectangular cards */}
      <div className="space-y-4">
        {userLeagues.map((league) => (
          <div
            key={league.leagueId}
            className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border-2 border-green-200 dark:border-green-800 p-6 hover:shadow-lg hover:border-green-300 dark:hover:border-green-700 transition-all cursor-pointer"
            onClick={() => onViewDetails?.(league.leagueId)}
          >
            {/* Horizontal Layout */}
            <div className="flex items-center gap-6">
              {/* Left: League Info & Team */}
              <div className="flex items-center gap-4 flex-1">
                {/* Team Avatar */}
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                  style={{ backgroundColor: league.teamColor || '#10B981' }}
                >
                  {league.teamName.charAt(0)}
                </div>

                {/* League & Team Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{getLeagueTypeEmoji(league.leagueType)}</span>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                      {league.leagueName}
                    </h3>
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs font-medium rounded-full">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      ACTIVE
                    </div>
                  </div>
                  <div className="text-base font-semibold text-gray-700 dark:text-gray-300">
                    {league.teamName}
                  </div>
                </div>
              </div>

              {/* Center: Stats */}
              <div className="flex items-center gap-4">
                {/* Position */}
                {league.position && league.totalTeams && (
                  <div className="text-center px-4 py-2 bg-white/70 dark:bg-gray-900/50 rounded-lg">
                    <div className={`text-2xl font-bold ${getPositionColor(league.position, league.totalTeams)}`}>
                      #{league.position}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      of {league.totalTeams}
                    </div>
                  </div>
                )}

                {/* Points */}
                {league.points !== undefined && (
                  <div className="text-center px-4 py-2 bg-white/70 dark:bg-gray-900/50 rounded-lg">
                    <div className="flex items-center justify-center gap-1">
                      <Trophy className="w-4 h-4 text-yellow-600" />
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {league.points}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Points</div>
                  </div>
                )}

                {/* Next Match */}
                {league.nextMatchDate && (
                  <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs font-medium text-blue-700 dark:text-blue-300 whitespace-nowrap">
                        Next Match
                      </span>
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      {formatDate(league.nextMatchDate)}
                    </div>
                    {league.nextOpponent && (
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
                        vs {league.nextOpponent}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right: Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewStandings?.(league.leagueId);
                  }}
                  className="flex items-center justify-center gap-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                >
                  <TrendingUp className="w-4 h-4" />
                  Standings
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetails?.(league.leagueId);
                  }}
                  className="flex items-center justify-center gap-1 px-4 py-2 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 transition-colors whitespace-nowrap"
                >
                  Details
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

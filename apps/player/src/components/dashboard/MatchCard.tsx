/**
 * MatchCard Component
 *
 * Playtomic-style match card showing team matchup, score, and result.
 * Displays match information in a clean, professional format.
 * All data from database, no mock data.
 */

'use client';

import React from 'react';
import { Calendar, Clock, MapPin, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';

export interface Match {
  id: string;
  match_number?: number;
  homeTeam: {
    id: string;
    name: string;
    color: string;
  };
  awayTeam: {
    id: string;
    name: string;
    color: string;
  };
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  matchDate: string;
  venue: string;
  homeScore?: number;
  awayScore?: number;
  leagueName?: string;
  userTeamId?: string; // To determine if user won/lost
}

interface MatchCardProps {
  match: Match;
  currentUserId?: string;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, currentUserId }) => {
  const router = useRouter();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      scheduled: { bg: 'bg-blue-100 dark:bg-blue-900/20', text: 'text-blue-800 dark:text-blue-300', label: 'Scheduled' },
      live: { bg: 'bg-green-100 dark:bg-green-900/20 animate-pulse', text: 'text-green-800 dark:text-green-300', label: 'Live' },
      completed: { bg: 'bg-gray-100 dark:bg-gray-900/20', text: 'text-gray-800 dark:text-gray-300', label: 'Completed' },
      cancelled: { bg: 'bg-red-100 dark:bg-red-900/20', text: 'text-red-800 dark:text-red-300', label: 'Cancelled' }
    };

    const badge = badges[status as keyof typeof badges];
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  // Determine match result for user
  const getMatchResult = () => {
    if (match.status !== 'completed' || match.homeScore === undefined || match.awayScore === undefined) {
      return null;
    }

    // Determine which team the user is on and calculate result
    const isHomeTeam = match.homeTeam.id === match.userTeamId;
    const userScore = isHomeTeam ? match.homeScore : match.awayScore;
    const opponentScore = isHomeTeam ? match.awayScore : match.homeScore;

    if (userScore > opponentScore) {
      return { label: 'Won', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/20' };
    } else if (userScore < opponentScore) {
      return { label: 'Lost', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/20' };
    } else {
      return { label: 'Draw', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/20' };
    }
  };

  const matchResult = getMatchResult();

  const handleViewMatch = () => {
    const matchIdentifier = match.match_number ? match.match_number.toString() : match.id;
    router.push(`/matches/${matchIdentifier}`);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg transition-shadow">
      {/* Header: Date badge, Status, Result */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Date Badge */}
          <div className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <div className="text-xs font-bold text-gray-900 dark:text-white">
              {formatDate(match.matchDate)}
            </div>
          </div>

          {getStatusBadge(match.status)}

          {matchResult && (
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${matchResult.bg} ${matchResult.color}`}>
              {matchResult.label}
            </span>
          )}
        </div>

        <button
          onClick={handleViewMatch}
          className="flex items-center gap-2 px-3 py-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
        >
          <Eye className="w-4 h-4" />
          <span className="text-sm font-medium">View</span>
        </button>
      </div>

      {/* Teams and Score */}
      <div className="flex items-center justify-between mb-4">
        {/* Home Team */}
        <div className="flex items-center gap-3 flex-1">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md"
            style={{ backgroundColor: match.homeTeam.color }}
          >
            {match.homeTeam.name.charAt(0).toUpperCase()}
          </div>
          <span className="font-semibold text-gray-900 dark:text-white text-lg">
            {match.homeTeam.name}
          </span>
        </div>

        {/* Score or VS */}
        <div className="px-6 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg font-bold text-gray-900 dark:text-white text-xl">
          {match.status === 'completed' && match.homeScore !== undefined && match.awayScore !== undefined
            ? `${match.homeScore} - ${match.awayScore}`
            : 'vs'
          }
        </div>

        {/* Away Team */}
        <div className="flex items-center gap-3 flex-1 justify-end">
          <span className="font-semibold text-gray-900 dark:text-white text-lg">
            {match.awayTeam.name}
          </span>
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md"
            style={{ backgroundColor: match.awayTeam.color }}
          >
            {match.awayTeam.name.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Match Details */}
      <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
        {match.leagueName && (
          <div className="flex items-center gap-1.5 font-medium">
            {match.leagueName}
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Clock className="w-4 h-4" />
          {formatTime(match.matchDate)}
        </div>
        <div className="flex items-center gap-1.5">
          <MapPin className="w-4 h-4" />
          {match.venue || 'TBD'}
        </div>
      </div>
    </div>
  );
};

/**
 * MatchHistoryFeed Component
 *
 * Playtomic-style match history with tabbed interface (History/Upcoming).
 * Shows chronological list of user's matches with results.
 * All data from database, no mock data.
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Loader2, Plus, ArrowRight } from 'lucide-react';
import { MatchCard, type Match } from './MatchCard';

interface MatchHistoryFeedProps {
  matches: Match[];
  isLoading?: boolean;
  currentUserId?: string;
  isTeamCaptain?: boolean;
  onCreateMatch?: () => void;
}

export const MatchHistoryFeed: React.FC<MatchHistoryFeedProps> = ({
  matches,
  isLoading = false,
  currentUserId,
  isTeamCaptain = false,
  onCreateMatch
}) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'completed' | 'upcoming'>('completed');

  // Filter matches by status
  const completedMatches = matches.filter(m => m.status === 'completed').sort((a, b) =>
    new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime()
  );

  const upcomingMatches = matches.filter(m => m.status === 'scheduled' || m.status === 'live').sort((a, b) =>
    new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime()
  );

  const allDisplayMatches = activeTab === 'completed' ? completedMatches : upcomingMatches;
  const displayMatches = allDisplayMatches.slice(0, 3);
  const hasMoreMatches = allDisplayMatches.length > 3;

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600 dark:text-gray-400">Loading matches...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
      {/* Header with Tabs */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Matches</h3>

          {/* Tab Selector */}
          <div className="flex gap-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'completed'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Match History
              {completedMatches.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-gray-200 dark:bg-gray-500 text-xs rounded-full">
                  {completedMatches.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'upcoming'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Upcoming
              {upcomingMatches.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-gray-200 dark:bg-gray-500 text-xs rounded-full">
                  {upcomingMatches.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Create Match Button (for captains) */}
        {isTeamCaptain && onCreateMatch && (
          <button
            onClick={onCreateMatch}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Match
          </button>
        )}
      </div>

      {/* Match List */}
      <div className="space-y-4">
        {allDisplayMatches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No {activeTab === 'completed' ? 'completed' : 'upcoming'} matches
            </h4>
            <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
              {activeTab === 'completed'
                ? 'Your match history will appear here once you complete your first match.'
                : isTeamCaptain
                ? 'Schedule your first match to get started.'
                : 'No upcoming matches scheduled yet.'
              }
            </p>
            {isTeamCaptain && activeTab === 'upcoming' && onCreateMatch && (
              <button
                onClick={onCreateMatch}
                className="mt-6 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Match
              </button>
            )}
          </div>
        ) : (
          <>
            {displayMatches.map((match) => (
              <MatchCard key={match.id} match={match} currentUserId={currentUserId} />
            ))}

            {/* View All Matches Button */}
            {hasMoreMatches && (
              <button
                onClick={() => router.push('/matches')}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium rounded-lg transition-colors"
              >
                View All Matches ({allDisplayMatches.length} total)
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

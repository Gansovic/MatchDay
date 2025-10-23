/**
 * Team News & Activity Component
 *
 * Activity feed showing:
 * - Recent match results
 * - Player milestones
 * - New player joins
 * - League position changes
 * - Timeline-style card design
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Trophy,
  UserPlus,
  Target,
  TrendingUp,
  TrendingDown,
  Award,
  Shield,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  ChevronRight
} from 'lucide-react';

type ActivityType =
  | 'match_win'
  | 'match_loss'
  | 'match_draw'
  | 'player_joined'
  | 'player_milestone'
  | 'position_up'
  | 'position_down'
  | 'trophy_won';

interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string;
  metadata?: {
    matchId?: string;
    playerId?: string;
    playerName?: string;
    score?: { team: number; opponent: number };
    opponent?: string;
    position?: number;
    milestone?: string;
  };
}

interface ActivityFeedData {
  activities: Activity[];
  totalCount: number;
}

interface TeamNewsActivityProps {
  teamId: string;
  teamName?: string;
}

export const TeamNewsActivity: React.FC<TeamNewsActivityProps> = ({
  teamId,
  teamName = 'Team'
}) => {
  const [activityData, setActivityData] = useState<ActivityFeedData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadActivityData();
  }, [teamId]);

  const loadActivityData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/teams/${teamId}/activity?limit=20`);

      if (!response.ok) {
        throw new Error('Failed to load team activity');
      }

      const data = await response.json();
      setActivityData(data.data);
      console.log('✅ Team News Activity - Loaded activity data:', data.data);
    } catch (err) {
      console.error('❌ Team News Activity - Error loading activity:', err);
      setError('Failed to load team activity');
    } finally {
      setIsLoading(false);
    }
  };

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'match_win':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'match_loss':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'match_draw':
        return <Trophy className="w-5 h-5 text-yellow-600" />;
      case 'player_joined':
        return <UserPlus className="w-5 h-5 text-blue-600" />;
      case 'player_milestone':
        return <Award className="w-5 h-5 text-purple-600" />;
      case 'position_up':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'position_down':
        return <TrendingDown className="w-5 h-5 text-red-600" />;
      case 'trophy_won':
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      default:
        return <Calendar className="w-5 h-5 text-gray-600" />;
    }
  };

  const getActivityColor = (type: ActivityType) => {
    switch (type) {
      case 'match_win':
      case 'position_up':
        return 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800';
      case 'match_loss':
      case 'position_down':
        return 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800';
      case 'match_draw':
        return 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800';
      case 'player_joined':
        return 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800';
      case 'player_milestone':
      case 'trophy_won':
        return 'bg-purple-50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800';
      default:
        return 'bg-gray-50 dark:bg-gray-900/10 border-gray-200 dark:border-gray-700';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600 dark:text-gray-400">Loading team activity...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !activityData) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Unable to Load Activity
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error || 'Team activity is not available at this time.'}
          </p>
          <button
            onClick={loadActivityData}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (activityData.activities.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-12">
        <div className="text-center">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Recent Activity
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Check back later for team updates, match results, and player news.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              Team Activity
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Recent updates and news from {teamName}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {activityData.totalCount}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Events
            </div>
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="space-y-4">
        {activityData.activities.map((activity, index) => (
          <div
            key={activity.id}
            className={`bg-white dark:bg-gray-800 rounded-xl border shadow-sm overflow-hidden transition-all hover:shadow-md ${getActivityColor(
              activity.type
            )}`}
          >
            <div className="p-6">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="flex-shrink-0 w-12 h-12 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                  {getActivityIcon(activity.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {activity.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                        {activity.description}
                      </p>

                      {/* Metadata */}
                      {activity.metadata && (
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                          {activity.metadata.score && (
                            <div className="flex items-center gap-2">
                              <Shield className="w-4 h-4" />
                              <span className="font-semibold">
                                {activity.metadata.score.team} - {activity.metadata.score.opponent}
                              </span>
                            </div>
                          )}
                          {activity.metadata.opponent && (
                            <div className="flex items-center gap-1">
                              <span>vs {activity.metadata.opponent}</span>
                            </div>
                          )}
                          {activity.metadata.position && (
                            <div className="flex items-center gap-1">
                              <Trophy className="w-4 h-4" />
                              <span>#{activity.metadata.position}</span>
                            </div>
                          )}
                          {activity.metadata.milestone && (
                            <div className="px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 rounded-full text-xs font-medium">
                              {activity.metadata.milestone}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Timestamp */}
                    <div className="flex-shrink-0 text-right">
                      <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                        <Clock className="w-4 h-4" />
                        {formatTimestamp(activity.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                {(activity.metadata?.matchId || activity.metadata?.playerId) && (
                  <div className="flex-shrink-0">
                    <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More Button */}
      {activityData.totalCount > activityData.activities.length && (
        <div className="text-center pt-4">
          <button
            onClick={loadActivityData}
            className="px-6 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Load More Activity
          </button>
        </div>
      )}
    </div>
  );
};

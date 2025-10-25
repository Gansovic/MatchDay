/**
 * Recent Activity Feed Component
 *
 * Displays recent activity in the admin's leagues
 * Extracted from the main dashboard for better modularity
 */

'use client';

import React from 'react';
import { Calendar } from 'lucide-react';
import { EmptyState } from '@matchday/ui';

interface Activity {
  id: string;
  type: 'team_joined' | 'match_scheduled' | 'league_created' | 'player_registered' | string;
  description: string;
  timestamp: string;
}

interface RecentActivityFeedProps {
  activities: Activity[];
}

const getActivityColor = (type: string): string => {
  const colorMap: Record<string, string> = {
    team_joined: 'bg-green-500',
    match_scheduled: 'bg-blue-500',
    league_created: 'bg-orange-500',
    player_registered: 'bg-purple-500'
  };
  return colorMap[type] || 'bg-gray-500';
};

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({ activities }) => {
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
      <div className="space-y-3">
        {activities.length > 0 ? (
          activities.slice(0, 5).map((activity) => (
            <div
              key={activity.id}
              className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors animate-fade-in"
            >
              <div className={`w-2 h-2 ${getActivityColor(activity.type)} rounded-full flex-shrink-0`} />
              <span className="text-gray-300 flex-1 text-sm">{activity.description}</span>
              <span className="text-xs text-gray-500 flex-shrink-0">
                {new Date(activity.timestamp).toLocaleDateString()}
              </span>
            </div>
          ))
        ) : (
          <EmptyState
            icon={<Calendar className="w-8 h-8" />}
            title="No recent activity"
            compact
          />
        )}
      </div>
    </div>
  );
};

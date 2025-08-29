/**
 * Live Match Tracker Component
 * 
 * Real-time match tracking interface that makes amateur matches feel like
 * professional broadcasts with live updates, events, and statistics.
 * 
 * @example
 * ```typescript
 * <LiveMatchTracker matchId={matchId} />
 * ```
 */

import React, { useState, useEffect } from 'react';
import { MatchCard } from './match-card';
import { StatsDisplay } from '@/components/ui/stats-display';
import { useRealtimeMatch } from '@/lib/hooks/use-realtime-matches';
import { DateFormatters, NumberFormatters } from '@/lib/utils/formatters';

interface LiveMatchTrackerProps {
  matchId: string;
  className?: string;
}

interface MatchEvent {
  id: string;
  eventType: string;
  eventTime: number;
  playerName: string;
  teamName: string;
  description?: string;
}

export const LiveMatchTracker: React.FC<LiveMatchTrackerProps> = ({
  matchId,
  className = ''
}) => {
  const { 
    match, 
    matchStats, 
    recentEvents, 
    isLoading, 
    isConnected, 
    clearRecentEvents 
  } = useRealtimeMatch(matchId);

  const [showEventNotifications, setShowEventNotifications] = useState(true);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">Match not found</p>
      </div>
    );
  }

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'goal': return '⚽';
      case 'assist': return '🅰️';
      case 'yellow_card': return '🟨';
      case 'red_card': return '🟥';
      case 'substitution': return '🔄';
      default: return '📝';
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'goal': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'yellow_card': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'red_card': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'substitution': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-700/50';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Connection Status */}
      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {isConnected ? 'Live Updates Connected' : 'Connection Lost'}
          </span>
        </div>
        {match.status === 'in_progress' && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Recent Event Notifications */}
      {recentEvents.length > 0 && showEventNotifications && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Latest Events
            </h3>
            <button
              onClick={() => {
                clearRecentEvents();
                setShowEventNotifications(false);
              }}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Clear
            </button>
          </div>
          
          {recentEvents.map((event) => (
            <div
              key={event.id}
              className={`p-3 rounded-lg border animate-slide-in ${getEventColor(event.eventType)}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getEventIcon(event.eventType)}</span>
                <div className="flex-1">
                  <div className="font-medium">
                    {event.eventTime}' - {event.playerName || 'Unknown Player'}
                  </div>
                  <div className="text-sm opacity-75">
                    {event.teamName} • {event.eventType.replace('_', ' ').toUpperCase()}
                  </div>
                  {event.description && (
                    <div className="text-sm opacity-75 mt-1">
                      {event.description}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Match Card */}
      <MatchCard
        match={match}
        variant={match.status === 'in_progress' ? 'live' : 'result'}
        showStats={true}
        className="border-2"
      />

      {/* Live Statistics */}
      {match.status === 'in_progress' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Match Timeline */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Match Timeline
            </h3>
            
            {matchStats?.events && matchStats.events.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {matchStats.events
                  .sort((a, b) => b.eventTime - a.eventTime)
                  .map((event) => (
                    <div key={event.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                      <div className="w-8 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                        {event.eventTime}'
                      </div>
                      <div className="text-xl">{getEventIcon(event.eventType)}</div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {event.playerName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {event.teamName}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No events recorded yet
              </div>
            )}
          </div>

          {/* Match Statistics */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Match Statistics
            </h3>
            
            <div className="space-y-4">
              {/* Goals */}
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300">Goals</span>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-lg">{match.home_score || 0}</span>
                  <span className="text-gray-400">-</span>
                  <span className="font-bold text-lg">{match.away_score || 0}</span>
                </div>
              </div>

              {/* Cards */}
              {matchStats?.summary && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Yellow Cards</span>
                    <div className="flex items-center gap-4">
                      <span className="font-medium">{matchStats.summary.homeYellowCards}</span>
                      <span className="text-gray-400">-</span>
                      <span className="font-medium">{matchStats.summary.awayYellowCards}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Red Cards</span>
                    <div className="flex items-center gap-4">
                      <span className="font-medium">{matchStats.summary.homeRedCards}</span>
                      <span className="text-gray-400">-</span>
                      <span className="font-medium">{matchStats.summary.awayRedCards}</span>
                    </div>
                  </div>
                </>
              )}

              {/* Placeholder for additional stats */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  Additional statistics will appear as the match progresses
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Match Status Footer */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
        <div className="flex items-center justify-center gap-4 text-sm text-gray-600 dark:text-gray-300">
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
          {match.venue && (
            <>
              <span>•</span>
              <span>📍 {match.venue}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Custom CSS for animations (add to globals.css)
const animationStyles = `
@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-in {
  animation: slide-in 0.3s ease-out;
}
`;
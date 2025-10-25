/**
 * League Overview Grid Component
 *
 * Displays the leagues managed by the admin
 * Extracted from the main dashboard for better modularity
 */

'use client';

import React from 'react';
import { Trophy } from 'lucide-react';
import { EmptyState, StatusBadge } from '@matchday/ui';

interface League {
  id: string;
  name: string;
  sport_type: string;
  league_type: string;
  location: string | null;
  isActive: boolean;
  teamCount: number;
  playerCount: number;
}

interface LeagueOverviewGridProps {
  leagues: League[];
}

export const LeagueOverviewGrid: React.FC<LeagueOverviewGridProps> = ({ leagues }) => {
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-4">Your Leagues</h2>
      <div className="space-y-3">
        {leagues.length > 0 ? (
          leagues.map((league) => (
            <div
              key={league.id}
              className="bg-gray-800 border border-gray-600 rounded-lg p-4 hover:border-gray-500 transition-all card-hover animate-fade-in"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-white">{league.name}</h3>
                <StatusBadge
                  status={league.isActive ? 'Active' : 'Inactive'}
                  variant={league.isActive ? 'success' : 'default'}
                  size="sm"
                />
              </div>
              <p className="text-sm text-gray-400 mb-2">
                {league.sport_type} • {league.league_type}
              </p>
              <div className="flex justify-between text-sm text-gray-300">
                <span>{league.teamCount} teams</span>
                <span>{league.playerCount} players</span>
              </div>
              {league.location && (
                <p className="text-xs text-gray-500 mt-1">{league.location}</p>
              )}
            </div>
          ))
        ) : (
          <EmptyState
            icon={<Trophy className="w-8 h-8" />}
            title="No leagues assigned"
            compact
          />
        )}
      </div>
    </div>
  );
};

/**
 * Season Selector Component
 * 
 * Allows users to switch between different seasons of a league.
 * Shows current season stats and provides dropdown for season selection.
 */

'use client';

import React, { useState } from 'react';
import { 
  ChevronDown,
  Calendar,
  Trophy
} from 'lucide-react';

export interface Season {
  id: string;
  name: string;
  display_name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  is_active: boolean;
  league_id: string;
  description?: string;
  max_teams?: number;
  registration_start?: string;
  registration_end?: string;
  created_at: string;
  updated_at: string;
  stats: {
    total_matches: number;
    completed_matches: number;
    scheduled_matches: number;
    registered_teams: number;
  };
}

interface SeasonSelectorProps {
  seasons: Season[];
  currentSeason: Season | null;
  onSeasonChange: (season: Season) => void;
  className?: string;
}

export const SeasonSelector: React.FC<SeasonSelectorProps> = ({
  seasons,
  currentSeason,
  onSeasonChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!currentSeason || seasons.length <= 1) {
    return null;
  }

  const formatDate = (dateString: string) => {
    // Use a consistent format that works the same on server and client
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
  };


  const isSeasonActive = (season: Season) => {
    const now = new Date();
    const start = new Date(season.start_date);
    const end = new Date(season.end_date);
    return now >= start && now <= end;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Current Season Display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-gray-900 dark:text-white">
              {currentSeason.display_name}
            </span>
            {currentSeason.is_current && (
              <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-full">
                Current
              </span>
            )}
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>


      {/* Season Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
          {seasons.map((season) => (
            <button
              key={season.id}
              onClick={() => {
                onSeasonChange(season);
                setIsOpen(false);
              }}
              className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${
                season.id === currentSeason.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {season.display_name}
                    </span>
                    {season.is_current && (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-full">
                        Current
                      </span>
                    )}
                    {isSeasonActive(season) && !season.is_current && (
                      <span className="px-2 py-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {formatDate(season.start_date)} - {formatDate(season.end_date)}
                  </div>
                  {season.description && (
                    <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {season.description}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {season.stats.completed_matches}/{season.stats.total_matches}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    matches
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};
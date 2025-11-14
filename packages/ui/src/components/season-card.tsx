'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export interface SeasonCardData {
  id: string;
  name: string;
  display_name?: string;
  start_date: string;
  end_date: string;
  is_current?: boolean;
  status?: string;
  stats?: {
    completed_matches?: number;
    total_matches?: number;
    registered_teams?: number;
  };
}

export interface SeasonCardProps {
  season: SeasonCardData;
  leagueId: string;
  href?: string;
  onClick?: () => void;
  seasonIcon?: React.ReactNode;
  showStats?: boolean;
  variant?: 'default' | 'admin';
  className?: string;
}

export function SeasonCard({
  season,
  leagueId,
  href,
  onClick,
  seasonIcon,
  showStats = true,
  variant = 'default',
  className = ''
}: SeasonCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getUTCMonth()];
    const day = date.getUTCDate();
    const year = date.getUTCFullYear();
    return `${month} ${day}, ${year}`;
  };

  const linkHref = href || `/leagues/${leagueId}/seasons/${season.id}`;

  const cardClasses = variant === 'admin'
    ? `block p-4 border border-gray-600 dark:border-gray-600 rounded-lg hover:border-gray-500 transition-colors bg-gray-800 dark:bg-gray-800 cursor-pointer hover:bg-gray-750 dark:hover:bg-gray-750 ${className}`
    : `block p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group ${className}`;

  const content = (
    <>
      <div className="flex items-start gap-4">
        {/* Season Icon */}
        {seasonIcon && (
          <div className="flex-shrink-0">
            {seasonIcon}
          </div>
        )}

        {/* Season Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className={`font-semibold ${
              variant === 'admin'
                ? 'text-white'
                : 'text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400'
            }`}>
              {season.display_name || season.name}
            </h3>
            {season.is_current && (
              <span className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-xs px-2 py-1 rounded-full font-medium flex-shrink-0">
                Current
              </span>
            )}
          </div>

          <p className={`text-sm mb-3 ${
            variant === 'admin' ? 'text-gray-400' : 'text-gray-600 dark:text-gray-400'
          }`}>
            {formatDate(season.start_date)} - {formatDate(season.end_date)}
          </p>

          {showStats && season.stats && (
            <div className={`flex items-center justify-between text-xs ${
              variant === 'admin' ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'
            }`}>
              <span>
                {season.stats.completed_matches || 0} / {season.stats.total_matches || 0} matches
              </span>
              {season.stats.registered_teams !== undefined && (
                <span>{season.stats.registered_teams} teams</span>
              )}
            </div>
          )}

          <div className={`mt-3 flex items-center text-sm font-medium ${
            variant === 'admin'
              ? 'text-gray-300'
              : 'text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300'
          }`}>
            View Details
            <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </>
  );

  if (onClick) {
    return (
      <div onClick={onClick} className={cardClasses}>
        {content}
      </div>
    );
  }

  return (
    <Link href={linkHref} className={cardClasses}>
      {content}
    </Link>
  );
}

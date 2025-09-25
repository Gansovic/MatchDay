/**
 * Professional Stats Display Component
 * 
 * Creates professional-looking statistics displays that make amateur players
 * feel like pros. Supports various layouts and highlight states.
 * 
 * @example
 * ```typescript
 * <StatsDisplay
 *   title="Season Performance"
 *   stats={[
 *     { label: 'Goals', value: 15, highlight: true },
 *     { label: 'Assists', value: 8 },
 *     { label: 'Games', value: 22 }
 *   ]}
 *   layout="grid"
 * />
 * ```
 */

import React from 'react';
import { NumberFormatters } from '@/lib/utils/formatters';

interface StatItem {
  label: string;
  value: string | number;
  subValue?: string | number;
  highlight?: boolean;
  trend?: 'up' | 'down' | 'neutral';
  formatter?: (value: any) => string;
}

interface StatsDisplayProps {
  title?: string;
  stats: StatItem[];
  layout?: 'horizontal' | 'grid' | 'vertical';
  variant?: 'default' | 'compact' | 'detailed';
  className?: string;
}

export const StatsDisplay = React.memo<StatsDisplayProps>(({
  title,
  stats,
  layout = 'grid',
  variant = 'default',
  className = ''
}) => {
  const getLayoutClasses = () => {
    switch (layout) {
      case 'horizontal':
        return 'flex flex-wrap gap-4';
      case 'vertical':
        return 'space-y-4';
      case 'grid':
      default:
        return 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'compact':
        return 'p-3';
      case 'detailed':
        return 'p-6';
      case 'default':
      default:
        return 'p-4';
    }
  };

  const formatValue = (stat: StatItem): string => {
    if (stat.formatter) {
      return stat.formatter(stat.value);
    }
    
    if (typeof stat.value === 'number') {
      return stat.value.toLocaleString();
    }
    
    return stat.value.toString();
  };

  const getTrendIcon = (trend?: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return (
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'down':
        return (
          <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 ${getVariantClasses()} ${className}`}>
      {title && (
        <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
        </div>
      )}
      
      <div className={getLayoutClasses()}>
        {stats.map((stat, index) => (
          <div 
            key={index}
            className={`text-center p-3 rounded-lg ${
              stat.highlight 
                ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' 
                : 'bg-gray-50 dark:bg-gray-700/50'
            }`}
          >
            <div className="flex items-center justify-center gap-1 mb-1">
              <div className={`text-2xl font-bold ${
                stat.highlight 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-900 dark:text-white'
              }`}>
                {formatValue(stat)}
              </div>
              {getTrendIcon(stat.trend)}
            </div>
            
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">
              {stat.label}
            </div>
            
            {stat.subValue && (
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {typeof stat.subValue === 'number' 
                  ? stat.subValue.toLocaleString() 
                  : stat.subValue
                }
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});

StatsDisplay.displayName = 'StatsDisplay';

// Pre-configured stat displays for common use cases
export const PlayerStatsDisplay = React.memo<{
  stats: {
    goals: number;
    assists: number;
    gamesPlayed: number;
    minutesPlayed: number;
    yellowCards?: number;
    redCards?: number;
  };
  compact?: boolean;
}>(({ stats, compact = false }) => {
  const statItems: StatItem[] = [
    {
      label: 'Goals',
      value: stats.goals,
      formatter: NumberFormatters.formatGoals,
      highlight: true
    },
    {
      label: 'Assists', 
      value: stats.assists,
      formatter: NumberFormatters.formatAssists
    },
    {
      label: 'Games',
      value: stats.gamesPlayed,
      subValue: `${NumberFormatters.formatMinutes(stats.minutesPlayed)} played`
    }
  ];

  if (!compact && (stats.yellowCards || stats.redCards)) {
    statItems.push({
      label: 'Cards',
      value: `${stats.yellowCards || 0}Y/${stats.redCards || 0}R`,
    });
  }

  return (
    <StatsDisplay 
      title="Player Statistics"
      stats={statItems}
      variant={compact ? 'compact' : 'default'}
    />
  );
});

PlayerStatsDisplay.displayName = 'PlayerStatsDisplay';

export const TeamStatsDisplay = React.memo<{
  stats: {
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    points: number;
  };
  position?: number;
}>(({ stats, position }) => {
  const totalGames = stats.wins + stats.draws + stats.losses;
  
  const statItems: StatItem[] = [
    {
      label: 'Points',
      value: stats.points,
      formatter: NumberFormatters.formatPoints,
      highlight: true
    },
    {
      label: 'Record',
      value: NumberFormatters.formatRecord(stats.wins, stats.draws, stats.losses),
      subValue: `${NumberFormatters.formatWinPercentage(stats.wins, totalGames)} win rate`
    },
    {
      label: 'Goals',
      value: `${stats.goalsFor}/${stats.goalsAgainst}`,
      subValue: `${NumberFormatters.formatGoalDifference(stats.goalsFor, stats.goalsAgainst)} difference`
    }
  ];

  if (position) {
    statItems.unshift({
      label: 'Position',
      value: position,
      highlight: position <= 3
    });
  }

  return (
    <StatsDisplay 
      title="Team Performance"
      stats={statItems}
    />
  );
});

TeamStatsDisplay.displayName = 'TeamStatsDisplay';
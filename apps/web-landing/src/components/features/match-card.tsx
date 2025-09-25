/**
 * Professional Match Card Component
 * 
 * Displays match information in a professional sports broadcast style,
 * making amateur matches feel like professional events.
 * 
 * @example
 * ```typescript
 * <MatchCard
 *   match={match}
 *   variant="live"
 *   showStats={true}
 *   onClick={() => navigateToMatch(match.id)}
 * />
 * ```
 */

import React from 'react';
import Image from 'next/image';
import { ProfessionalCard } from '@/components/ui/professional-card';
import { DateFormatters, NumberFormatters, StatusFormatters } from '@/lib/utils/formatters';

interface MatchCardProps {
  match: {
    id: string;
    scheduled_date: string;
    status: string;
    home_score?: number;
    away_score?: number;
    venue?: string;
    match_day?: number;
    home_team: {
      id: string;
      name: string;
      logo_url?: string;
      team_color?: string;
    };
    away_team: {
      id: string;
      name: string;
      logo_url?: string;
      team_color?: string;
    };
    league: {
      name: string;
      sport_type: string;
    };
  };
  variant?: 'default' | 'live' | 'result' | 'preview';
  showStats?: boolean;
  compact?: boolean;
  onClick?: () => void;
  className?: string;
}

export const MatchCard = React.memo<MatchCardProps>(({
  match,
  variant = 'default',
  showStats = false,
  compact = false,
  onClick,
  className = ''
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'live':
        return 'border-green-200 dark:border-green-800 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20';
      case 'result':
        return 'border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20';
      case 'preview':
        return 'border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20';
      default:
        return '';
    }
  };

  const getStatusDisplay = () => {
    const status = StatusFormatters.formatMatchStatus(match.status);
    const timeDisplay = DateFormatters.formatMatchTime(match.scheduled_date, match.status);

    if (match.status === 'live' || match.status === 'in_progress') {
      return (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-red-600 dark:text-red-400 font-medium text-sm">LIVE</span>
          </div>
          <span className="text-gray-500 dark:text-gray-400 text-sm">{timeDisplay}</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
          {status.text}
        </span>
        <span className="text-gray-500 dark:text-gray-400 text-sm">{timeDisplay}</span>
      </div>
    );
  };

  const TeamDisplay = ({ team, score, isHome }: {
    team: typeof match.home_team;
    score?: number;
    isHome: boolean;
  }) => (
    <div className={`flex items-center gap-3 ${isHome ? '' : 'flex-row-reverse'}`}>
      {/* Team Logo */}
      <div className="w-12 h-12 relative flex-shrink-0">
        {team.logo_url ? (
          <Image
            src={team.logo_url}
            alt={`${team.name} logo`}
            fill
            className="object-contain"
          />
        ) : (
          <div 
            className="w-full h-full rounded-full flex items-center justify-center text-white font-bold text-lg"
            style={{ backgroundColor: team.team_color || '#6b7280' }}
          >
            {team.name.charAt(0)}
          </div>
        )}
      </div>

      {/* Team Info */}
      <div className={`flex-1 min-w-0 ${isHome ? 'text-left' : 'text-right'}`}>
        <div className="font-semibold text-gray-900 dark:text-white truncate">
          {team.name}
        </div>
        {!compact && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {StatusFormatters.formatSportType(match.league.sport_type)}
          </div>
        )}
      </div>

      {/* Score */}
      {(match.status === 'completed' || match.status === 'in_progress') && score !== undefined && (
        <div className="text-3xl font-bold text-gray-900 dark:text-white min-w-[2rem] text-center">
          {score}
        </div>
      )}
    </div>
  );

  return (
    <div 
      className={`bg-white dark:bg-gray-800 border rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${getVariantStyles()} ${onClick ? 'cursor-pointer hover:scale-[1.02]' : ''} ${className}`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {match.league.name}
            {match.match_day && (
              <span className="ml-2 text-gray-500 dark:text-gray-400">
                • Matchday {match.match_day}
              </span>
            )}
          </div>
          {getStatusDisplay()}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {compact ? (
          // Compact Layout
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <TeamDisplay 
                team={match.home_team} 
                score={match.home_score} 
                isHome={true} 
              />
              <div className="text-lg font-bold text-gray-400 dark:text-gray-500">
                VS
              </div>
              <TeamDisplay 
                team={match.away_team} 
                score={match.away_score} 
                isHome={false} 
              />
            </div>
          </div>
        ) : (
          // Full Layout
          <div className="space-y-6">
            {/* Teams */}
            <div className="grid grid-cols-3 gap-4 items-center">
              {/* Home Team */}
              <TeamDisplay 
                team={match.home_team} 
                score={match.home_score} 
                isHome={true} 
              />

              {/* VS / Score */}
              <div className="text-center">
                {match.status === 'completed' || match.status === 'in_progress' ? (
                  <div className="text-4xl font-bold text-gray-900 dark:text-white">
                    {NumberFormatters.formatScore(match.home_score || 0, match.away_score || 0)}
                  </div>
                ) : (
                  <div className="text-2xl font-bold text-gray-400 dark:text-gray-500">
                    VS
                  </div>
                )}
              </div>

              {/* Away Team */}
              <TeamDisplay 
                team={match.away_team} 
                score={match.away_score} 
                isHome={false} 
              />
            </div>

            {/* Match Details */}
            <div className="text-center space-y-1">
              {match.venue && (
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  📍 {match.venue}
                </div>
              )}
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {DateFormatters.formatMatchDate(match.scheduled_date)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Footer */}
      {showStats && (match.status === 'completed' || match.status === 'in_progress') && (
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {match.home_score || 0}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Goals</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">--</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Possession</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {match.away_score || 0}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Goals</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

MatchCard.displayName = 'MatchCard';

// Pre-configured variants for common use cases
export const LiveMatchCard = React.memo<Omit<MatchCardProps, 'variant'>>(
  (props) => <MatchCard {...props} variant="live" showStats={true} />
);

LiveMatchCard.displayName = 'LiveMatchCard';

export const ResultMatchCard = React.memo<Omit<MatchCardProps, 'variant'>>(
  (props) => <MatchCard {...props} variant="result" showStats={true} />
);

ResultMatchCard.displayName = 'ResultMatchCard';

export const PreviewMatchCard = React.memo<Omit<MatchCardProps, 'variant'>>(
  (props) => <MatchCard {...props} variant="preview" />
);

PreviewMatchCard.displayName = 'PreviewMatchCard';
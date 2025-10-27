'use client';

import { useState } from 'react';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { TeamLogo } from '@/components/common/team-logo';
import MatchDetailsModal from './MatchDetailsModal';

interface Match {
  id: string;
  home_team_id: string;
  away_team_id: string;
  match_date: string;
  match_time?: string;
  matchday_number?: number;
  court_number?: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  home_score?: number;
  away_score?: number;
  home_team?: {
    id: string;
    name: string;
    team_color?: string;
    logo_url?: string;
  };
  away_team?: {
    id: string;
    name: string;
    team_color?: string;
    logo_url?: string;
  };
}

interface FixturesCalendarProps {
  matches: Match[];
  userTeamIds?: string[];
  showOnlyUpcoming?: boolean;
}

export default function FixturesCalendar({ matches, userTeamIds = [], showOnlyUpcoming = false }: FixturesCalendarProps) {
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Filter matches if needed
  const filteredMatches = showOnlyUpcoming
    ? matches.filter(m => m.status === 'scheduled' && new Date(m.match_date) >= new Date())
    : matches;

  // Group matches by matchday
  const matchesByMatchday: { [key: number]: Match[] } = {};
  filteredMatches.forEach(match => {
    const matchday = match.matchday_number || 0;
    if (!matchesByMatchday[matchday]) {
      matchesByMatchday[matchday] = [];
    }
    matchesByMatchday[matchday].push(match);
  });

  const sortedMatchdays = Object.keys(matchesByMatchday)
    .map(Number)
    .sort((a, b) => a - b);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const isUserTeamMatch = (match: Match) => {
    return userTeamIds.includes(match.home_team_id) || userTeamIds.includes(match.away_team_id);
  };

  const handleMatchClick = (matchId: string) => {
    setSelectedMatchId(matchId);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedMatchId(null);
  };

  if (filteredMatches.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No Fixtures Available
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {showOnlyUpcoming
            ? 'No upcoming matches scheduled'
            : 'Fixtures will be available once the season schedule is generated'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sortedMatchdays.map(matchdayNum => {
        const matchdayMatches = matchesByMatchday[matchdayNum];
        const matchDate = matchdayMatches[0]?.match_date;

        return (
          <div key={matchdayNum} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Matchday {matchdayNum}
              </h3>
              {matchDate && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(matchDate)}</span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {matchdayMatches.map((match) => {
                const isMyTeam = isUserTeamMatch(match);

                return (
                  <div
                    key={match.id}
                    onClick={() => handleMatchClick(match.id)}
                    className={`border rounded-lg p-4 transition-all cursor-pointer hover:shadow-lg hover:scale-[1.02] ${
                      isMyTeam
                        ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                        : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      {/* Court Badge */}
                      {match.court_number && (
                        <div className="flex-shrink-0 mr-3">
                          <div className="bg-purple-900/30 border border-purple-700/50 rounded px-2 py-1">
                            <span className="text-xs font-semibold text-purple-300">
                              Court {match.court_number}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Teams */}
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex items-center gap-2 flex-1">
                          <TeamLogo
                            name={match.home_team?.name || 'Home Team'}
                            logoUrl={match.home_team?.logo_url}
                            color={match.home_team?.team_color}
                            size="md"
                          />
                          <span className="text-gray-900 dark:text-white font-medium text-sm truncate">
                            {match.home_team?.name || 'Home Team'}
                          </span>
                          {match.status === 'completed' && match.home_score !== undefined && (
                            <span className="text-lg font-bold text-gray-900 dark:text-white ml-auto">
                              {match.home_score}
                            </span>
                          )}
                        </div>

                        <span className="text-gray-500 text-sm font-medium px-2">
                          {match.status === 'completed' ? '-' : 'vs'}
                        </span>

                        <div className="flex items-center gap-2 flex-1">
                          {match.status === 'completed' && match.away_score !== undefined && (
                            <span className="text-lg font-bold text-gray-900 dark:text-white mr-auto">
                              {match.away_score}
                            </span>
                          )}
                          <TeamLogo
                            name={match.away_team?.name || 'Away Team'}
                            logoUrl={match.away_team?.logo_url}
                            color={match.away_team?.team_color}
                            size="md"
                          />
                          <span className="text-gray-900 dark:text-white font-medium text-sm truncate">
                            {match.away_team?.name || 'Away Team'}
                          </span>
                        </div>
                      </div>

                      {/* Time and Status */}
                      <div className="flex items-center gap-3 ml-4">
                        {match.match_time && match.status === 'scheduled' && (
                          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                            <Clock className="w-3 h-3" />
                            <span>{formatTime(match.match_time)}</span>
                          </div>
                        )}
                        {match.status === 'completed' && (
                          <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
                            FT
                          </span>
                        )}
                        {match.status === 'in_progress' && (
                          <span className="text-xs px-2 py-1 bg-green-200 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full animate-pulse">
                            Live
                          </span>
                        )}
                      </div>
                    </div>

                    {isMyTeam && (
                      <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-800">
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                          Your Team Match
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Match Details Modal */}
      {selectedMatchId && (
        <MatchDetailsModal
          matchId={selectedMatchId}
          isOpen={showModal}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}

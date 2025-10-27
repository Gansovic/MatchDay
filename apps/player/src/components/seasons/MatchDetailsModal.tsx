'use client';

import { useEffect, useState } from 'react';
import { X, Trophy, AlertCircle, Clock } from 'lucide-react';
import { TeamLogo } from '@/components/common/team-logo';

interface Player {
  id: string;
  user_id: string;
  position: string;
  jersey_number: number | null;
  users: {
    id: string;
    full_name: string | null;
    email: string | null;
  };
}

interface MatchEvent {
  id: string;
  event_type: string;
  event_time: number | null;
  player_id: string | null;
  team_id: string;
  description: string | null;
  player?: {
    id: string;
    full_name: string | null;
    email: string | null;
  };
  team?: {
    id: string;
    name: string;
    team_color?: string;
  };
}

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

interface MatchDetailsModalProps {
  matchId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function MatchDetailsModal({ matchId, isOpen, onClose }: MatchDetailsModalProps) {
  const [match, setMatch] = useState<Match | null>(null);
  const [matchEvents, setMatchEvents] = useState<MatchEvent[]>([]);
  const [homePlayers, setHomePlayers] = useState<Player[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && matchId) {
      loadMatchData();
    }
  }, [isOpen, matchId]);

  const loadMatchData = async () => {
    setLoading(true);
    try {
      // Load match details
      const matchResponse = await fetch(`/api/matches/${matchId}`, {
        credentials: 'include',
      });
      const matchResult = await matchResponse.json();

      if (matchResult.success && matchResult.data) {
        setMatch(matchResult.data);

        // Load match events
        const eventsResponse = await fetch(`/api/matches/${matchId}/events`, {
          credentials: 'include',
        });
        const eventsResult = await eventsResponse.json();

        if (eventsResult.success && eventsResult.data) {
          setMatchEvents(eventsResult.data);
        }

        // Load team rosters
        const playersResponse = await fetch(`/api/matches/${matchId}/players`, {
          credentials: 'include',
        });
        const playersResult = await playersResponse.json();

        if (playersResult.success && playersResult.data) {
          setHomePlayers(playersResult.data.homePlayers || []);
          setAwayPlayers(playersResult.data.awayPlayers || []);
        }
      }
    } catch (error) {
      console.error('Error loading match data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'goal':
        return '⚽';
      case 'yellow_card':
        return '🟨';
      case 'red_card':
        return '🟥';
      case 'assist':
        return '👟';
      case 'substitution':
        return '🔄';
      case 'penalty':
        return '🎯';
      default:
        return '•';
    }
  };

  const getEventsByTeam = (teamId: string) => {
    return matchEvents.filter(e => e.team_id === teamId);
  };

  const getGoalScorers = (teamId: string) => {
    const goals = matchEvents.filter(e => e.team_id === teamId && e.event_type === 'goal');
    const scorerCounts: { [key: string]: { name: string; count: number } } = {};

    goals.forEach(goal => {
      const playerName = goal.player?.full_name || goal.player?.email || 'Unknown';
      if (scorerCounts[playerName]) {
        scorerCounts[playerName].count++;
      } else {
        scorerCounts[playerName] = { name: playerName, count: 1 };
      }
    });

    return Object.values(scorerCounts);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700">
        {/* Header with Gradient */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Match Details</h2>
              {match && (
                <p className="text-sm text-white/80 mt-1">
                  Matchday {match.matchday_number} {match.court_number && `• Court ${match.court_number}`}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading match details...</p>
              </div>
            </div>
          ) : match ? (
            <div className="space-y-6">
              {/* Score Display */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
                <div className="grid grid-cols-3 gap-8 items-center">
                  {/* Home Team */}
                  <div className="text-center">
                    <TeamLogo
                      name={match.home_team?.name || 'Home Team'}
                      logoUrl={match.home_team?.logo_url}
                      color={match.home_team?.team_color}
                      size="lg"
                      className="mx-auto mb-4"
                    />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {match.home_team?.name || 'Home Team'}
                    </h3>
                    {match.status === 'completed' && (
                      <div className="text-5xl font-bold text-gray-900 dark:text-white">
                        {match.home_score ?? 0}
                      </div>
                    )}
                  </div>

                  {/* VS / Status */}
                  <div className="text-center">
                    {match.status === 'completed' ? (
                      <div className="text-gray-400 dark:text-gray-500 text-2xl font-bold">-</div>
                    ) : match.status === 'in_progress' ? (
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700/50 rounded-lg">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-green-700 dark:text-green-300 font-semibold">LIVE</span>
                      </div>
                    ) : (
                      <div className="text-gray-400 dark:text-gray-500 text-xl">vs</div>
                    )}
                    {match.match_time && match.status === 'scheduled' && (
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        {match.match_time}
                      </div>
                    )}
                  </div>

                  {/* Away Team */}
                  <div className="text-center">
                    <TeamLogo
                      name={match.away_team?.name || 'Away Team'}
                      logoUrl={match.away_team?.logo_url}
                      color={match.away_team?.team_color}
                      size="lg"
                      className="mx-auto mb-4"
                    />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {match.away_team?.name || 'Away Team'}
                    </h3>
                    {match.status === 'completed' && (
                      <div className="text-5xl font-bold text-gray-900 dark:text-white">
                        {match.away_score ?? 0}
                      </div>
                    )}
                  </div>
                </div>

                {/* Goal Scorers */}
                {match.status === 'completed' && matchEvents.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-2 gap-6">
                      {/* Home Team Scorers */}
                      <div>
                        {getGoalScorers(match.home_team_id).length > 0 && (
                          <div className="space-y-2">
                            {getGoalScorers(match.home_team_id).map((scorer, idx) => (
                              <div key={idx} className="text-sm text-gray-700 dark:text-gray-300">
                                ⚽ {scorer.name} {scorer.count > 1 && `(${scorer.count})`}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {/* Away Team Scorers */}
                      <div>
                        {getGoalScorers(match.away_team_id).length > 0 && (
                          <div className="space-y-2">
                            {getGoalScorers(match.away_team_id).map((scorer, idx) => (
                              <div key={idx} className="text-sm text-gray-700 dark:text-gray-300">
                                ⚽ {scorer.name} {scorer.count > 1 && `(${scorer.count})`}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Match Events Timeline */}
              {matchEvents.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    Match Events
                  </h3>
                  <div className="space-y-3">
                    {matchEvents.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-100 dark:border-blue-800/50"
                      >
                        <div className="flex items-center gap-2 min-w-[60px]">
                          {event.event_time && (
                            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                              {event.event_time}'
                            </span>
                          )}
                        </div>
                        <div className="text-2xl">{getEventIcon(event.event_type)}</div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {event.player?.full_name || event.player?.email || 'Unknown Player'}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                            {event.event_type.replace('_', ' ')}
                            {event.description && ` • ${event.description}`}
                          </p>
                        </div>
                        {event.team && (
                          <div
                            className="w-4 h-4 rounded-full flex-shrink-0 border-2 border-white dark:border-gray-800 shadow-sm"
                            style={{ backgroundColor: event.team.team_color || '#6B7280' }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Team Rosters */}
              <div className="grid grid-cols-2 gap-6">
                {/* Home Team Roster */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: match.home_team?.team_color || '#6B7280' }}
                    />
                    {match.home_team?.name} Roster
                  </h3>
                  {homePlayers.length > 0 ? (
                    <div className="space-y-2">
                      {homePlayers.map((player) => (
                        <div
                          key={player.id}
                          className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          {player.jersey_number && (
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm"
                              style={{ backgroundColor: match.home_team?.team_color || '#6B7280' }}
                            >
                              {player.jersey_number}
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {player.users.full_name || player.users.email}
                            </p>
                            {player.position && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                                {player.position}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-400">No players available</p>
                  )}
                </div>

                {/* Away Team Roster */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: match.away_team?.team_color || '#6B7280' }}
                    />
                    {match.away_team?.name} Roster
                  </h3>
                  {awayPlayers.length > 0 ? (
                    <div className="space-y-2">
                      {awayPlayers.map((player) => (
                        <div
                          key={player.id}
                          className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          {player.jersey_number && (
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm"
                              style={{ backgroundColor: match.away_team?.team_color || '#6B7280' }}
                            >
                              {player.jersey_number}
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {player.users.full_name || player.users.email}
                            </p>
                            {player.position && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                                {player.position}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-400">No players available</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Failed to load match details</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

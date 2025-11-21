'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Award, Users, Loader2, Trophy, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { MatchMediaTab } from '@/components/media/match-media-tab';

interface Player {
  id: string;
  user_id: string;
  position: string;
  jersey_number: number | null;
  user_profiles: {
    id: string;
    display_name: string | null;
    full_name: string | null;
  };
  users: {
    id: string;
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
}

interface Match {
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_score: number | null;
  away_score: number | null;
  scheduled_date: string;
  venue: string | null;
  home_team: {
    id: string;
    name: string;
    team_color: string | null;
  };
  away_team: {
    id: string;
    name: string;
    team_color: string | null;
  };
}

interface MatchResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  onSaved?: () => void;
}

const EVENT_TYPES = [
  { value: 'goal', label: '⚽ Goal', emoji: '⚽' },
  { value: 'yellow_card', label: '🟨 Yellow Card', emoji: '🟨' },
  { value: 'red_card', label: '🟥 Red Card', emoji: '🟥' },
  { value: 'substitution', label: '🔄 Substitution', emoji: '🔄' },
  { value: 'penalty', label: '🎯 Penalty', emoji: '🎯' }
];

export default function MatchResultsModal({
  isOpen,
  onClose,
  matchId,
  onSaved
}: MatchResultsModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [match, setMatch] = useState<Match | null>(null);
  const [homeTeamPlayers, setHomeTeamPlayers] = useState<Player[]>([]);
  const [awayTeamPlayers, setAwayTeamPlayers] = useState<Player[]>([]);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [manOfMatchId, setManOfMatchId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'results' | 'media'>('results');

  // Player selection state
  const [showPlayerSelect, setShowPlayerSelect] = useState(false);
  const [pendingEvent, setPendingEvent] = useState<{ teamId: string; eventType: string } | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [showAssistSelect, setShowAssistSelect] = useState(false);

  // Load match data, players, and events
  useEffect(() => {
    if (isOpen && matchId) {
      loadMatchData();
    }
  }, [isOpen, matchId]);

  const loadMatchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch match details
      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .select(`
          *,
          home_team:teams!matches_home_team_id_fkey(id, name, team_color),
          away_team:teams!matches_away_team_id_fkey(id, name, team_color)
        `)
        .eq('id', matchId)
        .single();

      if (matchError) throw matchError;
      if (!matchData) throw new Error('Match not found');

      setMatch(matchData as unknown as Match);
      setHomeScore((matchData as any).home_score || 0);
      setAwayScore((matchData as any).away_score || 0);
      setManOfMatchId((matchData as any).man_of_match_id || null);

      // Fetch players
      const playersResponse = await fetch(`/api/matches/${matchId}/players`);
      const playersResult = await playersResponse.json();

      console.log('👥 Players API response:', playersResult);

      if (playersResult.success) {
        console.log('✅ Home team players:', playersResult.data.homeTeamPlayers);
        console.log('✅ Away team players:', playersResult.data.awayTeamPlayers);
        setHomeTeamPlayers(playersResult.data.homeTeamPlayers || []);
        setAwayTeamPlayers(playersResult.data.awayTeamPlayers || []);
      } else {
        console.error('❌ Failed to load players:', playersResult.error);
      }

      // Fetch events
      const eventsResponse = await fetch(`/api/matches/${matchId}/events`);
      const eventsResult = await eventsResponse.json();

      if (eventsResult.success) {
        setEvents(eventsResult.data || []);
      }

    } catch (err) {
      console.error('Failed to load match data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load match data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = async (teamId: string, eventType: string) => {
    const players = teamId === match?.home_team_id ? homeTeamPlayers : awayTeamPlayers;

    if (players.length === 0) {
      alert('No players available for this team');
      return;
    }

    // Show player selection dialog
    setPendingEvent({ teamId, eventType });
    setSelectedPlayerId(null);
    setShowPlayerSelect(true);
  };

  const handlePlayerSelected = (playerId: string) => {
    setSelectedPlayerId(playerId);
    setShowPlayerSelect(false);

    // If it's a goal, show assist selection
    if (pendingEvent?.eventType === 'goal') {
      setShowAssistSelect(true);
    } else {
      // Submit the event directly
      submitEvent(playerId, undefined);
    }
  };

  const handleAssistSelected = (assistPlayerId: string | null) => {
    setShowAssistSelect(false);
    if (selectedPlayerId) {
      submitEvent(selectedPlayerId, assistPlayerId || undefined);
    }
  };

  const submitEvent = async (playerId: string, assistPlayerId?: string) => {
    if (!pendingEvent) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(`/api/matches/${matchId}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          teamId: pendingEvent.teamId,
          playerId,
          eventType: pendingEvent.eventType,
          assistPlayerId
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to add event');
      }

      // Reload match data to get updated scores and events
      await loadMatchData();

    } catch (err) {
      console.error('Failed to add event:', err);
      alert(err instanceof Error ? err.message : 'Failed to add event');
    } finally {
      setPendingEvent(null);
      setSelectedPlayerId(null);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(`/api/matches/${matchId}/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete event');
      }

      // Reload match data
      await loadMatchData();

    } catch (err) {
      console.error('Failed to delete event:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete event');
    }
  };

  const handleSave = async () => {
    if (!match) return;

    try {
      setSaving(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(`/api/matches/${matchId}/result`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          homeScore,
          awayScore,
          manOfMatchId,
          status: 'completed'
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to save match result');
      }

      onSaved?.();
      onClose();

    } catch (err) {
      console.error('Failed to save match result:', err);
      setError(err instanceof Error ? err.message : 'Failed to save match result');
    } finally {
      setSaving(false);
    }
  };

  const getPlayerName = (playerId: string) => {
    const allPlayers = [...homeTeamPlayers, ...awayTeamPlayers];
    const player = allPlayers.find(p => p.users.id === playerId);
    return player?.user_profiles?.full_name || player?.user_profiles?.display_name || player?.users.email || 'Unknown Player';
  };

  const getEventIcon = (eventType: string) => {
    const event = EVENT_TYPES.find(e => e.value === eventType);
    return event?.emoji || '•';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-gray-900 rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-700">
        {/* Header */}
        <div className="border-b border-gray-700">
          <div className="flex items-center justify-between p-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Match Details</h2>
              {match && (
                <p className="text-sm text-gray-400 mt-1">
                  {match.home_team.name} vs {match.away_team.name}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-white"
              disabled={saving}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 px-6">
            <button
              onClick={() => setActiveTab('results')}
              className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
                activeTab === 'results'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <Trophy className="w-4 h-4" />
              Results & Events
            </button>
            <button
              onClick={() => setActiveTab('media')}
              className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
                activeTab === 'media'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              Media
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-900">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
            </div>
          ) : match ? (
            <>
              {/* Results Tab */}
              {activeTab === 'results' && (
                <div className="space-y-6">
              {/* Score Display */}
              <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-gray-700 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 text-center">
                    <div className="text-lg font-semibold text-gray-200">{match.home_team.name}</div>
                    <div className="text-5xl font-bold text-blue-400 my-2">{homeScore}</div>
                  </div>
                  <div className="text-3xl font-bold text-gray-500 mx-6">-</div>
                  <div className="flex-1 text-center">
                    <div className="text-lg font-semibold text-gray-200">{match.away_team.name}</div>
                    <div className="text-5xl font-bold text-purple-400 my-2">{awayScore}</div>
                  </div>
                </div>
              </div>

              {/* Two Column Layout for Teams */}
              <div className="grid grid-cols-2 gap-4">
                {/* Home Team */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg text-center mb-4 text-white">{match.home_team.name}</h3>
                  {EVENT_TYPES.map(eventType => (
                    <button
                      key={eventType.value}
                      onClick={() => handleAddEvent(match.home_team_id, eventType.value)}
                      className="w-full flex items-center justify-center gap-2 p-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-lg transition-colors text-sm font-medium text-blue-300"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{eventType.label}</span>
                    </button>
                  ))}
                </div>

                {/* Away Team */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg text-center mb-4 text-white">{match.away_team.name}</h3>
                  {EVENT_TYPES.map(eventType => (
                    <button
                      key={eventType.value}
                      onClick={() => handleAddEvent(match.away_team_id, eventType.value)}
                      className="w-full flex items-center justify-center gap-2 p-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 rounded-lg transition-colors text-sm font-medium text-purple-300"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{eventType.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Events Timeline */}
              {events.length > 0 && (
                <div className="mt-8">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-white">
                    <span>Match Events</span>
                    <span className="text-sm font-normal text-gray-400">({events.length})</span>
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {events.map(event => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between p-3 bg-gray-800 border border-gray-700 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{getEventIcon(event.event_type)}</span>
                          <div>
                            <div className="font-medium text-white">{event.player?.full_name || event.player?.email || 'Unknown'}</div>
                            <div className="text-sm text-gray-400 capitalize">
                              {event.event_type.replace('_', ' ')}
                              {event.event_time && ` • ${event.event_time}'`}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          className="p-2 hover:bg-red-900/30 rounded-lg transition-colors text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Man of the Match */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-200 mb-2 flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Man of the Match
                </label>
                <select
                  value={manOfMatchId || ''}
                  onChange={(e) => setManOfMatchId(e.target.value || null)}
                  className="w-full p-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select player...</option>
                  <optgroup label={match.home_team.name}>
                    {homeTeamPlayers.map(player => (
                      <option key={player.users.id} value={player.users.id}>
                        {player.user_profiles?.full_name || player.user_profiles?.display_name || player.users.email || 'Unknown'}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label={match.away_team.name}>
                    {awayTeamPlayers.map(player => (
                      <option key={player.users.id} value={player.users.id}>
                        {player.user_profiles?.full_name || player.user_profiles?.display_name || player.users.email || 'Unknown'}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {error && (
                <div className="bg-red-900/30 border border-red-700 text-red-300 p-4 rounded-lg">
                  {error}
                </div>
              )}
                </div>
              )}

              {/* Media Tab */}
              {activeTab === 'media' && (
                <MatchMediaTab
                  matchId={matchId}
                  matchName={`${match.home_team.name} vs ${match.away_team.name}`}
                  canUpload={true} // Admin users can always upload
                />
              )}
            </>
          ) : (
            <div className="text-center text-gray-400 py-8">
              Match not found
            </div>
          )}
        </div>

        {/* Footer */}
        {activeTab === 'results' && (
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-700 bg-gray-800">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !match}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Results
            </button>
          </div>
        )}
      </div>

      {/* Player Selection Dialog */}
      {showPlayerSelect && pendingEvent && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md border border-gray-700">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">
                Select Player for {pendingEvent.eventType.replace('_', ' ')}
              </h3>
              <p className="text-sm text-gray-400">
                {pendingEvent.teamId === match?.home_team_id ? match?.home_team.name : match?.away_team.name}
              </p>
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {(pendingEvent.teamId === match?.home_team_id ? homeTeamPlayers : awayTeamPlayers).map(player => (
                <button
                  key={player.users.id}
                  onClick={() => handlePlayerSelected(player.users.id)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-700 rounded-lg transition-colors text-left"
                >
                  <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white font-medium">
                    {player.jersey_number || '#'}
                  </div>
                  <div>
                    <div className="font-medium text-white">
                      {player.user_profiles?.full_name || player.user_profiles?.display_name || player.users?.email || 'Unknown'}
                    </div>
                    <div className="text-sm text-gray-400">
                      {player.position || 'Player'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div className="p-4 border-t border-gray-700">
              <button
                onClick={() => {
                  setShowPlayerSelect(false);
                  setPendingEvent(null);
                }}
                className="w-full px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assist Selection Dialog */}
      {showAssistSelect && pendingEvent && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md border border-gray-700">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">
                Assist by (Optional)
              </h3>
              <p className="text-sm text-gray-400">
                {pendingEvent.teamId === match?.home_team_id ? match?.home_team.name : match?.away_team.name}
              </p>
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              <button
                onClick={() => handleAssistSelected(null)}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-700 rounded-lg transition-colors text-left mb-2"
              >
                <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white">
                  <X className="w-5 h-5" />
                </div>
                <div className="font-medium text-gray-300">No Assist</div>
              </button>
              {(pendingEvent.teamId === match?.home_team_id ? homeTeamPlayers : awayTeamPlayers)
                .filter(p => p.users.id !== selectedPlayerId)
                .map(player => (
                  <button
                    key={player.users.id}
                    onClick={() => handleAssistSelected(player.users.id)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-700 rounded-lg transition-colors text-left"
                  >
                    <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white font-medium">
                      {player.jersey_number || '#'}
                    </div>
                    <div>
                      <div className="font-medium text-white">
                        {player.user_profiles?.full_name || player.user_profiles?.display_name || player.users?.email || 'Unknown'}
                      </div>
                      <div className="text-sm text-gray-400">
                        {player.position || 'Player'}
                      </div>
                    </div>
                  </button>
                ))}
            </div>
            <div className="p-4 border-t border-gray-700">
              <button
                onClick={() => {
                  setShowAssistSelect(false);
                  setPendingEvent(null);
                  setSelectedPlayerId(null);
                }}
                className="w-full px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

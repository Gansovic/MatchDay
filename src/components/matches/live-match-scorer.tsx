/**
 * Live Match Scorer Component
 * 
 * Mobile-first live match scoring interface for real-time match management:
 * - Touch-optimized controls for mobile/tablet use
 * - Real-time score tracking and updates
 * - Player event recording (goals, assists, cards, substitutions)
 * - Session/period management (halves, quarters, etc.)
 * - Offline capability for uninterrupted scoring
 * - Large buttons and gestures for match-day ease of use
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Plus, 
  Minus, 
  Clock, 
  User, 
  Target, 
  Award, 
  AlertTriangle, 
  RotateCcw,
  Users,
  Save,
  Wifi,
  WifiOff,
  ChevronLeft,
  ChevronRight,
  Timer,
  Zap
} from 'lucide-react';

export interface MatchPlayer {
  id: string;
  name: string;
  jersey_number?: number;
  position?: string;
  is_starter: boolean;
  is_captain: boolean;
}

export interface MatchEvent {
  id: string;
  type: 'goal' | 'assist' | 'yellow_card' | 'red_card' | 'substitution' | 'own_goal';
  player_id: string;
  player_name: string;
  team_id: string;
  team_name: string;
  minute: number;
  session: number;
  timestamp: string;
  details?: {
    assisted_by?: string;
    substituted_for?: string;
    reason?: string;
  };
}

export interface LiveMatch {
  id: string;
  league_name: string;
  home_team: {
    id: string;
    name: string;
    color: string;
    score: number;
    players: MatchPlayer[];
  };
  away_team: {
    id: string;
    name: string;
    color: string;
    score: number;
    players: MatchPlayer[];
  };
  status: 'pre_match' | 'live' | 'half_time' | 'completed';
  current_session: number;
  session_time: number; // minutes elapsed in current session
  total_sessions: number;
  session_duration: number; // minutes per session
  venue?: string;
  events: MatchEvent[];
  started_at?: string;
  completed_at?: string;
}

interface LiveMatchScorerProps {
  match: LiveMatch;
  isOfficial?: boolean; // Can the user control the match (referee/admin)
  onMatchUpdate?: (match: LiveMatch) => void;
  onEventAdded?: (event: MatchEvent) => void;
  className?: string;
}

export const LiveMatchScorer: React.FC<LiveMatchScorerProps> = ({
  match: initialMatch,
  isOfficial = false,
  onMatchUpdate,
  onEventAdded,
  className = ''
}) => {
  const [match, setMatch] = useState<LiveMatch>(initialMatch);
  const [selectedTeam, setSelectedTeam] = useState<'home' | 'away'>('home');
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [isOnline, setIsOnline] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date>(new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventType, setEventType] = useState<MatchEvent['type']>('goal');
  const [autoSave, setAutoSave] = useState(true);
  const timerRef = useRef<NodeJS.Timeout>();

  // Auto-save interval
  useEffect(() => {
    if (autoSave && match.status === 'live') {
      const interval = setInterval(() => {
        saveMatchState();
      }, 30000); // Auto-save every 30 seconds during live matches

      return () => clearInterval(interval);
    }
  }, [autoSave, match.status]);

  // Timer for live matches
  useEffect(() => {
    if (match.status === 'live' && isOfficial) {
      timerRef.current = setInterval(() => {
        setMatch(prev => {
          const newSessionTime = prev.session_time + (1/60); // Add 1 second (converted to minutes)
          
          // Auto-advance session if time limit reached
          if (newSessionTime >= prev.session_duration && prev.current_session < prev.total_sessions) {
            return {
              ...prev,
              current_session: prev.current_session + 1,
              session_time: 0,
              status: prev.current_session + 1 === Math.ceil(prev.total_sessions / 2) ? 'half_time' : 'live'
            };
          }
          
          return { ...prev, session_time: newSessionTime };
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [match.status, isOfficial]);

  // Network status detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const generatePlayerStats = () => {
    // Aggregate player statistics from match events
    const playerStatsMap = new Map();
    
    match.events.forEach(event => {
      const key = `${event.player_id}-${event.team_id}`;
      if (!playerStatsMap.has(key)) {
        playerStatsMap.set(key, {
          user_id: event.player_id,
          goals: 0,
          assists: 0,
          minutes_played: 90, // Default to 90 minutes, could be enhanced with substitution tracking
          yellow_cards: 0,
          red_cards: 0,
          clean_sheets: 0,
          saves: 0
        });
      }
      
      const stats = playerStatsMap.get(key);
      
      switch (event.type) {
        case 'goal':
        case 'own_goal':
          stats.goals += 1;
          break;
        case 'assist':
          stats.assists += 1;
          break;
        case 'yellow_card':
          stats.yellow_cards += 1;
          break;
        case 'red_card':
          stats.red_cards += 1;
          break;
      }
    });
    
    // Separate stats by team
    const homeTeamStats = [];
    const awayTeamStats = [];
    
    playerStatsMap.forEach((stats, key) => {
      const [playerId, teamId] = key.split('-');
      if (teamId === match.home_team.id) {
        homeTeamStats.push(stats);
      } else if (teamId === match.away_team.id) {
        awayTeamStats.push(stats);
      }
    });
    
    return {
      homeTeamStats,
      awayTeamStats
    };
  };

  const saveMatchState = async () => {
    try {
      // Save to localStorage for offline capability
      localStorage.setItem(`match_${match.id}`, JSON.stringify(match));
      
      // If match is completed, send comprehensive update with player stats
      if (match.status === 'completed') {
        const playerStats = generatePlayerStats();
        
        const response = await fetch(`/api/matches/${match.id}/score`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            homeScore: match.home_team.score,
            awayScore: match.away_team.score,
            status: match.status,
            matchDuration: Math.floor(match.session_time * match.current_session),
            notes: `Match completed at ${new Date().toLocaleTimeString()}`,
            playerStats: playerStats.homeTeamStats.length > 0 || playerStats.awayTeamStats.length > 0 ? playerStats : undefined
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to save match');
        }
        
        console.log('✅ Match completed and player statistics created automatically');
      }
      
      setLastSaved(new Date());
      onMatchUpdate?.(match);
    } catch (error) {
      console.error('Failed to save match state:', error);
      // Still save locally for offline resilience
      localStorage.setItem(`match_${match.id}`, JSON.stringify(match));
    }
  };

  const addScore = (team: 'home' | 'away') => {
    if (!isOfficial || match.status !== 'live') return;

    setMatch(prev => ({
      ...prev,
      [team + '_team']: {
        ...prev[team + '_team'],
        score: prev[team + '_team'].score + 1
      }
    }));
  };

  const removeScore = (team: 'home' | 'away') => {
    if (!isOfficial || match.status !== 'live') return;

    setMatch(prev => ({
      ...prev,
      [team + '_team']: {
        ...prev[team + '_team'],
        score: Math.max(0, prev[team + '_team'].score - 1)
      }
    }));
  };

  const addEvent = (eventData: Partial<MatchEvent>) => {
    if (!isOfficial) return;

    const newEvent: MatchEvent = {
      id: Date.now().toString(),
      type: eventData.type || 'goal',
      player_id: eventData.player_id || '',
      player_name: eventData.player_name || '',
      team_id: eventData.team_id || '',
      team_name: eventData.team_name || '',
      minute: Math.floor(match.session_time) || 0,
      session: match.current_session,
      timestamp: new Date().toISOString(),
      details: eventData.details
    };

    setMatch(prev => ({
      ...prev,
      events: [...prev.events, newEvent]
    }));

    onEventAdded?.(newEvent);
    setShowEventModal(false);
  };

  const startMatch = () => {
    if (!isOfficial) return;
    
    setMatch(prev => ({
      ...prev,
      status: 'live',
      started_at: new Date().toISOString()
    }));
  };

  const pauseMatch = () => {
    if (!isOfficial) return;
    
    setMatch(prev => ({
      ...prev,
      status: prev.status === 'live' ? 'half_time' : 'live'
    }));
  };

  const endMatch = async () => {
    if (!isOfficial) return;
    
    const updatedMatch = {
      ...match,
      status: 'completed' as const,
      completed_at: new Date().toISOString()
    };
    
    setMatch(updatedMatch);
    
    // Immediately save the completed match with player statistics
    setTimeout(() => {
      saveMatchState();
    }, 100); // Small delay to ensure state is updated
  };

  const formatTime = (minutes: number) => {
    const mins = Math.floor(minutes);
    const secs = Math.floor((minutes - mins) * 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pre_match': return 'bg-gray-500';
      case 'live': return 'bg-green-500 animate-pulse';
      case 'half_time': return 'bg-yellow-500';
      case 'completed': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getEventIcon = (type: MatchEvent['type']) => {
    switch (type) {
      case 'goal': return <Target className="w-4 h-4" />;
      case 'assist': return <Award className="w-4 h-4" />;
      case 'yellow_card': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'red_card': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'substitution': return <RotateCcw className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(match.status)}`}></div>
            <span className="font-semibold capitalize">
              {match.status.replace('_', ' ')}
            </span>
            {!isOnline && <WifiOff className="w-4 h-4 text-red-300" />}
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4" />
            <span className="font-mono">
              {formatTime(match.session_time)} / {match.session_duration}'
            </span>
            <span className="text-xs bg-white/20 px-2 py-1 rounded">
              {match.current_session}/{match.total_sessions}
            </span>
          </div>
        </div>
        
        <div className="text-sm text-center text-white/80">
          {match.league_name} • {match.venue}
        </div>
      </div>

      {/* Score Display */}
      <div className="p-6 bg-gray-50 dark:bg-gray-900/50">
        <div className="flex items-center justify-between">
          {/* Home Team */}
          <div className="flex-1 text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: match.home_team.color }}
              >
                {match.home_team.name.charAt(0)}
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">
                {match.home_team.name}
              </span>
            </div>
            
            <div className="text-6xl font-bold text-gray-900 dark:text-white mb-4">
              {match.home_team.score}
            </div>

            {isOfficial && match.status === 'live' && (
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => removeScore('home')}
                  className="w-12 h-12 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center touch-manipulation"
                >
                  <Minus className="w-6 h-6" />
                </button>
                <button
                  onClick={() => addScore('home')}
                  className="w-12 h-12 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center justify-center touch-manipulation"
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>
            )}
          </div>

          {/* VS Separator */}
          <div className="px-6">
            <div className="text-2xl font-bold text-gray-400 dark:text-gray-600">
              VS
            </div>
          </div>

          {/* Away Team */}
          <div className="flex-1 text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="font-semibold text-gray-900 dark:text-white">
                {match.away_team.name}
              </span>
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: match.away_team.color }}
              >
                {match.away_team.name.charAt(0)}
              </div>
            </div>
            
            <div className="text-6xl font-bold text-gray-900 dark:text-white mb-4">
              {match.away_team.score}
            </div>

            {isOfficial && match.status === 'live' && (
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => removeScore('away')}
                  className="w-12 h-12 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center touch-manipulation"
                >
                  <Minus className="w-6 h-6" />
                </button>
                <button
                  onClick={() => addScore('away')}
                  className="w-12 h-12 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center justify-center touch-manipulation"
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Match Controls */}
      {isOfficial && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-3 justify-center mb-4">
            {match.status === 'pre_match' && (
              <button
                onClick={startMatch}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg touch-manipulation"
              >
                <Play className="w-5 h-5" />
                Start Match
              </button>
            )}

            {(match.status === 'live' || match.status === 'half_time') && (
              <>
                <button
                  onClick={pauseMatch}
                  className={`flex items-center gap-2 px-6 py-3 font-medium rounded-lg touch-manipulation ${
                    match.status === 'live' 
                      ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {match.status === 'live' ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  {match.status === 'live' ? 'Pause' : 'Resume'}
                </button>

                <button
                  onClick={endMatch}
                  className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg touch-manipulation"
                >
                  <Square className="w-5 h-5" />
                  End Match
                </button>
              </>
            )}
          </div>

          {/* Quick Event Buttons */}
          {match.status === 'live' && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setEventType('goal');
                  setShowEventModal(true);
                }}
                className="flex items-center justify-center gap-2 p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg touch-manipulation"
              >
                <Target className="w-5 h-5" />
                <span className="font-medium">Goal</span>
              </button>

              <button
                onClick={() => {
                  setEventType('yellow_card');
                  setShowEventModal(true);
                }}
                className="flex items-center justify-center gap-2 p-4 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg touch-manipulation"
              >
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">Card</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Recent Events */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 max-h-48 overflow-y-auto">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
          Match Events ({match.events.length})
        </h4>
        
        {match.events.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
            No events recorded yet
          </p>
        ) : (
          <div className="space-y-2">
            {match.events
              .slice()
              .reverse()
              .slice(0, 5)
              .map(event => (
                <div key={event.id} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm">
                  <div className="flex items-center gap-2">
                    {getEventIcon(event.type)}
                    <span className="font-mono text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
                      {event.minute}'
                    </span>
                  </div>
                  
                  <div className="flex-1">
                    <span className="font-medium">{event.player_name}</span>
                    <span className="text-gray-500 dark:text-gray-400 ml-2">
                      {event.team_name}
                    </span>
                  </div>
                  
                  <span className="capitalize text-xs text-gray-500 dark:text-gray-400">
                    {event.type.replace('_', ' ')}
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 text-xs">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
          <span>{isOnline ? 'Online' : 'Offline'}</span>
        </div>
        
        <div className="text-gray-500 dark:text-gray-400">
          Last saved: {lastSaved.toLocaleTimeString()}
        </div>
      </div>

      {/* Event Modal - Simplified for mobile */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-white capitalize">
                Add {eventType.replace('_', ' ')}
              </h3>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Team Selection */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSelectedTeam('home')}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    selectedTeam === 'home'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {match.home_team.name}
                </button>
                <button
                  onClick={() => setSelectedTeam('away')}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    selectedTeam === 'away'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {match.away_team.name}
                </button>
              </div>

              {/* Player Selection */}
              <div className="max-h-32 overflow-y-auto">
                <div className="grid grid-cols-1 gap-1">
                  {match[selectedTeam + '_team'].players.map(player => (
                    <button
                      key={player.id}
                      onClick={() => setSelectedPlayer(player.id)}
                      className={`p-2 text-left rounded border transition-colors ${
                        selectedPlayer === player.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {player.jersey_number && (
                          <span className="text-sm font-mono bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
                            #{player.jersey_number}
                          </span>
                        )}
                        <span className="font-medium">{player.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowEventModal(false)}
                className="flex-1 p-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (selectedPlayer) {
                    const player = match[selectedTeam + '_team'].players.find(p => p.id === selectedPlayer);
                    const team = match[selectedTeam + '_team'];
                    
                    addEvent({
                      type: eventType,
                      player_id: selectedPlayer,
                      player_name: player?.name || '',
                      team_id: team.id,
                      team_name: team.name
                    });
                  }
                }}
                disabled={!selectedPlayer}
                className="flex-1 p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg"
              >
                Add Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
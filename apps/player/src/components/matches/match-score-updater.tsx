'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Target, 
  Award, 
  Clock, 
  Save, 
  Loader2,
  Plus,
  Minus,
  CheckCircle
} from 'lucide-react';

interface MatchDetails {
  id: string;
  homeTeam: {
    id: string;
    name: string;
    color: string;
    score: number;
  };
  awayTeam: {
    id: string;
    name: string;
    color: string;
    score: number;
  };
  status: string;
  matchDate: string;
  venue?: string;
}

interface PlayerStat {
  user_id: string;
  name: string;
  jersey_number?: number;
  goals: number;
  assists: number;
  minutes_played: number;
  yellow_cards: number;
  red_cards: number;
}

interface TeamMembers {
  [key: string]: {
    id: string;
    name: string;
    jersey_number?: number;
  }[];
}

interface MatchScoreUpdaterProps {
  matchId: string;
  onMatchUpdated?: () => void;
}

export const MatchScoreUpdater: React.FC<MatchScoreUpdaterProps> = ({
  matchId,
  onMatchUpdated
}) => {
  const [match, setMatch] = useState<MatchDetails | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMembers>({});
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [playerStats, setPlayerStats] = useState<{
    home: PlayerStat[];
    away: PlayerStat[];
  }>({ home: [], away: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMatchDetails();
  }, [matchId]);

  const loadMatchDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load match details
      const matchResponse = await fetch(`/api/matches/${matchId}/score`);
      if (!matchResponse.ok) {
        throw new Error('Failed to load match details');
      }
      
      const matchData = await matchResponse.json();
      const matchDetails = matchData.data;
      
      setMatch(matchDetails);
      setHomeScore(matchDetails.homeTeam.score);
      setAwayScore(matchDetails.awayTeam.score);

      // Load team members for both teams
      const [homeTeamResponse, awayTeamResponse] = await Promise.all([
        fetch(`/api/teams/${matchDetails.homeTeam.id}/members`),
        fetch(`/api/teams/${matchDetails.awayTeam.id}/members`)
      ]);

      const homeTeamData = homeTeamResponse.ok ? await homeTeamResponse.json() : { data: [] };
      const awayTeamData = awayTeamResponse.ok ? await awayTeamResponse.json() : { data: [] };

      setTeamMembers({
        [matchDetails.homeTeam.id]: homeTeamData.data || [],
        [matchDetails.awayTeam.id]: awayTeamData.data || []
      });

      // Initialize player stats for all team members
      initializePlayerStats(matchDetails, {
        [matchDetails.homeTeam.id]: homeTeamData.data || [],
        [matchDetails.awayTeam.id]: awayTeamData.data || []
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load match');
    } finally {
      setLoading(false);
    }
  };

  const initializePlayerStats = (matchDetails: MatchDetails, members: TeamMembers) => {
    const homeStats = (members[matchDetails.homeTeam.id] || []).map(player => ({
      user_id: player.id,
      name: player.name,
      jersey_number: player.jersey_number,
      goals: 0,
      assists: 0,
      minutes_played: 90,
      yellow_cards: 0,
      red_cards: 0
    }));

    const awayStats = (members[matchDetails.awayTeam.id] || []).map(player => ({
      user_id: player.id,
      name: player.name,
      jersey_number: player.jersey_number,
      goals: 0,
      assists: 0,
      minutes_played: 90,
      yellow_cards: 0,
      red_cards: 0
    }));

    setPlayerStats({ home: homeStats, away: awayStats });
  };

  const updatePlayerStat = (
    team: 'home' | 'away', 
    playerId: string, 
    field: keyof PlayerStat, 
    value: number
  ) => {
    setPlayerStats(prev => ({
      ...prev,
      [team]: prev[team].map(player =>
        player.user_id === playerId
          ? { ...player, [field]: Math.max(0, value) }
          : player
      )
    }));
  };

  const incrementStat = (team: 'home' | 'away', playerId: string, field: keyof PlayerStat) => {
    const player = playerStats[team].find(p => p.user_id === playerId);
    if (player && typeof player[field] === 'number') {
      updatePlayerStat(team, playerId, field, (player[field] as number) + 1);
    }
  };

  const decrementStat = (team: 'home' | 'away', playerId: string, field: keyof PlayerStat) => {
    const player = playerStats[team].find(p => p.user_id === playerId);
    if (player && typeof player[field] === 'number') {
      updatePlayerStat(team, playerId, field, Math.max(0, (player[field] as number) - 1));
    }
  };

  const saveMatchResults = async () => {
    if (!match) return;

    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`/api/matches/${matchId}/score`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          homeScore,
          awayScore,
          status: 'completed',
          matchDuration: 90,
          playerStats: {
            homeTeamStats: playerStats.home.filter(p => 
              p.goals > 0 || p.assists > 0 || p.yellow_cards > 0 || p.red_cards > 0
            ),
            awayTeamStats: playerStats.away.filter(p => 
              p.goals > 0 || p.assists > 0 || p.yellow_cards > 0 || p.red_cards > 0
            )
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save match results');
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      onMatchUpdated?.();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save match results');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Loading match details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <p className="font-medium">Error:</p>
        <p>{error}</p>
        <button
          onClick={loadMatchDetails}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="text-center p-8 text-gray-500">
        No match found
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      {/* Match Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Update Match Results
        </h2>
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="text-center">
            <div className="flex items-center gap-2 mb-1">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: match.homeTeam.color }}
              />
              <span className="font-medium">{match.homeTeam.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setHomeScore(Math.max(0, homeScore - 1))}
                className="w-8 h-8 bg-red-500 text-white rounded flex items-center justify-center hover:bg-red-600"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-3xl font-bold w-12 text-center">{homeScore}</span>
              <button
                onClick={() => setHomeScore(homeScore + 1)}
                className="w-8 h-8 bg-green-500 text-white rounded flex items-center justify-center hover:bg-green-600"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="text-2xl font-bold text-gray-400 px-4">VS</div>
          
          <div className="text-center">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium">{match.awayTeam.name}</span>
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: match.awayTeam.color }}
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAwayScore(Math.max(0, awayScore - 1))}
                className="w-8 h-8 bg-red-500 text-white rounded flex items-center justify-center hover:bg-red-600"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-3xl font-bold w-12 text-center">{awayScore}</span>
              <button
                onClick={() => setAwayScore(awayScore + 1)}
                className="w-8 h-8 bg-green-500 text-white rounded flex items-center justify-center hover:bg-green-600"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Player Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Home Team Stats */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: match.homeTeam.color }}
            />
            {match.homeTeam.name} Players
          </h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {playerStats.home.map(player => (
              <div key={player.user_id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {player.jersey_number && (
                      <span className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
                        #{player.jersey_number}
                      </span>
                    )}
                    <span className="font-medium text-sm">{player.name}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      <span>Goals</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => decrementStat('home', player.user_id, 'goals')}
                        className="w-5 h-5 bg-red-500 text-white rounded text-xs flex items-center justify-center hover:bg-red-600"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-mono">{player.goals}</span>
                      <button
                        onClick={() => incrementStat('home', player.user_id, 'goals')}
                        className="w-5 h-5 bg-green-500 text-white rounded text-xs flex items-center justify-center hover:bg-green-600"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      <span>Assists</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => decrementStat('home', player.user_id, 'assists')}
                        className="w-5 h-5 bg-red-500 text-white rounded text-xs flex items-center justify-center hover:bg-red-600"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-mono">{player.assists}</span>
                      <button
                        onClick={() => incrementStat('home', player.user_id, 'assists')}
                        className="w-5 h-5 bg-green-500 text-white rounded text-xs flex items-center justify-center hover:bg-green-600"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Away Team Stats */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: match.awayTeam.color }}
            />
            {match.awayTeam.name} Players
          </h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {playerStats.away.map(player => (
              <div key={player.user_id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {player.jersey_number && (
                      <span className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
                        #{player.jersey_number}
                      </span>
                    )}
                    <span className="font-medium text-sm">{player.name}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      <span>Goals</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => decrementStat('away', player.user_id, 'goals')}
                        className="w-5 h-5 bg-red-500 text-white rounded text-xs flex items-center justify-center hover:bg-red-600"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-mono">{player.goals}</span>
                      <button
                        onClick={() => incrementStat('away', player.user_id, 'goals')}
                        className="w-5 h-5 bg-green-500 text-white rounded text-xs flex items-center justify-center hover:bg-green-600"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      <span>Assists</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => decrementStat('away', player.user_id, 'assists')}
                        className="w-5 h-5 bg-red-500 text-white rounded text-xs flex items-center justify-center hover:bg-red-600"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-mono">{player.assists}</span>
                      <button
                        onClick={() => incrementStat('away', player.user_id, 'assists')}
                        className="w-5 h-5 bg-green-500 text-white rounded text-xs flex items-center justify-center hover:bg-green-600"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={saveMatchResults}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : saved ? (
            <>
              <CheckCircle className="w-5 h-5" />
              Saved!
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Complete Match & Save Statistics
            </>
          )}
        </button>
      </div>
    </div>
  );
};
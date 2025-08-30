/**
 * Match Statistics Component
 * 
 * Comprehensive match statistics and results tracking system providing:
 * - Match results display with detailed stats
 * - Player performance analytics 
 * - Team performance metrics
 * - Match history and trends
 * - Integration with live scoring data
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Award, 
  Clock, 
  Users, 
  Trophy, 
  Calendar,
  MapPin,
  ChevronDown,
  ChevronRight,
  Filter,
  Download,
  Share2,
  Zap,
  Shield,
  Activity,
  Hash
} from 'lucide-react';

export interface PlayerMatchStats {
  player_id: string;
  player_name: string;
  jersey_number?: number;
  position?: string;
  minutes_played: number;
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
  shots: number;
  shots_on_target: number;
  passes: number;
  passes_completed: number;
  tackles: number;
  fouls: number;
  saves?: number; // for goalkeepers
  rating: number; // 1-10 performance rating
}

export interface TeamMatchStats {
  team_id: string;
  team_name: string;
  team_color?: string;
  score: number;
  possession_percentage: number;
  shots: number;
  shots_on_target: number;
  corners: number;
  fouls: number;
  cards: {
    yellow: number;
    red: number;
  };
  passes: {
    total: number;
    completed: number;
    accuracy_percentage: number;
  };
  players: PlayerMatchStats[];
}

export interface MatchResult {
  id: string;
  league_id: string;
  league_name: string;
  match_date: string;
  venue?: string;
  status: 'completed' | 'abandoned';
  duration_minutes: number;
  attendance?: number;
  referee?: string;
  home_team: TeamMatchStats;
  away_team: TeamMatchStats;
  events: {
    id: string;
    type: 'goal' | 'assist' | 'yellow_card' | 'red_card' | 'substitution' | 'own_goal';
    player_id: string;
    player_name: string;
    team_id: string;
    minute: number;
    details?: any;
  }[];
  weather?: {
    condition: string;
    temperature: number;
  };
  created_at: string;
}

interface MatchStatisticsProps {
  matchId?: string;
  teamId?: string;
  playerId?: string;
  showDetailed?: boolean;
  onExport?: (data: any) => void;
  className?: string;
}

export const MatchStatistics: React.FC<MatchStatisticsProps> = ({
  matchId,
  teamId,
  playerId,
  showDetailed = true,
  onExport,
  className = ''
}) => {
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'players' | 'events' | 'analysis'>('overview');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (matchId) {
      loadMatchStatistics();
    }
  }, [matchId]);

  const loadMatchStatistics = async () => {
    setIsLoading(true);
    try {
      // Mock comprehensive match statistics
      const mockPlayerStats: PlayerMatchStats[] = [
        {
          player_id: '1',
          player_name: 'John Captain',
          jersey_number: 10,
          position: 'midfielder',
          minutes_played: 90,
          goals: 1,
          assists: 2,
          yellow_cards: 0,
          red_cards: 0,
          shots: 4,
          shots_on_target: 2,
          passes: 78,
          passes_completed: 65,
          tackles: 6,
          fouls: 2,
          rating: 8.5
        },
        {
          player_id: '2',
          player_name: 'Jane Forward',
          jersey_number: 9,
          position: 'forward',
          minutes_played: 85,
          goals: 2,
          assists: 0,
          yellow_cards: 1,
          red_cards: 0,
          shots: 6,
          shots_on_target: 4,
          passes: 32,
          passes_completed: 28,
          tackles: 1,
          fouls: 3,
          rating: 9.0
        },
        {
          player_id: '3',
          player_name: 'Mike Keeper',
          jersey_number: 1,
          position: 'goalkeeper',
          minutes_played: 90,
          goals: 0,
          assists: 0,
          yellow_cards: 0,
          red_cards: 0,
          shots: 0,
          shots_on_target: 0,
          passes: 24,
          passes_completed: 20,
          tackles: 0,
          fouls: 0,
          saves: 5,
          rating: 7.5
        }
      ];

      const mockAwayPlayerStats: PlayerMatchStats[] = [
        {
          player_id: '8',
          player_name: 'Alex Captain',
          jersey_number: 10,
          position: 'midfielder',
          minutes_played: 90,
          goals: 0,
          assists: 1,
          yellow_cards: 1,
          red_cards: 0,
          shots: 3,
          shots_on_target: 1,
          passes: 72,
          passes_completed: 58,
          tackles: 8,
          fouls: 4,
          rating: 7.0
        },
        {
          player_id: '9',
          player_name: 'Emma Striker',
          jersey_number: 9,
          position: 'forward',
          minutes_played: 90,
          goals: 1,
          assists: 0,
          yellow_cards: 0,
          red_cards: 0,
          shots: 5,
          shots_on_target: 3,
          passes: 28,
          passes_completed: 22,
          tackles: 0,
          fouls: 1,
          rating: 7.5
        }
      ];

      const mockResult: MatchResult = {
        id: matchId || '1',
        league_id: '550e8400-e29b-41d4-a716-446655440001',
        league_name: 'League1',
        match_date: '2024-09-08T15:00:00Z',
        venue: 'Central Stadium',
        status: 'completed',
        duration_minutes: 90,
        attendance: 1250,
        referee: 'John Referee',
        home_team: {
          team_id: '550e8400-e29b-41d4-a716-446655440200',
          team_name: 'Thunder Eagles',
          team_color: '#3B82F6',
          score: 3,
          possession_percentage: 58,
          shots: 15,
          shots_on_target: 8,
          corners: 6,
          fouls: 12,
          cards: { yellow: 1, red: 0 },
          passes: { total: 524, completed: 445, accuracy_percentage: 85 },
          players: mockPlayerStats
        },
        away_team: {
          team_id: '550e8400-e29b-41d4-a716-446655440201',
          team_name: 'Lightning Strikers',
          team_color: '#EF4444',
          score: 1,
          possession_percentage: 42,
          shots: 11,
          shots_on_target: 4,
          corners: 3,
          fouls: 18,
          cards: { yellow: 2, red: 0 },
          passes: { total: 398, completed: 312, accuracy_percentage: 78 },
          players: mockAwayPlayerStats
        },
        events: [
          {
            id: '1',
            type: 'goal',
            player_id: '2',
            player_name: 'Jane Forward',
            team_id: '550e8400-e29b-41d4-a716-446655440200',
            minute: 18,
            details: { assisted_by: 'John Captain' }
          },
          {
            id: '2',
            type: 'goal',
            player_id: '9',
            player_name: 'Emma Striker',
            team_id: '550e8400-e29b-41d4-a716-446655440201',
            minute: 34
          },
          {
            id: '3',
            type: 'yellow_card',
            player_id: '8',
            player_name: 'Alex Captain',
            team_id: '550e8400-e29b-41d4-a716-446655440201',
            minute: 42
          },
          {
            id: '4',
            type: 'goal',
            player_id: '2',
            player_name: 'Jane Forward',
            team_id: '550e8400-e29b-41d4-a716-446655440200',
            minute: 67
          },
          {
            id: '5',
            type: 'goal',
            player_id: '1',
            player_name: 'John Captain',
            team_id: '550e8400-e29b-41d4-a716-446655440200',
            minute: 82,
            details: { assisted_by: 'Jane Forward' }
          }
        ],
        weather: {
          condition: 'Sunny',
          temperature: 22
        },
        created_at: '2024-09-08T17:00:00Z'
      };

      setMatchResult(mockResult);
    } catch (error) {
      console.error('Error loading match statistics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'goal': return <Target className="w-4 h-4 text-green-600" />;
      case 'assist': return <Award className="w-4 h-4 text-blue-600" />;
      case 'yellow_card': return <Hash className="w-4 h-4 text-yellow-600" />;
      case 'red_card': return <Hash className="w-4 h-4 text-red-600" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const calculateTeamRating = (players: PlayerMatchStats[]) => {
    const totalRating = players.reduce((sum, player) => sum + player.rating, 0);
    return (totalRating / players.length).toFixed(1);
  };

  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!matchResult) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center ${className}`}>
        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No Statistics Available
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Match statistics are not available for this match.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Match Statistics
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {formatDate(matchResult.match_date)}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {onExport && (
              <button
                onClick={() => onExport(matchResult)}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            )}
            <button className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <Share2 className="w-4 h-4" />
              Share
            </button>
          </div>
        </div>

        {/* Match Result */}
        <div className="flex items-center justify-between p-6 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
          {/* Home Team */}
          <div className="flex items-center gap-4 flex-1">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: matchResult.home_team.team_color }}
            >
              {matchResult.home_team.team_name.charAt(0)}
            </div>
            <div>
              <div className="font-semibold text-gray-900 dark:text-white">
                {matchResult.home_team.team_name}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Rating: {calculateTeamRating(matchResult.home_team.players)}
              </div>
            </div>
          </div>

          {/* Score */}
          <div className="text-center px-6">
            <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1">
              {matchResult.home_team.score} - {matchResult.away_team.score}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Full Time
            </div>
          </div>

          {/* Away Team */}
          <div className="flex items-center gap-4 flex-1 justify-end">
            <div className="text-right">
              <div className="font-semibold text-gray-900 dark:text-white">
                {matchResult.away_team.team_name}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Rating: {calculateTeamRating(matchResult.away_team.players)}
              </div>
            </div>
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: matchResult.away_team.team_color }}
            >
              {matchResult.away_team.team_name.charAt(0)}
            </div>
          </div>
        </div>

        {/* Match Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <MapPin className="w-4 h-4" />
            {matchResult.venue}
          </div>
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Clock className="w-4 h-4" />
            {matchResult.duration_minutes} minutes
          </div>
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Users className="w-4 h-4" />
            {matchResult.attendance} attendance
          </div>
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Trophy className="w-4 h-4" />
            {matchResult.league_name}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'players', label: 'Player Stats', icon: Users },
            { id: 'events', label: 'Match Events', icon: Clock },
            { id: 'analysis', label: 'Analysis', icon: TrendingUp }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                selectedTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {selectedTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Team Statistics Comparison */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Team Statistics
            </h3>
            
            <div className="space-y-4">
              {/* Possession */}
              <div>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                  <span>Possession</span>
                  <span>{matchResult.home_team.possession_percentage}% - {matchResult.away_team.possession_percentage}%</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500"
                    style={{ width: `${matchResult.home_team.possession_percentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Shots */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {matchResult.home_team.shots}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Shots</div>
                </div>
                <div className="text-gray-500 dark:text-gray-400 text-sm self-center">
                  vs
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {matchResult.away_team.shots}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Shots</div>
                </div>
              </div>

              {/* Shots on Target */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {matchResult.home_team.shots_on_target}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">On Target</div>
                </div>
                <div className="text-gray-500 dark:text-gray-400 text-sm self-center">
                  vs
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {matchResult.away_team.shots_on_target}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">On Target</div>
                </div>
              </div>

              {/* Pass Accuracy */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {matchResult.home_team.passes.accuracy_percentage}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Pass Accuracy</div>
                </div>
                <div className="text-gray-500 dark:text-gray-400 text-sm self-center">
                  vs
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {matchResult.away_team.passes.accuracy_percentage}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Pass Accuracy</div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Performers */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Top Performers
            </h3>
            
            <div className="space-y-4">
              {/* Man of the Match */}
              {(() => {
                const allPlayers = [...matchResult.home_team.players, ...matchResult.away_team.players];
                const topPlayer = allPlayers.reduce((prev, current) => 
                  prev.rating > current.rating ? prev : current
                );
                const playerTeam = matchResult.home_team.players.includes(topPlayer) ? 
                  matchResult.home_team : matchResult.away_team;
                
                return (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-center gap-3">
                      <Trophy className="w-6 h-6 text-yellow-600" />
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {topPlayer.player_name}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {playerTeam.team_name} • Rating: {topPlayer.rating}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Top Scorer */}
              {(() => {
                const allPlayers = [...matchResult.home_team.players, ...matchResult.away_team.players];
                const topScorer = allPlayers.reduce((prev, current) => 
                  prev.goals > current.goals ? prev : current
                );
                
                if (topScorer.goals > 0) {
                  const playerTeam = matchResult.home_team.players.includes(topScorer) ? 
                    matchResult.home_team : matchResult.away_team;
                  
                  return (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-3">
                        <Target className="w-6 h-6 text-green-600" />
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {topScorer.player_name}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {playerTeam.team_name} • {topScorer.goals} goal{topScorer.goals !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Most Assists */}
              {(() => {
                const allPlayers = [...matchResult.home_team.players, ...matchResult.away_team.players];
                const topAssister = allPlayers.reduce((prev, current) => 
                  prev.assists > current.assists ? prev : current
                );
                
                if (topAssister.assists > 0) {
                  const playerTeam = matchResult.home_team.players.includes(topAssister) ? 
                    matchResult.home_team : matchResult.away_team;
                  
                  return (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-3">
                        <Award className="w-6 h-6 text-blue-600" />
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {topAssister.player_name}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {playerTeam.team_name} • {topAssister.assists} assist{topAssister.assists !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'players' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Home Team Players */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: matchResult.home_team.team_color }}
              ></div>
              {matchResult.home_team.team_name}
            </h3>
            
            <div className="space-y-3">
              {matchResult.home_team.players
                .sort((a, b) => b.rating - a.rating)
                .map(player => (
                  <div key={player.player_id} className="p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {player.jersey_number && (
                          <span className="text-xs font-mono bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                            #{player.jersey_number}
                          </span>
                        )}
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {player.player_name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                            {player.position}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {player.rating}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Rating</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-3 text-center text-sm">
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">{player.goals}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Goals</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">{player.assists}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Assists</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">{player.shots}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Shots</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {Math.round((player.passes_completed / player.passes) * 100)}%
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Passes</div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Away Team Players */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: matchResult.away_team.team_color }}
              ></div>
              {matchResult.away_team.team_name}
            </h3>
            
            <div className="space-y-3">
              {matchResult.away_team.players
                .sort((a, b) => b.rating - a.rating)
                .map(player => (
                  <div key={player.player_id} className="p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {player.jersey_number && (
                          <span className="text-xs font-mono bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                            #{player.jersey_number}
                          </span>
                        )}
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {player.player_name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                            {player.position}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {player.rating}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Rating</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-3 text-center text-sm">
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">{player.goals}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Goals</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">{player.assists}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Assists</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">{player.shots}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Shots</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {Math.round((player.passes_completed / player.passes) * 100)}%
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Passes</div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'events' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Match Timeline
          </h3>
          
          <div className="space-y-4">
            {matchResult.events
              .sort((a, b) => a.minute - b.minute)
              .map((event, index) => (
                <div key={event.id} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      {getEventIcon(event.type)}
                    </div>
                    {index < matchResult.events.length - 1 && (
                      <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mt-2"></div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        {event.minute}'
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {event.player_name}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        ({event.type.replace('_', ' ')})
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {event.team_id === matchResult.home_team.team_id ? 
                        matchResult.home_team.team_name : 
                        matchResult.away_team.team_name}
                      {event.details?.assisted_by && (
                        <span className="ml-2">• Assisted by {event.details.assisted_by}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {selectedTab === 'analysis' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Match Insights */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Match Analysis
            </h3>
            
            <div className="space-y-4 text-sm">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="font-medium text-blue-900 dark:text-blue-300 mb-2">
                  Tactical Overview
                </div>
                <p className="text-blue-800 dark:text-blue-400">
                  {matchResult.home_team.team_name} dominated possession ({matchResult.home_team.possession_percentage}%) 
                  and created more scoring opportunities with {matchResult.home_team.shots} shots compared to {matchResult.away_team.shots}.
                </p>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="font-medium text-green-900 dark:text-green-300 mb-2">
                  Key Performance
                </div>
                <p className="text-green-800 dark:text-green-400">
                  Conversion rate: {matchResult.home_team.team_name} converted {Math.round((matchResult.home_team.score / matchResult.home_team.shots) * 100)}% 
                  of shots while {matchResult.away_team.team_name} converted {Math.round((matchResult.away_team.score / matchResult.away_team.shots) * 100)}%.
                </p>
              </div>

              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="font-medium text-yellow-900 dark:text-yellow-300 mb-2">
                  Areas for Improvement
                </div>
                <p className="text-yellow-800 dark:text-yellow-400">
                  {matchResult.away_team.team_name} committed more fouls ({matchResult.away_team.fouls} vs {matchResult.home_team.fouls}) 
                  and had lower pass accuracy ({matchResult.away_team.passes.accuracy_percentage}% vs {matchResult.home_team.passes.accuracy_percentage}%).
                </p>
              </div>
            </div>
          </div>

          {/* Weather & Conditions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Match Conditions
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500 dark:text-gray-400 mb-1">Weather</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {matchResult.weather?.condition} • {matchResult.weather?.temperature}°C
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-gray-400 mb-1">Referee</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {matchResult.referee}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-gray-500 dark:text-gray-400 mb-2 text-sm">
                  Cards Issued
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {matchResult.home_team.cards.yellow + matchResult.away_team.cards.yellow}
                    </div>
                    <div className="text-xs text-yellow-700 dark:text-yellow-400">Yellow Cards</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {matchResult.home_team.cards.red + matchResult.away_team.cards.red}
                    </div>
                    <div className="text-xs text-red-700 dark:text-red-400">Red Cards</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
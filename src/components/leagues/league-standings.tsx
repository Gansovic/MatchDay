/**
 * League Standings Component
 * 
 * Automatic league standings calculation from match results with:
 * - Real-time standings updates from completed matches
 * - Goal difference and goals for/against tracking
 * - Recent form and position change indicators
 * - Configurable point systems (3-1-0, 2-1-0, etc.)
 * - Championship, relegation, and playoffs indicators
 * - Head-to-head record comparisons
 */

'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Target,
  Users,
  Calendar,
  ChevronUp,
  ChevronDown,
  Crown,
  AlertTriangle,
  Star,
  Circle,
  Zap,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Hash,
  Filter,
  RefreshCw
} from 'lucide-react';

export interface Match {
  id: string;
  league_id: string;
  season_id?: string;
  home_team_id: string;
  home_team_name: string;
  away_team_id: string;
  away_team_name: string;
  home_score?: number;
  away_score?: number;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  match_date: string;
  venue?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Team {
  id: string;
  name: string;
  team_color?: string;
  league_id: string;
}

export interface StandingsTeam {
  id: string;
  name: string;
  team_color?: string;
  position: number;
  previous_position?: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
  recent_form: ('W' | 'D' | 'L')[];
  head_to_head?: { [teamId: string]: { won: number; drawn: number; lost: number; } };
}

export interface LeagueStandings {
  id: string;
  name: string;
  teams: StandingsTeam[];
  updated_at: string;
  point_system: {
    win: number;
    draw: number;
    loss: number;
  };
  promotion_spots?: number;
  relegation_spots?: number;
  playoff_spots?: number;
}

interface LeagueStandingsProps {
  leagueId: string;
  leagueName?: string;
  currentSeasonId?: string;
  matches?: Match[];
  teams?: Team[];
  pointSystem?: { win: number; draw: number; loss: number; };
  promotionSpots?: number;
  relegationSpots?: number;
  playoffSpots?: number;
  showForm?: boolean;
  showGoalDifference?: boolean;
  className?: string;
  onTeamClick?: (teamId: string) => void;
}

export const LeagueStandings: React.FC<LeagueStandingsProps> = ({
  leagueId,
  leagueName,
  currentSeasonId,
  matches: propMatches,
  teams: propTeams,
  pointSystem = { win: 3, draw: 1, loss: 0 },
  promotionSpots = 0,
  relegationSpots = 0,
  playoffSpots = 0,
  showForm = true,
  showGoalDifference = true,
  className = '',
  onTeamClick
}) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const loadingRef = useRef(false);

  const loadStandingsData = useCallback(async () => {
    // Prevent multiple simultaneous loads
    if (loadingRef.current) return;
    loadingRef.current = true;
    
    setIsLoading(true);
    try {
      // Fetch matches and teams from API
      const matchesUrl = currentSeasonId 
        ? `/api/leagues/${leagueId}/matches?season_id=${currentSeasonId}`
        : `/api/leagues/${leagueId}/matches`;
      
      const [matchesRes, teamsRes] = await Promise.all([
        fetch(matchesUrl),
        fetch(`/api/leagues/${leagueId}/teams`)
      ]);

      if (!matchesRes.ok || !teamsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const matchesData = await matchesRes.json();
      const teamsData = await teamsRes.json();

      if (matchesData.success && teamsData.success) {
        setMatches(matchesData.data || []);
        setTeams(teamsData.data || []);
      } else {
        console.error('API returned error:', matchesData.error || teamsData.error);
        setMatches([]);
        setTeams([]);
      }
    } catch (error) {
      console.error('Failed to load standings data:', error);
      setMatches([]);
      setTeams([]);
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [leagueId, currentSeasonId]);

  // Load data when component mounts or dependencies change
  useEffect(() => {
    // If props are provided, use them
    if (propMatches && propTeams) {
      setMatches(propMatches);
      setTeams(propTeams);
      setIsLoading(false);
      return;
    }
    
    // For now, disable self-loading to prevent conflicts with parent
    // TODO: Either receive props from parent OR implement proper data sharing
    console.log('LeagueStandings: No props provided, loading disabled to prevent loops');
    setMatches([]);
    setTeams([]);
    setIsLoading(false);
    return;
    
    // Otherwise, fetch data if we have a league ID
    if (!leagueId) {
      setIsLoading(false);
      return;
    }
    
    // Only fetch if not already loading
    if (loadingRef.current) return;
    
    loadStandingsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propMatches, propTeams, leagueId, currentSeasonId]); // Don't depend on loadStandingsData to avoid circular dependency

  // Calculate standings from match results
  const standings: LeagueStandings = useMemo(() => {
    const teamStats: { [teamId: string]: StandingsTeam } = {};
    const completedMatches = matches.filter(m => m.status === 'completed' && m.home_score !== undefined && m.away_score !== undefined);
    
    // Initialize team stats
    teams.forEach(team => {
      teamStats[team.id] = {
        id: team.id,
        name: team.name,
        team_color: team.team_color,
        position: 0,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goals_for: 0,
        goals_against: 0,
        goal_difference: 0,
        points: 0,
        recent_form: [],
        head_to_head: {}
      };
    });

    // Process matches to calculate stats
    completedMatches.forEach(match => {
      const homeTeam = teamStats[match.home_team_id];
      const awayTeam = teamStats[match.away_team_id];
      
      if (!homeTeam || !awayTeam) return;

      const homeScore = match.home_score!;
      const awayScore = match.away_score!;
      
      // Update played games
      homeTeam.played++;
      awayTeam.played++;
      
      // Update goals
      homeTeam.goals_for += homeScore;
      homeTeam.goals_against += awayScore;
      awayTeam.goals_for += awayScore;
      awayTeam.goals_against += homeScore;
      
      // Update results and form
      if (homeScore > awayScore) {
        // Home win
        homeTeam.won++;
        homeTeam.points += pointSystem.win;
        homeTeam.recent_form.unshift('W');
        
        awayTeam.lost++;
        awayTeam.points += pointSystem.loss;
        awayTeam.recent_form.unshift('L');
      } else if (homeScore < awayScore) {
        // Away win
        awayTeam.won++;
        awayTeam.points += pointSystem.win;
        awayTeam.recent_form.unshift('W');
        
        homeTeam.lost++;
        homeTeam.points += pointSystem.loss;
        homeTeam.recent_form.unshift('L');
      } else {
        // Draw
        homeTeam.drawn++;
        homeTeam.points += pointSystem.draw;
        homeTeam.recent_form.unshift('D');
        
        awayTeam.drawn++;
        awayTeam.points += pointSystem.draw;
        awayTeam.recent_form.unshift('D');
      }
      
      // Keep only last 5 form results
      if (homeTeam.recent_form.length > 5) homeTeam.recent_form = homeTeam.recent_form.slice(0, 5);
      if (awayTeam.recent_form.length > 5) awayTeam.recent_form = awayTeam.recent_form.slice(0, 5);
    });

    // Calculate goal difference and sort standings
    const standingsArray = Object.values(teamStats).map(team => ({
      ...team,
      goal_difference: team.goals_for - team.goals_against
    })).sort((a, b) => {
      // Sort by points (descending), then goal difference, then goals for
      if (a.points !== b.points) return b.points - a.points;
      if (a.goal_difference !== b.goal_difference) return b.goal_difference - a.goal_difference;
      return b.goals_for - a.goals_for;
    }).map((team, index) => ({
      ...team,
      position: index + 1,
      previous_position: index + 1 // TODO: Track from previous calculation
    }));

    setLastUpdated(new Date());

    return {
      id: leagueId,
      name: leagueName || 'League Standings',
      teams: standingsArray,
      updated_at: new Date().toISOString(),
      point_system: pointSystem,
      promotion_spots: promotionSpots,
      relegation_spots: relegationSpots,
      playoff_spots: playoffSpots
    };
  }, [matches, teams, leagueId, leagueName, pointSystem, promotionSpots, relegationSpots, playoffSpots]);

  const getPositionIcon = (current: number, previous?: number) => {
    if (!previous || current === previous) return <Minus className="w-4 h-4 text-gray-400" />;
    if (current < previous) return <ChevronUp className="w-4 h-4 text-green-500" />;
    return <ChevronDown className="w-4 h-4 text-red-500" />;
  };

  const getPositionStyle = (position: number) => {
    if (promotionSpots && position <= promotionSpots) {
      return 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500';
    }
    if (playoffSpots && position <= promotionSpots + playoffSpots && position > promotionSpots) {
      return 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500';
    }
    if (relegationSpots && position > standings.teams.length - relegationSpots) {
      return 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500';
    }
    return '';
  };

  const getFormColor = (result: 'W' | 'D' | 'L') => {
    switch (result) {
      case 'W': return 'bg-green-500 text-white';
      case 'D': return 'bg-yellow-500 text-white';
      case 'L': return 'bg-red-500 text-white';
    }
  };

  const handleRefresh = useCallback(() => {
    loadStandingsData();
  }, [loadStandingsData]);

  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 ${className}`}>
        <div className="flex items-center justify-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {standings.name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Refresh standings"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Legend */}
        <div className="mt-4 flex items-center gap-4 text-xs">
          {promotionSpots > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-gray-600 dark:text-gray-400">Promotion</span>
            </div>
          )}
          {playoffSpots > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-gray-600 dark:text-gray-400">Playoffs</span>
            </div>
          )}
          {relegationSpots > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-gray-600 dark:text-gray-400">Relegation</span>
            </div>
          )}
        </div>
      </div>

      {/* Standings Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <Hash className="w-4 h-4 inline" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Team
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                P
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                W
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                D
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                L
              </th>
              {showGoalDifference && (
                <>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    GF
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    GA
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    GD
                  </th>
                </>
              )}
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Pts
              </th>
              {showForm && (
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Form
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {standings.teams.map((team) => (
              <tr 
                key={team.id} 
                className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${getPositionStyle(team.position)} ${
                  selectedTeam === team.id ? 'ring-2 ring-blue-500' : ''
                } ${onTeamClick ? 'cursor-pointer' : ''}`}
                onClick={() => {
                  if (onTeamClick) {
                    onTeamClick(team.id);
                  }
                  setSelectedTeam(selectedTeam === team.id ? null : team.id);
                }}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {team.position}
                    </span>
                    {getPositionIcon(team.position, team.previous_position)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: team.team_color || '#6B7280' }}
                    >
                      {team.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {team.name}
                      </div>
                      {team.position <= (promotionSpots || 0) && promotionSpots > 0 && (
                        <div className="text-xs text-green-600 dark:text-green-400">
                          <Crown className="w-3 h-3 inline mr-1" />
                          Promotion
                        </div>
                      )}
                      {team.position > standings.teams.length - (relegationSpots || 0) && relegationSpots > 0 && (
                        <div className="text-xs text-red-600 dark:text-red-400">
                          <AlertTriangle className="w-3 h-3 inline mr-1" />
                          Relegation
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-white">
                  {team.played}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-white">
                  {team.won}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-white">
                  {team.drawn}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-white">
                  {team.lost}
                </td>
                {showGoalDifference && (
                  <>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-white">
                      {team.goals_for}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-white">
                      {team.goals_against}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                      <span className={`font-medium ${
                        team.goal_difference > 0 
                          ? 'text-green-600 dark:text-green-400' 
                          : team.goal_difference < 0 
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-gray-900 dark:text-white'
                      }`}>
                        {team.goal_difference > 0 ? '+' : ''}{team.goal_difference}
                      </span>
                    </td>
                  </>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-gray-900 dark:text-white">
                  {team.points}
                </td>
                {showForm && (
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-1">
                      {team.recent_form.map((result, index) => (
                        <div 
                          key={index}
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${getFormColor(result)}`}
                          title={`${result === 'W' ? 'Win' : result === 'D' ? 'Draw' : 'Loss'}`}
                        >
                          {result}
                        </div>
                      ))}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Stats Summary */}
      <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="font-bold text-lg text-gray-900 dark:text-white">
              {standings.teams.length}
            </div>
            <div className="text-gray-500 dark:text-gray-400">Teams</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg text-gray-900 dark:text-white">
              {matches.filter(m => m.status === 'completed').length}
            </div>
            <div className="text-gray-500 dark:text-gray-400">Completed</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg text-gray-900 dark:text-white">
              {standings.teams.reduce((acc, team) => acc + team.goals_for, 0)}
            </div>
            <div className="text-gray-500 dark:text-gray-400">Total Goals</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg text-gray-900 dark:text-white">
              {pointSystem.win}-{pointSystem.draw}-{pointSystem.loss}
            </div>
            <div className="text-gray-500 dark:text-gray-400">Point System</div>
          </div>
        </div>
      </div>
    </div>
  );
};
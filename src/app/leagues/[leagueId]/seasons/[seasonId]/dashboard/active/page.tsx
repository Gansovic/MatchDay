/**
 * Active Season Dashboard
 * 
 * Shows live data for current/active seasons:
 * - Current standings with live updates
 * - Upcoming fixtures and recent matches
 * - Team management tools
 * - Live match day features
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { 
  Trophy,
  Calendar,
  Target,
  Shield,
  Star,
  Clock,
  MapPin,
  Users,
  Settings,
  Bell,
  Play,
  Loader2,
  AlertCircle,
  RefreshCw,
  Download
} from 'lucide-react';
import SeasonDashboardLayout from '@/components/leagues/dashboards/SeasonDashboardLayout';
import { LeagueStandings, Match, Team } from '@/components/leagues/league-standings';

interface LeagueMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  venue: string;
  homeScore?: number;
  awayScore?: number;
  status: 'completed' | 'scheduled';
  round?: number;
}

interface PlayerStat {
  id: string;
  name: string;
  team: string;
  value: number;
  position?: string;
}

interface LoadingStates {
  matches: boolean;
  stats: boolean;
  teams: boolean;
}

interface ErrorStates {
  matches: string | null;
  stats: string | null;
  teams: string | null;
}

export default function ActiveSeasonDashboard() {
  const params = useParams();
  const leagueId = params.leagueId as string;
  const seasonId = params.seasonId as string;

  const [activeTab, setActiveTab] = useState<'standings' | 'matches' | 'stats' | 'management'>('standings');
  const [matches, setMatches] = useState<LeagueMatch[]>([]);
  const [standingsMatches, setStandingsMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [playerStats, setPlayerStats] = useState<{
    topScorers: PlayerStat[];
    topAssists: PlayerStat[];
    cleanSheets: PlayerStat[];
  }>({ topScorers: [], topAssists: [], cleanSheets: [] });
  
  const [seasonStats, setSeasonStats] = useState<{
    total_matches: number;
    completed_matches: number;
    total_goals: number;
    total_players: number;
    avg_goals_per_match: number;
  }>({ total_matches: 0, completed_matches: 0, total_goals: 0, total_players: 0, avg_goals_per_match: 0 });

  // Loading and error states
  const [loading, setLoading] = useState<LoadingStates>({
    matches: true,
    stats: true,
    teams: true
  });
  
  const [errors, setErrors] = useState<ErrorStates>({
    matches: null,
    stats: null,
    teams: null
  });

  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch season matches
  const fetchSeasonMatches = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, matches: true }));
      setErrors(prev => ({ ...prev, matches: null }));
      
      const baseUrl = typeof window !== 'undefined' 
        ? window.location.origin 
        : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';
      
      const matchesUrl = `${baseUrl}/api/leagues/${leagueId}/matches?seasonId=${seasonId}`;
      
      const response = await fetch(matchesUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const apiResult = await response.json();
      
      if (!apiResult.success) {
        throw new Error(apiResult.error || 'Failed to fetch matches');
      }
      
      // Transform matches to expected format for display
      const transformedMatches: LeagueMatch[] = (apiResult.data || []).map((match: any) => ({
        id: match.id,
        homeTeam: match.home_team?.name || 'Unknown Team',
        awayTeam: match.away_team?.name || 'Unknown Team',
        date: match.match_date,
        venue: match.venue || 'TBD',
        homeScore: match.home_score || undefined,
        awayScore: match.away_score || undefined,
        status: match.status === 'completed' ? 'completed' : 'scheduled',
        round: match.match_day || undefined
      }));

      // Transform matches to format expected by LeagueStandings component
      const standingsFormatMatches: Match[] = (apiResult.data || []).map((match: any) => ({
        id: match.id,
        league_id: leagueId,
        season_id: seasonId,
        home_team_id: match.home_team_id,
        home_team_name: match.home_team?.name || 'Unknown Team',
        away_team_id: match.away_team_id,
        away_team_name: match.away_team?.name || 'Unknown Team',
        home_score: match.home_score || undefined,
        away_score: match.away_score || undefined,
        status: match.status === 'completed' ? 'completed' : match.status,
        match_date: match.match_date,
        venue: match.venue || 'TBD',
        created_at: match.created_at,
        updated_at: match.updated_at
      }));
      
      setMatches(transformedMatches);
      setStandingsMatches(standingsFormatMatches);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching matches:', error);
      setErrors(prev => ({ ...prev, matches: 'Failed to load matches' }));
    } finally {
      setLoading(prev => ({ ...prev, matches: false }));
    }
  }, [leagueId, seasonId]);

  // Fetch player stats
  const fetchPlayerStats = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, stats: true }));
      setErrors(prev => ({ ...prev, stats: null }));
      
      const baseUrl = typeof window !== 'undefined' 
        ? window.location.origin 
        : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';
      
      const statsUrl = `${baseUrl}/api/leagues/${leagueId}/seasons/${seasonId}/player-stats`;
      
      const response = await fetch(statsUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Player stats API request failed: ${response.status}`);
      }

      const apiResult = await response.json();
      
      if (!apiResult.success) {
        throw new Error(apiResult.error || 'Failed to fetch player statistics');
      }
      
      // Transform API data to expected format
      const transformPlayerStats = (players: any[]) => 
        players.map((player: any) => ({
          id: player.id,
          name: player.name,
          team: player.team,
          value: player.value,
          position: player.position || 'Player'
        }));
      
      setPlayerStats({
        topScorers: transformPlayerStats(apiResult.data?.topScorers || []),
        topAssists: transformPlayerStats(apiResult.data?.topAssists || []),
        cleanSheets: transformPlayerStats(apiResult.data?.cleanSheets || [])
      });

      // Set season statistics from API
      if (apiResult.data?.seasonStats) {
        setSeasonStats(apiResult.data.seasonStats);
      }
    } catch (error) {
      console.error('Error fetching player stats:', error);
      setErrors(prev => ({ ...prev, stats: 'Failed to load player statistics' }));
      // Set empty stats on error
      setPlayerStats({ 
        topScorers: [], 
        topAssists: [], 
        cleanSheets: [] 
      });
    } finally {
      setLoading(prev => ({ ...prev, stats: false }));
    }
  }, [leagueId, seasonId]);

  // Fetch season teams
  const fetchSeasonTeams = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, teams: true }));
      setErrors(prev => ({ ...prev, teams: null }));
      
      const baseUrl = typeof window !== 'undefined' 
        ? window.location.origin 
        : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';
      
      const teamsUrl = `${baseUrl}/api/leagues/${leagueId}/teams`;
      
      const response = await fetch(teamsUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Teams API request failed: ${response.status}`);
      }

      const apiResult = await response.json();
      
      if (!apiResult.success) {
        throw new Error(apiResult.error || 'Failed to fetch teams');
      }
      
      // Transform teams to format expected by LeagueStandings component
      const standingsFormatTeams: Team[] = (apiResult.data || []).map((team: any) => ({
        id: team.id,
        name: team.name,
        team_color: team.team_color,
        league_id: leagueId
      }));
      
      setTeams(standingsFormatTeams);
    } catch (error) {
      console.error('Error fetching teams:', error);
      setErrors(prev => ({ ...prev, teams: 'Failed to load teams' }));
    } finally {
      setLoading(prev => ({ ...prev, teams: false }));
    }
  }, [leagueId]);

  // Refresh data function
  const refreshData = useCallback(async () => {
    await Promise.all([
      fetchSeasonMatches(),
      fetchPlayerStats(),
      fetchSeasonTeams()
    ]);
  }, [fetchSeasonMatches, fetchPlayerStats, fetchSeasonTeams]);

  // Initial data load
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Auto refresh every 5 minutes for active season
  useEffect(() => {
    const interval = setInterval(refreshData, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval);
  }, [refreshData]);

  // Helper function to format date consistently
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getUTCMonth()];
    const day = date.getUTCDate();
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    return `${month} ${day}, ${hours}:${minutes}`;
  };

  // Helper function to check if match is today
  const isToday = (dateString: string) => {
    const matchDate = new Date(dateString);
    const today = new Date();
    return matchDate.toDateString() === today.toDateString();
  };

  // Helper function to check if match is in next 24 hours
  const isUpcoming = (dateString: string) => {
    const matchDate = new Date(dateString);
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return matchDate > now && matchDate <= tomorrow;
  };

  // Derived data
  const recentMatches = matches.filter(m => m.status === 'completed').slice(0, 5);
  const upcomingMatches = matches.filter(m => m.status === 'scheduled').slice(0, 5);
  const todaysMatches = upcomingMatches.filter(m => isToday(m.date));
  const nextMatches = upcomingMatches.filter(m => isUpcoming(m.date));
  
  const completedMatches = matches.filter(m => m.status === 'completed');
  const totalMatches = matches.length;
  const completionPercentage = totalMatches > 0 ? (completedMatches.length / totalMatches) * 100 : 0;

  const availableTabs = ['standings', 'matches', 'stats', 'management'];

  const renderContent = () => {
    switch (activeTab) {
      case 'standings':
        return (
          <div>
            <div className="mb-6">
              <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Play className="w-6 h-6 text-green-600 dark:text-green-400" />
                    <div>
                      <h3 className="font-semibold text-green-900 dark:text-green-100">Season in Progress</h3>
                      <p className="text-sm text-green-800 dark:text-green-200">
                        Live standings updated after each match
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-green-700 dark:text-green-300">
                      {completionPercentage.toFixed(0)}% Complete
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-400">
                      {completedMatches.length} of {totalMatches} matches
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <LeagueStandings 
              leagueId={leagueId}
              currentSeasonId={seasonId}
              matches={standingsMatches}
              teams={teams}
              promotionSpots={3}
              relegationSpots={2}
              showLiveUpdates={true}
            />
          </div>
        );

      case 'matches':
        return (
          <div className="space-y-8">
            {loading.matches ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600 dark:text-gray-400">Loading matches...</span>
              </div>
            ) : errors.matches ? (
              <div className="text-center py-8">
                <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-red-600 dark:text-red-400">{errors.matches}</p>
              </div>
            ) : (
              <>
                {/* Match Day Widget */}
                {(todaysMatches.length > 0 || nextMatches.length > 0) && (
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                        <Bell className="w-5 h-5" />
                        {todaysMatches.length > 0 ? 'Today\'s Matches' : 'Upcoming Matches'}
                      </h3>
                      <button
                        onClick={refreshData}
                        className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                      </button>
                    </div>
                    <div className="space-y-3">
                      {(todaysMatches.length > 0 ? todaysMatches : nextMatches).map((match) => (
                        <div key={match.id} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700">
                          <div className="flex items-center gap-4">
                            <div className="text-xs text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
                              {isToday(match.date) ? 'TODAY' : 'NEXT'}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {match.homeTeam} vs {match.awayTeam}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-4">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatDate(match.date)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {match.venue}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
                              {match.round ? `Round ${match.round}` : 'Fixture'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Results */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Recent Results
                    </h3>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500">
                        {recentMatches.length} recent matches
                      </span>
                      <span className="text-sm text-gray-500">
                        Updated: {lastUpdated.toLocaleTimeString()}
                      </span>
                      <button className="flex items-center gap-2 text-sm bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        <Download className="w-4 h-4" />
                        Export Results
                      </button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {recentMatches.length === 0 ? (
                      <div className="text-center py-8">
                        <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600 dark:text-gray-400">No recent matches</p>
                      </div>
                    ) : (
                      recentMatches.map((match) => (
                        <div key={match.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                          <div className="flex items-center gap-4">
                            {match.round && (
                              <div className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                R{match.round}
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {match.homeTeam} vs {match.awayTeam}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-4">
                                <span>{formatDate(match.date)}</span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {match.venue}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            {match.homeScore !== undefined && match.awayScore !== undefined ? (
                              <>
                                <div className="text-xl font-bold text-gray-900 dark:text-white">
                                  {match.homeScore} - {match.awayScore}
                                </div>
                                <div className="text-xs text-gray-500">Final</div>
                              </>
                            ) : (
                              <div className="text-sm text-gray-500">No Score</div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Upcoming Fixtures */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Upcoming Fixtures
                    </h3>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500">
                        {upcomingMatches.length} fixtures scheduled
                      </span>
                      <button className="flex items-center gap-2 text-sm bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors">
                        <Calendar className="w-4 h-4" />
                        Schedule Match
                      </button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {upcomingMatches.length === 0 ? (
                      <div className="text-center py-8">
                        <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600 dark:text-gray-400">No upcoming fixtures scheduled</p>
                      </div>
                    ) : (
                      upcomingMatches.map((match) => (
                        <div key={match.id} className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <div className="flex items-center gap-4">
                            {match.round && (
                              <div className="text-xs text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
                                R{match.round}
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {match.homeTeam} vs {match.awayTeam}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-4">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatDate(match.date)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {match.venue}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            {isToday(match.date) ? (
                              <div className="text-sm font-medium text-green-600 dark:text-green-400">Today</div>
                            ) : isUpcoming(match.date) ? (
                              <div className="text-sm font-medium text-blue-600 dark:text-blue-400">Soon</div>
                            ) : (
                              <div className="text-sm text-gray-500">Scheduled</div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        );

      case 'stats':
        return (
          <div className="space-y-8">
            {loading.stats ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600 dark:text-gray-400">Loading current statistics...</span>
              </div>
            ) : (
              <>
                {/* Season Progress Overview - Enhanced */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{seasonStats.completed_matches}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Matches Played</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      {seasonStats.total_matches - seasonStats.completed_matches} remaining
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{teams.length}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Teams</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      {seasonStats.total_players} players active
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                        <Target className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{seasonStats.total_goals}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Total Goals</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      {seasonStats.avg_goals_per_match} per match avg
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {completionPercentage.toFixed(0)}%
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Complete</div>
                      </div>
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-400 font-medium">ACTIVE</div>
                  </div>
                </div>

                {/* Current Leaders */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Top Scorers */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Current Top Scorers
                      </h3>
                      <Target className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="space-y-4">
                      {playerStats.topScorers.length === 0 ? (
                        <div className="text-center py-4">
                          <Target className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">No scoring data yet</p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">Stats will appear as matches are played</p>
                        </div>
                      ) : (
                        playerStats.topScorers.map((player, index) => (
                          <div key={player.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                index === 0 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                index === 1 ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' :
                                index === 2 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                                'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                              }`}>
                                {index + 1}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white text-sm">
                                  {player.name}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  {player.team}
                                </div>
                              </div>
                            </div>
                            <div className="font-bold text-gray-900 dark:text-white">
                              {player.value}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Most Assists */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Most Assists
                      </h3>
                      <Star className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="space-y-4">
                      {playerStats.topAssists.length === 0 ? (
                        <div className="text-center py-4">
                          <Star className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">No assist data yet</p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">Stats will appear as matches are played</p>
                        </div>
                      ) : (
                        playerStats.topAssists.map((player, index) => (
                          <div key={player.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                index === 0 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                index === 1 ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' :
                                index === 2 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                                'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                              }`}>
                                {index + 1}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white text-sm">
                                  {player.name}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  {player.team}
                                </div>
                              </div>
                            </div>
                            <div className="font-bold text-gray-900 dark:text-white">
                              {player.value}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Clean Sheets */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Clean Sheets
                      </h3>
                      <Shield className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="space-y-4">
                      {playerStats.cleanSheets.length === 0 ? (
                        <div className="text-center py-4">
                          <Shield className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">No goalkeeper data yet</p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">Stats will appear as matches are played</p>
                        </div>
                      ) : (
                        playerStats.cleanSheets.map((player, index) => (
                          <div key={player.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                index === 0 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                index === 1 ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' :
                                index === 2 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                                'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                              }`}>
                                {index + 1}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white text-sm">
                                  {player.name}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  {player.team}
                                </div>
                              </div>
                            </div>
                            <div className="font-bold text-gray-900 dark:text-white">
                              {player.value}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Additional Season Statistics - Adapted from completed dashboard */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Current Season Summary */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Season Progress
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Matches Played</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{seasonStats.completed_matches}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Matches Remaining</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{seasonStats.total_matches - seasonStats.completed_matches}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Average Goals per Match</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{seasonStats.avg_goals_per_match}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Total Goals So Far</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{seasonStats.total_goals}</span>
                      </div>
                    </div>
                  </div>

                  {/* Active Season Information */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Current Season Info
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Teams</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{teams.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Active Players</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{seasonStats.total_players}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Completion</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{completionPercentage.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Status</span>
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-xs font-medium">
                          Active
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Season Status Message */}
                <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800 rounded-xl p-6 text-center">
                  <Play className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                    Season Currently Active
                  </h3>
                  <p className="text-green-800 dark:text-green-200 text-sm">
                    Statistics are updated automatically as matches are completed. 
                    View the standings tab for current league positions and the matches tab for upcoming fixtures.
                  </p>
                </div>
              </>
            )}
          </div>
        );

      case 'management':
        return (
          <div className="space-y-8">
            {/* Season Management Tools */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600" />
                Season Management
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <Calendar className="w-5 h-5 text-blue-600 mb-2" />
                  <div className="font-medium text-gray-900 dark:text-white">Schedule Matches</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Manage fixture scheduling</div>
                </button>
                <button className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <Users className="w-5 h-5 text-green-600 mb-2" />
                  <div className="font-medium text-gray-900 dark:text-white">Team Registration</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Manage team memberships</div>
                </button>
                <button className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <Trophy className="w-5 h-5 text-yellow-600 mb-2" />
                  <div className="font-medium text-gray-900 dark:text-white">Match Results</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Update scores and results</div>
                </button>
                <button className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <Bell className="w-5 h-5 text-purple-600 mb-2" />
                  <div className="font-medium text-gray-900 dark:text-white">Notifications</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Manage alerts and updates</div>
                </button>
                <button className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <Target className="w-5 h-5 text-red-600 mb-2" />
                  <div className="font-medium text-gray-900 dark:text-white">Player Stats</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Update player statistics</div>
                </button>
                <button className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <Settings className="w-5 h-5 text-gray-600 mb-2" />
                  <div className="font-medium text-gray-900 dark:text-white">Season Settings</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Configure season rules</div>
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Quick Actions
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Generate Fixtures</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Create remaining match schedule</div>
                  </div>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Generate
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Export Current Standings</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Download current league table</div>
                  </div>
                  <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                    Export
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Send Notifications</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Notify teams of upcoming matches</div>
                  </div>
                  <button className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors">
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <SeasonDashboardLayout
      activeTab={activeTab}
      onTabChange={(tab) => setActiveTab(tab as any)}
      availableTabs={availableTabs}
      title="Active Season - Live Dashboard"
    >
      {renderContent()}
    </SeasonDashboardLayout>
  );
}
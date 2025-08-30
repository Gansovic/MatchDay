/**
 * League Details Page
 * 
 * Comprehensive league page showing:
 * - Full league standings with detailed stats
 * - Recent matches across the league
 * - Upcoming fixtures
 * - League statistics (top scorers, assists, etc.)
 * - League information and rules
 * 
 * Connected to real Supabase database
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  ArrowLeft,
  Trophy,
  Calendar,
  Users,
  Target,
  Shield,
  Star,
  Clock,
  MapPin,
  TrendingUp,
  Award,
  Info,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { LeagueService } from '@/lib/services/league.service';
import { LeagueDiscovery, LeagueStanding, Match, PlayerLeaderboard } from '@/lib/types/database.types';
import { SeasonSelector, Season } from '@/components/leagues/season-selector';
import { LeagueStandings } from '@/components/leagues/league-standings';

interface LeagueMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  venue: string;
  homeScore?: number;
  awayScore?: number;
  status: 'completed' | 'upcoming';
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
  league: boolean;
  standings: boolean;
  matches: boolean;
  stats: boolean;
}

interface ErrorStates {
  league: string | null;
  standings: string | null;
  matches: string | null;
  stats: string | null;
}

export default function LeaguePage() {
  const params = useParams();
  const leagueId = params.leagueId as string;
  const [activeTab, setActiveTab] = useState<'standings' | 'matches' | 'stats' | 'info'>('standings');
  
  // State for real data
  const [leagueData, setLeagueData] = useState<LeagueDiscovery | null>(null);
  const [allSeasons, setAllSeasons] = useState<Season[]>([]);
  const [currentSeason, setCurrentSeason] = useState<Season | null>(null);
  const [standings, setStandings] = useState<LeagueStanding[]>([]);
  const [matches, setMatches] = useState<LeagueMatch[]>([]);
  const [playerStats, setPlayerStats] = useState<{
    topScorers: PlayerStat[];
    topAssists: PlayerStat[];
    cleanSheets: PlayerStat[];
  }>({ topScorers: [], topAssists: [], cleanSheets: [] });
  
  // Loading and error states
  const [loading, setLoading] = useState<LoadingStates>({
    league: true,
    standings: true,
    matches: true,
    stats: true
  });
  
  const [errors, setErrors] = useState<ErrorStates>({
    league: null,
    standings: null,
    matches: null,
    stats: null
  });
  
  // Initialize services
  const leagueService = LeagueService.getInstance(supabase);
  const isInitialMount = useRef(true);

  // Fetch league details - wrapped in useCallback with minimal dependencies
  const fetchLeagueDetails = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, league: true }));
      setErrors(prev => ({ ...prev, league: null }));
      
      const response = await leagueService.getLeagueDetails(leagueId);
      
      if (response.success && response.data) {
        setLeagueData(response.data);
      } else {
        setErrors(prev => ({ ...prev, league: response.error?.message || 'Failed to load league details' }));
      }
    } catch (error) {
      console.error('Error fetching league details:', error);
      setErrors(prev => ({ ...prev, league: 'An unexpected error occurred' }));
    } finally {
      setLoading(prev => ({ ...prev, league: false }));
    }
  }, [leagueId]);
  
  // Fetch league standings - wrapped in useCallback with minimal dependencies
  const fetchLeagueStandings = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, standings: true }));
      setErrors(prev => ({ ...prev, standings: null }));
      
      // For now, return empty standings since the view doesn't exist yet
      // TODO: Create league_standings view or calculate from matches
      setStandings([]);
    } catch (error) {
      console.error('Error fetching standings:', error);
      setErrors(prev => ({ ...prev, standings: 'Failed to load standings' }));
    } finally {
      setLoading(prev => ({ ...prev, standings: false }));
    }
  }, [leagueId]);
  
  // Fetch league matches - accepts season parameter to avoid dependency
  const fetchLeagueMatches = useCallback(async (seasonId?: string) => {
    try {
      setLoading(prev => ({ ...prev, matches: true }));
      setErrors(prev => ({ ...prev, matches: null }));
      
      // Use our API endpoint instead of direct Supabase
      const baseUrl = typeof window !== 'undefined' 
        ? window.location.origin 
        : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';
      
      const matchesUrl = seasonId 
        ? `${baseUrl}/api/leagues/${leagueId}/matches?season_id=${seasonId}`
        : `${baseUrl}/api/leagues/${leagueId}/matches`;
      
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
      
      // Transform matches to expected format
      const transformedMatches: LeagueMatch[] = (apiResult.data || []).map((match: any) => ({
        id: match.id,
        homeTeam: match.home_team?.name || 'Unknown Team',
        awayTeam: match.away_team?.name || 'Unknown Team',
        date: match.scheduled_date,
        venue: match.venue || 'TBD',
        homeScore: match.home_score || undefined,
        awayScore: match.away_score || undefined,
        status: match.status === 'completed' ? 'completed' : 'upcoming',
        round: match.match_day || undefined
      }));
      
      setMatches(transformedMatches);
    } catch (error) {
      console.error('Error fetching matches:', error);
      setErrors(prev => ({ ...prev, matches: 'Failed to load matches' }));
    } finally {
      setLoading(prev => ({ ...prev, matches: false }));
    }
  }, [leagueId]);
  
  // Fetch player stats - wrapped in useCallback with minimal dependencies
  const fetchPlayerStats = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, stats: true }));
      setErrors(prev => ({ ...prev, stats: null }));
      
      // For now, return empty player stats since the view doesn't exist yet
      // TODO: Create player_leaderboard view or calculate from player_stats table
      setPlayerStats({ 
        topScorers: [], 
        topAssists: [], 
        cleanSheets: [] 
      });
    } catch (error) {
      console.error('Error fetching player stats:', error);
      setErrors(prev => ({ ...prev, stats: 'Failed to load player statistics' }));
    } finally {
      setLoading(prev => ({ ...prev, stats: false }));
    }
  }, []);

  // Fetch current season - returns the season data
  const fetchCurrentSeason = useCallback(async () => {
    try {
      const baseUrl = typeof window !== 'undefined' 
        ? window.location.origin 
        : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';
      
      const response = await fetch(`${baseUrl}/api/leagues/${leagueId}/seasons`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data && result.data.length > 0) {
          setAllSeasons(result.data);
          // Find current season or use first active season
          const current = result.data.find((season: Season) => season.is_current) || result.data[0];
          setCurrentSeason(current);
          return current;
        }
      }
      return null;
    } catch (error) {
      console.error('Error fetching seasons:', error);
      return null;
    }
  }, [leagueId]);

  // Initial data load - only runs once on mount
  useEffect(() => {
    const loadInitialData = async () => {
      // Fetch league details, standings, and stats in parallel
      const [, , , season] = await Promise.all([
        fetchLeagueDetails(),
        fetchLeagueStandings(),
        fetchPlayerStats(),
        fetchCurrentSeason()
      ]);
      
      // Fetch matches for the current season if we have one
      if (season) {
        await fetchLeagueMatches(season.id);
      }
    };
    
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run on mount

  // Handle season changes (manually by user only)
  const handleSeasonChange = useCallback((season: Season) => {
    setCurrentSeason(season);
    // Fetch matches for new season
    fetchLeagueMatches(season.id);
  }, [fetchLeagueMatches]);

  // Helper function to format date consistently on server and client
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

  // Helper function to format date only (no time)
  const formatDateOnly = (dateString: string) => {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getUTCMonth()];
    const day = date.getUTCDate();
    const year = date.getUTCFullYear();
    return `${month} ${day}, ${year}`;
  };

  // Derived data for rendering
  const recentMatches = matches.filter(m => m.status === 'completed').slice(0, 8);
  const upcomingMatches = matches.filter(m => m.status === 'upcoming').slice(0, 8);

  // Loading states check
  const isLoading = loading.league || loading.standings || loading.matches || loading.stats;
  const hasAnyError = errors.league || errors.standings || errors.matches || errors.stats;
  
  // Show loading spinner while fetching initial data
  if (loading.league) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600 dark:text-gray-400">Loading league details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Show error if league not found
  if (errors.league) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Link 
              href="/leagues"
              className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Leagues
            </Link>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">League Not Found</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{errors.league}</p>
            <Link 
              href="/leagues"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Leagues
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  if (!leagueData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link 
            href="/leagues"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Leagues
          </Link>
        </div>

        {/* League Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {leagueData.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
                {leagueData.description || 'Professional football league'}
              </p>
              <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Trophy className="w-4 h-4" />
                  {currentSeason ? currentSeason.display_name : (leagueData.season || new Date().getFullYear())} Season
                </span>
                {currentSeason && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDateOnly(currentSeason.start_date)} - {formatDateOnly(currentSeason.end_date)}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {leagueData.teamCount} Teams
                </span>
                {currentSeason && currentSeason.stats && (
                  <span className="flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    {currentSeason.stats.completed_matches} of {currentSeason.stats.total_matches} Matches
                  </span>
                )}
                {leagueData.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {leagueData.location}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {leagueData.playerCount}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Players</div>
            </div>
          </div>
        </div>

        {/* Season Selector */}
        {allSeasons.length > 0 && currentSeason && (
          <div className="mb-6">
            <SeasonSelector
              seasons={allSeasons}
              currentSeason={currentSeason}
              onSeasonChange={handleSeasonChange}
            />
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('standings')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'standings'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  Standings
                </div>
              </button>
              <button
                onClick={() => setActiveTab('matches')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'matches'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Matches
                </div>
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'stats'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Statistics
                </div>
              </button>
              <button
                onClick={() => setActiveTab('info')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'info'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  League Info
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'standings' && (
          <LeagueStandings 
            leagueId={leagueId}
            leagueName={leagueData?.name}
            currentSeasonId={currentSeason?.id}
            promotionSpots={3}
            relegationSpots={2}
          />
        )}

        {activeTab === 'matches' && (
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
                {/* Recent Matches */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Recent Matches
                    </h3>
                    <Award className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="space-y-4">
                    {recentMatches.length === 0 ? (
                      <div className="text-center py-8">
                        <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600 dark:text-gray-400">No recent matches available</p>
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
                                <div className="text-xs text-gray-500">Full Time</div>
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
                    <Clock className="w-5 h-5 text-gray-400" />
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
                            <div className="text-sm text-gray-500">Upcoming</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-8">
            {loading.stats ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600 dark:text-gray-400">Loading player statistics...</span>
              </div>
            ) : errors.stats ? (
              <div className="text-center py-8">
                <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-red-600 dark:text-red-400">{errors.stats}</p>
              </div>
            ) : (
              <>            
                {/* Player Statistics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                  {/* Top Scorers */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Top Scorers
                      </h3>
                      <Target className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="space-y-4">
                      {playerStats.topScorers.length === 0 ? (
                        <div className="text-center py-4">
                          <Target className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">No scoring data available</p>
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
                                  {player.team} • {player.position}
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

                  {/* Top Assists */}
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
                          <p className="text-sm text-gray-600 dark:text-gray-400">No assist data available</p>
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
                                  {player.team} • {player.position}
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
                          <p className="text-sm text-gray-600 dark:text-gray-400">No goalkeeper data available</p>
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
                                  {player.team} • {player.position}
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
              </>
            )}
          </div>
        )}

        {activeTab === 'info' && (
          <div className="space-y-8">
            {/* League Information */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  League Information
                </h3>
                <Info className="w-5 h-5 text-gray-400" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {new Date(leagueData.created_at).getFullYear()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Founded</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {leagueData.teamCount}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Teams</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {leagueData.playerCount}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Players</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {leagueData.availableSpots}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Available Spots</div>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {leagueData.description || 'A competitive football league bringing together teams for exciting matches and fair competition.'}
              </p>
            </div>

            {/* League Details */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                League Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">League Type</h4>
                  <p className="text-gray-600 dark:text-gray-400 capitalize">{leagueData.league_type}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Sport</h4>
                  <p className="text-gray-600 dark:text-gray-400 capitalize">{leagueData.sport_type}</p>
                </div>
                {leagueData.season_start && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Season Start</h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      {formatDateOnly(leagueData.season_start)}
                    </p>
                  </div>
                )}
                {leagueData.season_end && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Season End</h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      {formatDateOnly(leagueData.season_end)}
                    </p>
                  </div>
                )}
                {leagueData.max_teams && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Maximum Teams</h4>
                    <p className="text-gray-600 dark:text-gray-400">{leagueData.max_teams}</p>
                  </div>
                )}
                {leagueData.entry_fee && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Entry Fee</h4>
                    <p className="text-gray-600 dark:text-gray-400">${leagueData.entry_fee}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Teams in League */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Teams in League
              </h3>
              {leagueData.teams && leagueData.teams.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {leagueData.teams.map((team) => (
                    <div key={team.id} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                      <div className="flex items-center gap-3">
                        {team.team_color && (
                          <div 
                            className="w-4 h-4 rounded-full border border-gray-300"
                            style={{ backgroundColor: team.team_color }}
                          ></div>
                        )}
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{team.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {team.is_recruiting ? 'Recruiting' : 'Full'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 dark:text-gray-400">No teams in this league yet</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
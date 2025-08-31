/**
 * Season Details Page
 * 
 * Focused view of a specific season within a league showing:
 * - Season-specific standings with detailed stats
 * - Season matches (recent and upcoming)
 * - Season statistics (top scorers, assists, etc.)
 * - Season information and teams
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
import { LeagueDiscovery, LeagueStanding, PlayerLeaderboard } from '@/lib/types/database.types';
import { SeasonSelector, Season } from '@/components/leagues/season-selector';
import { LeagueStandings, Match } from '@/components/leagues/league-standings';

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
  season: boolean;
  standings: boolean;
  matches: boolean;
  stats: boolean;
}

interface ErrorStates {
  league: string | null;
  season: string | null;
  standings: string | null;
  matches: string | null;
  stats: string | null;
}

export default function SeasonDetailsPage() {
  const params = useParams();
  const leagueId = params.leagueId as string;
  const seasonId = params.seasonId as string;
  const [activeTab, setActiveTab] = useState<'standings' | 'matches' | 'stats' | 'info'>('standings');
  
  // State for real data
  const [leagueData, setLeagueData] = useState<LeagueDiscovery | null>(null);
  const [currentSeason, setCurrentSeason] = useState<Season | null>(null);
  const [allSeasons, setAllSeasons] = useState<Season[]>([]);
  const [matches, setMatches] = useState<LeagueMatch[]>([]);
  const [standingsMatches, setStandingsMatches] = useState<Match[]>([]); // For LeagueStandings component
  const [playerStats, setPlayerStats] = useState<{
    topScorers: PlayerStat[];
    topAssists: PlayerStat[];
    cleanSheets: PlayerStat[];
  }>({ topScorers: [], topAssists: [], cleanSheets: [] });
  
  // Loading and error states
  const [loading, setLoading] = useState<LoadingStates>({
    league: true,
    season: true,
    standings: false,
    matches: true,
    stats: true
  });
  
  const [errors, setErrors] = useState<ErrorStates>({
    league: null,
    season: null,
    standings: null,
    matches: null,
    stats: null
  });
  
  // Initialize services
  const leagueService = LeagueService.getInstance(supabase);

  // Fetch league details
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

  // Fetch season details
  const fetchSeasonDetails = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, season: true }));
      setErrors(prev => ({ ...prev, season: null }));
      
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
          // Find the current season by ID
          const season = result.data.find((s: Season) => s.id === seasonId);
          if (season) {
            setCurrentSeason(season);
          } else {
            setErrors(prev => ({ ...prev, season: 'Season not found' }));
          }
        }
      } else {
        setErrors(prev => ({ ...prev, season: 'Failed to load season details' }));
      }
    } catch (error) {
      console.error('Error fetching season details:', error);
      setErrors(prev => ({ ...prev, season: 'An unexpected error occurred' }));
    } finally {
      setLoading(prev => ({ ...prev, season: false }));
    }
  }, [leagueId, seasonId]);
  
  // Fetch season matches
  const fetchSeasonMatches = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, matches: true }));
      setErrors(prev => ({ ...prev, matches: null }));
      
      const baseUrl = typeof window !== 'undefined' 
        ? window.location.origin 
        : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';
      
      const matchesUrl = `${baseUrl}/api/leagues/${leagueId}/matches?season_id=${seasonId}`;
      
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
        date: match.scheduled_date,
        venue: match.venue || 'TBD',
        homeScore: match.home_score || undefined,
        awayScore: match.away_score || undefined,
        status: match.status === 'completed' ? 'completed' : 'upcoming',
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
        match_date: match.scheduled_date,
        venue: match.venue || 'TBD',
        created_at: match.created_at,
        updated_at: match.updated_at
      }));
      
      setMatches(transformedMatches);
      setStandingsMatches(standingsFormatMatches);
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
      
      // For now, return empty player stats since the view doesn't exist yet
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

  // Initial data load
  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([
        fetchLeagueDetails(),
        fetchSeasonDetails(),
        fetchPlayerStats()
      ]);
      
      // Fetch matches after we have season info
      await fetchSeasonMatches();
    };
    
    loadInitialData();
  }, [fetchLeagueDetails, fetchSeasonDetails, fetchSeasonMatches, fetchPlayerStats]);

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
  const isLoading = loading.league || loading.season;
  const hasAnyError = errors.league || errors.season;
  
  // Show loading spinner while fetching initial data
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600 dark:text-gray-400">Loading season details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Show error if league or season not found
  if (hasAnyError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Link 
              href={`/leagues/${leagueId}`}
              className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to League
            </Link>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {errors.league ? 'League Not Found' : 'Season Not Found'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {errors.league || errors.season}
            </p>
            <Link 
              href={`/leagues/${leagueId}`}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to League
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  if (!leagueData || !currentSeason) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link 
            href={`/leagues/${leagueId}`}
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {leagueData.name}
          </Link>
        </div>

        {/* Season Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {leagueData.name} - {currentSeason.display_name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
                {leagueData.description || 'Professional football league'}
              </p>
              <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Trophy className="w-4 h-4" />
                  {currentSeason.display_name}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDateOnly(currentSeason.start_date)} - {formatDateOnly(currentSeason.end_date)}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {leagueData.teamCount} Teams
                </span>
                {currentSeason.stats && (
                  <span className="flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    {currentSeason.stats.completed_matches} of {currentSeason.stats.total_matches} Matches
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Season Selector */}
        {allSeasons.length > 1 && (
          <div className="mb-6">
            <SeasonSelector
              seasons={allSeasons}
              currentSeason={currentSeason}
              onSeasonChange={(season) => {
                // Navigate to the new season
                window.location.href = `/leagues/${leagueId}/seasons/${season.id}`;
              }}
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
                  Season Info
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
            matches={standingsMatches}
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

        {activeTab === 'info' && currentSeason && (
          <div className="space-y-8">
            {/* Season Information */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Season Information
                </h3>
                <Info className="w-5 h-5 text-gray-400" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {new Date(currentSeason.start_date).getFullYear()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Season Year</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {leagueData.teamCount}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Teams</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {currentSeason.stats?.completed_matches || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {currentSeason.stats?.total_matches || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Matches</div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Season Start</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {formatDateOnly(currentSeason.start_date)}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Season End</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {formatDateOnly(currentSeason.end_date)}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Status</h4>
                  <p className="text-gray-600 dark:text-gray-400 capitalize">
                    {currentSeason.is_current ? 'Current Season' : 'Past Season'}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">League Type</h4>
                  <p className="text-gray-600 dark:text-gray-400 capitalize">{leagueData.league_type}</p>
                </div>
              </div>
            </div>

            {/* Teams in Season */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Teams in Season
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
                  <p className="text-gray-600 dark:text-gray-400">No teams in this season yet</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
/**
 * League Dashboard Page
 * 
 * Clean overview page for a specific league showing:
 * - League information and current season summary
 * - Navigation cards to different seasons  
 * - Quick stats and recent activity
 * - Easy access to season-specific details
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  ArrowLeft,
  Trophy,
  Calendar,
  Users,
  Target,
  MapPin,
  Clock,
  TrendingUp,
  Award,
  Loader2,
  AlertCircle,
  ChevronRight,
  Activity,
  BarChart3,
  Play,
  Settings
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { LeagueService } from '@/lib/services/league.service';
import { LeagueDiscovery } from '@/lib/types/database.types';
import { Season } from '@/components/leagues/season-selector';

interface LeagueDashboardData {
  league: LeagueDiscovery;
  seasons: Season[];
  currentSeason: Season | null;
  recentActivity: {
    totalMatches: number;
    completedMatches: number;
    upcomingMatches: number;
    totalGoals: number;
  };
}

interface LoadingStates {
  league: boolean;
  seasons: boolean;
  activity: boolean;
}

interface ErrorStates {
  league: string | null;
  seasons: string | null;
  activity: string | null;
}

export default function LeagueDashboardPage() {
  const params = useParams();
  const leagueId = params.leagueId as string;
  
  const [dashboardData, setDashboardData] = useState<LeagueDashboardData | null>(null);
  const [loading, setLoading] = useState<LoadingStates>({
    league: true,
    seasons: true,
    activity: true
  });
  const [errors, setErrors] = useState<ErrorStates>({
    league: null,
    seasons: null,
    activity: null
  });
  
  // Initialize services
  const leagueService = LeagueService.getInstance(supabase);

  // Fetch league details
  const fetchLeagueDetails = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, league: true }));
      setErrors(prev => ({ ...prev, league: null }));
      
      const response = await fetch(`/api/leagues/${leagueId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          return result.data;
        } else {
          setErrors(prev => ({ ...prev, league: result.error || 'Failed to load league details' }));
          return null;
        }
      } else {
        setErrors(prev => ({ ...prev, league: `HTTP ${response.status}: Failed to load league` }));
        return null;
      }
    } catch (error) {
      console.error('Error fetching league details:', error);
      setErrors(prev => ({ ...prev, league: 'An unexpected error occurred' }));
      return null;
    } finally {
      setLoading(prev => ({ ...prev, league: false }));
    }
  }, [leagueId]);

  // Fetch seasons
  const fetchSeasons = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, seasons: true }));
      setErrors(prev => ({ ...prev, seasons: null }));
      
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
        if (result.success) {
          return result.data || [];
        }
      }
      setErrors(prev => ({ ...prev, seasons: 'Failed to load seasons' }));
      return [];
    } catch (error) {
      console.error('Error fetching seasons:', error);
      setErrors(prev => ({ ...prev, seasons: 'An unexpected error occurred' }));
      return [];
    } finally {
      setLoading(prev => ({ ...prev, seasons: false }));
    }
  }, [leagueId]);

  // Fetch recent activity stats
  const fetchRecentActivity = useCallback(async (seasons: Season[]) => {
    try {
      setLoading(prev => ({ ...prev, activity: true }));
      setErrors(prev => ({ ...prev, activity: null }));
      
      // Get current season matches for activity stats
      const currentSeason = seasons.find(s => s.is_current) || seasons[0];
      if (!currentSeason) {
        return { totalMatches: 0, completedMatches: 0, upcomingMatches: 0, totalGoals: 0 };
      }

      const baseUrl = typeof window !== 'undefined' 
        ? window.location.origin 
        : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';
      
      const response = await fetch(`${baseUrl}/api/leagues/${leagueId}/matches?season_id=${currentSeason.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const matches = result.data;
          const completedMatches = matches.filter((m: any) => m.status === 'completed');
          const upcomingMatches = matches.filter((m: any) => m.status !== 'completed');
          const totalGoals = completedMatches.reduce((sum: number, match: any) => {
            return sum + (match.home_score || 0) + (match.away_score || 0);
          }, 0);

          return {
            totalMatches: matches.length,
            completedMatches: completedMatches.length,
            upcomingMatches: upcomingMatches.length,
            totalGoals
          };
        }
      }
      
      return { totalMatches: 0, completedMatches: 0, upcomingMatches: 0, totalGoals: 0 };
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      setErrors(prev => ({ ...prev, activity: 'Failed to load activity data' }));
      return { totalMatches: 0, completedMatches: 0, upcomingMatches: 0, totalGoals: 0 };
    } finally {
      setLoading(prev => ({ ...prev, activity: false }));
    }
  }, [leagueId]);

  // Load all dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      const [leagueData, seasonsData] = await Promise.all([
        fetchLeagueDetails(),
        fetchSeasons()
      ]);

      if (leagueData && seasonsData) {
        const activityData = await fetchRecentActivity(seasonsData);
        const currentSeason = seasonsData.find((s: Season) => s.is_current) || seasonsData[0] || null;

        setDashboardData({
          league: leagueData,
          seasons: seasonsData,
          currentSeason,
          recentActivity: activityData
        });
      }
    };
    
    loadDashboardData();
  }, [fetchLeagueDetails, fetchSeasons, fetchRecentActivity]);

  // Helper function to format date
  const formatDateOnly = (dateString: string) => {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getUTCMonth()];
    const day = date.getUTCDate();
    const year = date.getUTCFullYear();
    return `${month} ${day}, ${year}`;
  };

  // Loading states check
  const isLoading = loading.league || loading.seasons;
  const hasAnyError = errors.league || errors.seasons;
  
  // Show loading spinner while fetching initial data
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600 dark:text-gray-400">Loading league dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Show error if league not found
  if (hasAnyError) {
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
            <p className="text-gray-600 dark:text-gray-400 mb-4">{errors.league || errors.seasons}</p>
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
  
  if (!dashboardData) {
    return null;
  }

  const { league, seasons, currentSeason, recentActivity } = dashboardData;

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
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {league.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
                {league.description || 'Professional football league'}
              </p>
              <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Trophy className="w-4 h-4" />
                  {currentSeason ? currentSeason.display_name : `${new Date().getFullYear()} Season`}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {league.teamCount} Teams
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {seasons.length} Seasons
                </span>
                {league.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {league.location}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {league.playerCount}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Players</div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{recentActivity.totalMatches}</div>
                  <div className="text-sm opacity-90">Total Matches</div>
                </div>
                <Calendar className="w-8 h-8 opacity-80" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{recentActivity.completedMatches}</div>
                  <div className="text-sm opacity-90">Completed</div>
                </div>
                <Award className="w-8 h-8 opacity-80" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{recentActivity.upcomingMatches}</div>
                  <div className="text-sm opacity-90">Upcoming</div>
                </div>
                <Clock className="w-8 h-8 opacity-80" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{recentActivity.totalGoals}</div>
                  <div className="text-sm opacity-90">Goals Scored</div>
                </div>
                <Target className="w-8 h-8 opacity-80" />
              </div>
            </div>
          </div>
        </div>

        {/* Current Season Highlight */}
        {currentSeason && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 mb-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold mb-2">Current Season: {currentSeason.display_name}</h2>
                <p className="opacity-90 mb-4">
                  {formatDateOnly(currentSeason.start_date)} - {formatDateOnly(currentSeason.end_date)}
                </p>
                <div className="flex items-center gap-4 text-sm">
                  {currentSeason.stats && (
                    <>
                      <span className="flex items-center gap-1">
                        <Activity className="w-4 h-4" />
                        {currentSeason.stats.completed_matches} of {currentSeason.stats.total_matches} matches
                      </span>
                      <span className="flex items-center gap-1">
                        <BarChart3 className="w-4 h-4" />
                        {Math.round((currentSeason.stats.completed_matches / currentSeason.stats.total_matches) * 100)}% complete
                      </span>
                    </>
                  )}
                </div>
              </div>
              <Link
                href={`/leagues/${leagueId}/seasons/${currentSeason.id}`}
                className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                View Season Details
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* All Seasons */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">All Seasons</h2>
            <div className="flex items-center gap-3">
              <Link
                href={`/leagues/${leagueId}/seasons`}
                className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4" />
                Manage Seasons
              </Link>
              <Trophy className="w-5 h-5 text-gray-400" />
            </div>
          </div>
          
          {seasons.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 dark:text-gray-400">No seasons available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {seasons.map((season) => (
                <Link
                  key={season.id}
                  href={`/leagues/${leagueId}/seasons/${season.id}`}
                  className="block p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {season.display_name}
                    </h3>
                    {season.is_current && (
                      <span className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-xs px-2 py-1 rounded-full font-medium">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {formatDateOnly(season.start_date)} - {formatDateOnly(season.end_date)}
                  </p>
                  {season.stats && (
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>{season.stats.completed_matches} matches</span>
                      <span>{season.stats.total_matches} total</span>
                    </div>
                  )}
                  <div className="mt-3 flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium group-hover:text-blue-700 dark:group-hover:text-blue-300">
                    View Details
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
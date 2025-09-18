/**
 * Individual League Dashboard Page
 * 
 * Comprehensive league management interface for admins to manage
 * all aspects of a specific league including teams, requests, and statistics.
 */

'use client';

import React, { useState, useEffect, use, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/auth-provider';
import {
  Trophy,
  Users,
  MapPin,
  Settings,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Crown,
  Target,
  TrendingUp
} from 'lucide-react';
import { Season } from '@/lib/types/database.types';
import { LeagueService, LeagueDiscovery } from '@/lib/services/league.service';
import { supabase } from '@/lib/supabase/client';
import SeasonManagement from '@/components/leagues/season-management';

interface LeagueDashboardPageProps {
  params: Promise<{
    leagueId: string;
  }>;
}

interface LeagueData extends LeagueDiscovery {
  league_type?: string; // Optional since it might not be in LeagueDiscovery
}

interface LoadingStates {
  league: boolean;
  seasons: boolean;
  pendingRequests: boolean;
  stats: boolean;
}

interface ErrorStates {
  league: string | null;
  seasons: string | null;
  pendingRequests: string | null;
  stats: string | null;
}

interface LeagueStats {
  totalTeams: number;
  totalPlayers: number;
  availableSpots: number;
  activeSeasons: number;
}

interface PendingRequestsData {
  count: number;
  requests: any[];
}

export default function LeagueDashboardPage({ params }: LeagueDashboardPageProps) {
  const { leagueId } = use(params);
  const { user } = useAuth();
  const [leagueData, setLeagueData] = useState<LeagueData | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [leagueStats, setLeagueStats] = useState<LeagueStats | null>(null);
  const [pendingRequests, setPendingRequests] = useState<PendingRequestsData | null>(null);
  const [loading, setLoading] = useState<LoadingStates>({
    league: true,
    seasons: true,
    pendingRequests: true,
    stats: true
  });
  const [errors, setErrors] = useState<ErrorStates>({
    league: null,
    seasons: null,
    pendingRequests: null,
    stats: null
  });

  // Initialize LeagueService
  const leagueService = LeagueService.getInstance(supabase);

  // Fetch basic league details (no teams data)
  const fetchLeagueDetails = useCallback(async () => {
    console.log(`Admin App: Starting fetchLeagueDetails for ${leagueId}`);

    try {
      setLoading(prev => ({ ...prev, league: true }));
      setErrors(prev => ({ ...prev, league: null }));

      const response = await fetch(`/api/leagues/${leagueId}`);
      const result = await response.json();

      if (response.ok && result.success && result.data) {
        return {
          ...result.data,
          league_type: result.data.sport_type,
          // Don't use the teams data from API for stats - we'll calculate separately
          teamCount: 0,
          playerCount: 0,
          teams: []
        };
      } else {
        setErrors(prev => ({ ...prev, league: result.error || 'Failed to load league details' }));
        return null;
      }
    } catch (error) {
      console.error('Admin App: Error fetching league details:', error);
      setErrors(prev => ({ ...prev, league: 'An unexpected error occurred' }));
      return null;
    } finally {
      setLoading(prev => ({ ...prev, league: false }));
    }
  }, [leagueId]);

  // Fetch seasons using the admin app's API
  const fetchSeasons = useCallback(async () => {
    const apiUrl = `/api/leagues/${leagueId}/seasons`;
    console.log(`Admin App: Starting fetchSeasons for ${leagueId}`);

    try {
      setLoading(prev => ({ ...prev, seasons: true }));
      setErrors(prev => ({ ...prev, seasons: null }));

      console.log(`Admin App: Making API call to ${apiUrl}`);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log(`Admin App: Seasons API response status:`, response.status, `URL: ${apiUrl}`);

      if (response.ok) {
        const result = await response.json();
        console.log(`Admin App: Seasons API result:`, {
          success: result.success,
          seasonsCount: result.data?.length || 0,
          seasons: result.data?.map((s: any) => ({ id: s.id, name: s.display_name || s.name })) || []
        });

        if (result.success) {
          return result.data || [];
        } else {
          setErrors(prev => ({ ...prev, seasons: 'Failed to load seasons' }));
          return [];
        }
      } else {
        setErrors(prev => ({ ...prev, seasons: `Failed to load seasons (${response.status}). The league may not have any seasons yet.` }));
        return [];
      }
    } catch (error) {
      console.error('Admin App: Network error fetching seasons:', error);
      setErrors(prev => ({ ...prev, seasons: 'Network error - please check your connection and try again' }));
      return [];
    } finally {
      setLoading(prev => ({ ...prev, seasons: false }));
    }
  }, [leagueId]);

  // Fetch pending season join requests
  const fetchPendingRequests = useCallback(async () => {
    console.log(`Admin App: Starting fetchPendingRequests for ${leagueId}`);

    try {
      setLoading(prev => ({ ...prev, pendingRequests: true }));
      setErrors(prev => ({ ...prev, pendingRequests: null }));

      const response = await fetch(`/api/leagues/${leagueId}/pending-requests`);
      const result = await response.json();

      console.log(`Admin App: Pending requests response:`, {
        success: result.success,
        count: result.data?.count,
        error: result.error
      });

      if (response.ok && result.success) {
        return result.data;
      } else {
        setErrors(prev => ({ ...prev, pendingRequests: result.error || 'Failed to load pending requests' }));
        return { count: 0, requests: [] };
      }
    } catch (error) {
      console.error('Admin App: Error fetching pending requests:', error);
      setErrors(prev => ({ ...prev, pendingRequests: 'An unexpected error occurred' }));
      return { count: 0, requests: [] };
    } finally {
      setLoading(prev => ({ ...prev, pendingRequests: false }));
    }
  }, [leagueId]);

  // Calculate league stats from seasons data
  const calculateLeagueStats = useCallback(async (seasonsData: Season[]) => {
    console.log(`Admin App: Starting calculateLeagueStats with ${seasonsData.length} seasons`);

    try {
      setLoading(prev => ({ ...prev, stats: true }));
      setErrors(prev => ({ ...prev, stats: null }));

      // Get active and recent seasons (not archived)
      const activeSeasons = seasonsData.filter(season =>
        season.status !== 'archived' && season.status !== 'draft'
      );

      let totalTeams = 0;
      let totalPlayers = 0;
      let availableSpots = 0;

      // For each active season, fetch teams data
      for (const season of activeSeasons) {
        try {
          const response = await fetch(`/api/leagues/${leagueId}/teams?season_id=${season.id}`);
          const result = await response.json();

          if (response.ok && result.success && result.data) {
            const seasonTeams = result.data;
            totalTeams += seasonTeams.length;

            // Count active players and available spots
            seasonTeams.forEach((team: any) => {
              const activeMembers = team.team_members?.filter((member: any) => member.is_active) || [];
              totalPlayers += activeMembers.length;

              const maxPlayers = team.max_players || 22;
              availableSpots += Math.max(0, maxPlayers - activeMembers.length);
            });
          }
        } catch (seasonError) {
          console.error(`Error fetching teams for season ${season.id}:`, seasonError);
        }
      }

      const stats: LeagueStats = {
        totalTeams,
        totalPlayers,
        availableSpots,
        activeSeasons: activeSeasons.length
      };

      console.log(`Admin App: Calculated league stats:`, stats);
      return stats;

    } catch (error) {
      console.error('Admin App: Error calculating league stats:', error);
      setErrors(prev => ({ ...prev, stats: 'Failed to calculate league statistics' }));
      return {
        totalTeams: 0,
        totalPlayers: 0,
        availableSpots: 0,
        activeSeasons: 0
      };
    } finally {
      setLoading(prev => ({ ...prev, stats: false }));
    }
  }, [leagueId]);

  // Load all dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      console.log(`Admin App: useEffect triggered for league ${leagueId}`);

      // Load basic data first
      const [leagueData, seasonsData, pendingRequestsData] = await Promise.all([
        fetchLeagueDetails(),
        fetchSeasons(),
        fetchPendingRequests()
      ]);

      if (leagueData) {
        setLeagueData(leagueData);
      }
      if (seasonsData) {
        setSeasons(seasonsData);
      }
      if (pendingRequestsData) {
        setPendingRequests(pendingRequestsData);
      }

      // Calculate stats after we have seasons data
      if (seasonsData && seasonsData.length > 0) {
        const statsData = await calculateLeagueStats(seasonsData);
        setLeagueStats(statsData);
      } else {
        setLeagueStats({
          totalTeams: 0,
          totalPlayers: 0,
          availableSpots: 0,
          activeSeasons: 0
        });
        setLoading(prev => ({ ...prev, stats: false }));
      }
    };

    loadDashboardData();
  }, [fetchLeagueDetails, fetchSeasons, fetchPendingRequests, calculateLeagueStats]);

  // Check loading states
  const isLoading = loading.league || loading.seasons;
  const hasLeagueError = errors.league !== null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading league dashboard...</p>
        </div>
      </div>
    );
  }

  if (hasLeagueError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error Loading League</h2>
          <p className="text-gray-400 mb-4">{errors.league}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <Link
              href="/leagues"
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
            >
              Back to Leagues
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!leagueData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">League Not Found</h2>
          <p className="text-gray-400 mb-4">The requested league could not be found.</p>
          <Link 
            href="/leagues"
            className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
          >
            Back to Leagues
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb Navigation */}
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
                {leagueData.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
                {leagueData.description || 'Professional football league'}
              </p>
              <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Trophy className="w-4 h-4" />
                  {leagueData.sport_type} • {leagueData.league_type}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {leagueData.teamCount} Teams
                </span>
                {leagueData.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {leagueData.location}
                  </span>
                )}
                <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                  leagueData.is_active
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                }`}>
                  {leagueData.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {leagueStats?.totalPlayers || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Players</div>
              <button className="mt-4 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm">
                <Settings className="w-4 h-4 inline mr-2" />
                Settings
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{leagueStats?.totalTeams || 0}</div>
                <div className="text-sm opacity-90">Teams</div>
              </div>
              <Users className="w-8 h-8 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{leagueStats?.totalPlayers || 0}</div>
                <div className="text-sm opacity-90">Players</div>
              </div>
              <Crown className="w-8 h-8 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{seasons.length}</div>
                <div className="text-sm opacity-90">Seasons</div>
              </div>
              <Target className="w-8 h-8 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{pendingRequests?.count || 0}</div>
                <div className="text-sm opacity-90">Pending Requests</div>
              </div>
              <TrendingUp className="w-8 h-8 opacity-80" />
            </div>
          </div>
        </div>

        {/* Season Management - Primary Content Area */}
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Season Management</h2>
                <p className="text-gray-600 dark:text-gray-400 text-lg">Manage all seasons and team registrations for this league</p>
              </div>
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white min-w-[120px] text-center">
                <div className="text-2xl font-bold">{seasons.length}</div>
                <div className="text-sm opacity-90">Total Seasons</div>
              </div>
            </div>

            {errors.seasons && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-600 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <p className="text-red-700 dark:text-red-300 text-sm">⚠️ {errors.seasons}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}

            <div className="min-h-[400px]">
              <SeasonManagement
                leagueId={leagueId}
                seasons={seasons}
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
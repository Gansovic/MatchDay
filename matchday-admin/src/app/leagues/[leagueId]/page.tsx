/**
 * Individual League Dashboard Page
 * 
 * Comprehensive league management interface for admins to manage
 * all aspects of a specific league including teams, requests, and statistics.
 */

'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/auth-provider';
import { 
  Trophy, 
  Users, 
  Calendar, 
  MapPin, 
  Settings,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  Filter,
  Plus,
  Crown,
  Target,
  TrendingUp
} from 'lucide-react';
import { Season } from '@/lib/types/database.types';
import { PendingRequestsCard } from '@/components/seasons/PendingRequestsCard';
import SeasonManagement from '@/components/leagues/season-management';

interface LeagueDashboardPageProps {
  params: Promise<{
    leagueId: string;
  }>;
}

interface LeagueData {
  id: string;
  name: string;
  description?: string;
  sport_type: string;
  league_type: string;
  location?: string;
  is_active: boolean;
  teamCount: number;
  playerCount: number;
  teams: any[];
}

interface LoadingStates {
  league: boolean;
  seasons: boolean;
}

interface ErrorStates {
  league: string | null;
  seasons: string | null;
}

export default function LeagueDashboardPage({ params }: LeagueDashboardPageProps) {
  const { leagueId } = use(params);
  const { user } = useAuth();
  const [leagueData, setLeagueData] = useState<LeagueData | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState<LoadingStates>({ league: true, seasons: true });
  const [errors, setErrors] = useState<ErrorStates>({ league: null, seasons: null });

  // Fetch league details using the admin app's API
  const fetchLeagueDetails = async () => {
    console.log(`Admin App: Starting fetchLeagueDetails for ${leagueId}`);

    try {
      setLoading(prev => ({ ...prev, league: true }));
      setErrors(prev => ({ ...prev, league: null }));

      console.log(`Admin App: Making API call to /api/leagues/${leagueId}`);

      const response = await fetch(`/api/leagues/${leagueId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log(`Admin App: API response status:`, response.status);

      if (response.ok) {
        const league = await response.json();
        console.log(`Admin App: League API result:`, {
          hasData: !!league,
          id: league?.id,
          name: league?.name
        });

        if (league && league.id) {
          // Transform the admin API response to match our expected format
          setLeagueData({
            id: league.id,
            name: league.name,
            description: league.description,
            sport_type: league.sport_type,
            league_type: league.league_type,
            location: league.location,
            is_active: league.is_active,
            teamCount: 0, // Will be updated when we implement teams
            playerCount: 0, // Will be updated when we implement teams
            teams: [] // Will be updated when we implement teams
          });
        } else {
          setErrors(prev => ({ ...prev, league: 'Invalid league data received' }));
        }
      } else {
        setErrors(prev => ({ ...prev, league: `HTTP ${response.status}: Failed to load league` }));
      }
    } catch (error) {
      console.error('Admin App: Error fetching league details:', error);
      setErrors(prev => ({ ...prev, league: 'An unexpected error occurred' }));
    } finally {
      setLoading(prev => ({ ...prev, league: false }));
    }
  };

  // Fetch seasons using the admin app's API
  const fetchSeasons = async () => {
    console.log(`Admin App: Starting fetchSeasons for ${leagueId}`);

    try {
      setLoading(prev => ({ ...prev, seasons: true }));
      setErrors(prev => ({ ...prev, seasons: null }));

      console.log(`Admin App: Making API call to /api/leagues/${leagueId}/seasons`);

      const response = await fetch(`/api/leagues/${leagueId}/seasons`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log(`Admin App: Seasons API response status:`, response.status);

      if (response.ok) {
        const result = await response.json();
        console.log(`Admin App: Seasons API result:`, {
          success: result.success,
          seasonsCount: result.data?.length || 0,
          seasons: result.data?.map((s: any) => ({ id: s.id, name: s.display_name || s.name })) || []
        });

        if (result.success) {
          setSeasons(result.data || []);
        } else {
          setErrors(prev => ({ ...prev, seasons: 'Failed to load seasons' }));
        }
      } else {
        setErrors(prev => ({ ...prev, seasons: `HTTP ${response.status}: Failed to load seasons` }));
      }
    } catch (error) {
      console.error('Admin App: Error fetching seasons:', error);
      setErrors(prev => ({ ...prev, seasons: 'An unexpected error occurred' }));
    } finally {
      setLoading(prev => ({ ...prev, seasons: false }));
    }
  };

  useEffect(() => {
    const loadData = async () => {
      console.log(`Admin App: useEffect triggered. User:`, user ? 'present' : 'null');

      if (!user) {
        console.log(`Admin App: No user, waiting...`);
        return;
      }

      try {
        console.log(`Admin App: User found, starting data fetch`);
        // Fetch both league and seasons data in parallel like the main app
        await Promise.all([
          fetchLeagueDetails(),
          fetchSeasons()
        ]);
      } catch (error) {
        console.error('Admin App: Error loading data:', error);
        // Ensure loading is turned off even if there's an error
        setLoading({ league: false, seasons: false });
      }
    };

    loadData();

    // Add a timeout fallback to prevent infinite loading
    const timeout = setTimeout(() => {
      console.log('Admin App: Timeout reached, forcing load attempt');
      if (!user) {
        console.log('Admin App: Still no user after timeout, loading anyway');
        // Try to load data even without user
        Promise.all([
          fetchLeagueDetails(),
          fetchSeasons()
        ]).catch(error => {
          console.error('Admin App: Timeout fallback failed:', error);
          setLoading({ league: false, seasons: false });
        });
      }
    }, 5000); // 5 second timeout

    return () => clearTimeout(timeout);
  }, [user, leagueId]);

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
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <Link 
            href="/leagues"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Leagues
          </Link>
        </div>

        {/* League Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {leagueData.name}
              </h1>
              <p className="text-gray-400 mb-4">
                {leagueData.description}
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="capitalize">{leagueData.sport_type} • {leagueData.league_type}</span>
                {leagueData.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {leagueData.location}
                  </span>
                )}
                <span className={`px-2 py-1 text-xs rounded-full ${
                  leagueData.is_active
                    ? 'bg-green-900/20 text-green-300'
                    : 'bg-gray-700 text-gray-400'
                }`}>
                  {leagueData.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-4 py-2 border border-gray-600 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors text-sm">
                <Settings className="w-4 h-4 inline mr-2" />
                Settings
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl font-bold text-white">{leagueData.teamCount}</div>
              <Users className="w-8 h-8 text-blue-400" />
            </div>
            <div className="text-sm text-gray-400">Teams</div>
          </div>

          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl font-bold text-white">{leagueData.playerCount}</div>
              <Crown className="w-8 h-8 text-yellow-400" />
            </div>
            <div className="text-sm text-gray-400">Players</div>
          </div>

          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl font-bold text-white">{seasons.length}</div>
              <Target className="w-8 h-8 text-green-400" />
            </div>
            <div className="text-sm text-gray-400">Seasons</div>
          </div>

          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl font-bold text-white">0</div>
              <TrendingUp className="w-8 h-8 text-orange-400" />
            </div>
            <div className="text-sm text-gray-400">Pending Requests</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Teams Grid */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">
                Teams ({leagueData.teams.length})
              </h2>
              <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors">
                <Plus className="w-4 h-4 inline mr-2" />
                Add Team
              </button>
            </div>

            {leagueData.teams.length === 0 ? (
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-12 text-center">
                <Users className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-300 mb-2">No teams yet</h3>
                <p className="text-gray-500 mb-6">Teams will appear here when they join the league</p>
              </div>
            ) : (
              <div className="space-y-4">
                {leagueData.teams.map((team) => (
                  <div key={team.id} className="bg-gray-900 border border-gray-700 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: team.team_color || '#374151' }}
                        >
                          <span className="text-white font-bold text-lg">
                            {team.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">{team.name}</h3>
                          <p className="text-sm text-gray-400">
                            {team.currentPlayers || 0} players
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 text-xs rounded-full bg-green-900/20 text-green-300">
                          Active
                        </span>
                        <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Requests & Recent Activity */}
          <div className="space-y-6">
            {/* Pending Requests */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">
                Pending Requests (0)
              </h2>

              {true ? (
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-8 text-center">
                  <CheckCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-300 mb-2">No pending requests</h3>
                  <p className="text-gray-500 text-sm">All caught up!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-500 text-center">No pending requests implementation yet</p>
                </div>
              )}
            </div>

            {/* Season Join Requests */}
            <div className="mb-6">
              <PendingRequestsCard leagueId={leagueId} />
            </div>

            {/* Season Management */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-4">Seasons</h2>
              {errors.seasons && (
                <div className="bg-red-900/20 border border-red-600 rounded-lg p-4 mb-4">
                  <p className="text-red-300 text-sm">⚠️ {errors.seasons}</p>
                </div>
              )}
              <SeasonManagement
                leagueId={leagueId}
                seasons={seasons}
              />
            </div>

            {/* Recent Activity */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>

              <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
                <div className="space-y-4">
                  <p className="text-gray-500 text-center py-4">No recent activity</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
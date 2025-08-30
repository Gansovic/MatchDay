/**
 * Individual League Dashboard Page
 * 
 * Comprehensive league management interface for admins to manage
 * all aspects of a specific league including teams, requests, and statistics.
 */

'use client';

import React, { useState, useEffect } from 'react';
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
import { LeagueDetailService, type LeagueDetailData } from '@/lib/services/league-detail.service';

interface LeagueDashboardPageProps {
  params: {
    leagueId: string;
  };
}

export default function LeagueDashboardPage({ params }: LeagueDashboardPageProps) {
  const { user } = useAuth();
  const [leagueData, setLeagueData] = useState<LeagueDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const leagueDetailService = LeagueDetailService.getInstance();

  useEffect(() => {
    const fetchLeagueData = async () => {
      if (!user) {
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        const result = await leagueDetailService.getLeagueDetails(params.leagueId, user.id);
        
        if (result.success && result.data) {
          setLeagueData(result.data);
        } else {
          setError(result.error?.message || 'Failed to load league data');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeagueData();
  }, [user, params.leagueId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading league dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error Loading League</h2>
          <p className="text-gray-400 mb-4">{error}</p>
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
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
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
    <div className="min-h-screen bg-gray-950 text-white p-6">
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
                {leagueData.league.name}
              </h1>
              <p className="text-gray-400 mb-4">
                {leagueData.league.description}
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="capitalize">{leagueData.league.sport_type} • {leagueData.league.league_type}</span>
                {leagueData.league.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {leagueData.league.location}
                  </span>
                )}
                <span className={`px-2 py-1 text-xs rounded-full ${
                  leagueData.league.is_active 
                    ? 'bg-green-900/20 text-green-300' 
                    : 'bg-gray-700 text-gray-400'
                }`}>
                  {leagueData.league.is_active ? 'Active' : 'Inactive'}
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
              <div className="text-2xl font-bold text-white">{leagueData.stats.totalTeams}</div>
              <Users className="w-8 h-8 text-blue-400" />
            </div>
            <div className="text-sm text-gray-400">Teams</div>
          </div>
          
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl font-bold text-white">{leagueData.stats.totalPlayers}</div>
              <Crown className="w-8 h-8 text-yellow-400" />
            </div>
            <div className="text-sm text-gray-400">Players</div>
          </div>
          
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl font-bold text-white">{leagueData.stats.totalMatches}</div>
              <Target className="w-8 h-8 text-green-400" />
            </div>
            <div className="text-sm text-gray-400">Matches</div>
          </div>
          
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl font-bold text-white">{leagueData.pendingRequests.length}</div>
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
                  <div key={team.team_id} className="bg-gray-900 border border-gray-700 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: team.team_color || '#374151' }}
                        >
                          <span className="text-white font-bold text-lg">
                            {team.team_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">{team.team_name}</h3>
                          <p className="text-sm text-gray-400">
                            {team.member_count} players • Joined {new Date(team.joined_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          team.is_active 
                            ? 'bg-green-900/20 text-green-300' 
                            : 'bg-gray-700 text-gray-400'
                        }`}>
                          {team.is_active ? 'Active' : 'Inactive'}
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
                Pending Requests ({leagueData.pendingRequests.length})
              </h2>
              
              {leagueData.pendingRequests.length === 0 ? (
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-8 text-center">
                  <CheckCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-300 mb-2">No pending requests</h3>
                  <p className="text-gray-500 text-sm">All caught up!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {leagueData.pendingRequests.slice(0, 5).map((request) => (
                    <div key={request.id} className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-white">{request.team.name}</h4>
                          <p className="text-sm text-gray-400">
                            Requested by: {request.requested_by_user?.full_name || request.requested_by_user?.email || 'Unknown'}
                          </p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(request.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      {request.message && (
                        <p className="text-sm text-gray-300 mb-4 p-2 bg-gray-800 rounded italic">
                          "{request.message}"
                        </p>
                      )}

                      <div className="flex gap-2">
                        <button className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors flex items-center justify-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Approve
                        </button>
                        <button className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors flex items-center justify-center gap-1">
                          <XCircle className="w-3 h-3" />
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {leagueData.pendingRequests.length > 5 && (
                    <div className="text-center">
                      <Link 
                        href={`/leagues/${params.leagueId}/requests`}
                        className="text-orange-400 hover:text-orange-300 text-sm"
                      >
                        View all {leagueData.pendingRequests.length} requests →
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
              
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
                <div className="space-y-4">
                  {leagueData.recentActivity.slice(0, 5).map((activity, index) => (
                    <div key={index} className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                      <span className="text-gray-300">{activity.description}</span>
                      <span className="text-gray-500 text-xs ml-auto">
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                  
                  {leagueData.recentActivity.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No recent activity</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
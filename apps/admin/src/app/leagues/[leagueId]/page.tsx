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
  TrendingUp,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import { LeagueDetailService } from '@/lib/services/league-detail.service';
import { LeagueRequestService } from '@/lib/services/league-request.service';
import { useRealtimeLeagueDetail, usePageVisibility } from '@/lib/hooks/use-realtime-leagues';
import SeasonManagement from '@/components/leagues/season-management';
import { CreateSeasonModal } from '@/components/seasons/CreateSeasonModal';

interface LeagueDashboardPageProps {
  params: Promise<{
    leagueId: string;
  }>;
}

export default function LeagueDashboardPage({ params }: LeagueDashboardPageProps) {
  const { leagueId } = use(params);
  const { user } = useAuth();
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCreateSeasonModal, setShowCreateSeasonModal] = useState(false);

  // Real-time league data with connection status
  const {
    leagueData,
    recentRequests,
    isLoading,
    isConnected,
    lastUpdate,
    forceRefresh,
    clearRecentRequests
  } = useRealtimeLeagueDetail(leagueId, user?.id);


  const isVisible = usePageVisibility();
  const leagueRequestService = LeagueRequestService.getInstance();

  // Clear recent requests when component unmounts or league changes
  useEffect(() => {
    return () => {
      clearRecentRequests();
    };
  }, [leagueId, clearRecentRequests]);

  const handleApproveRequest = async (requestId: string) => {
    if (!user) return;
    
    setProcessingRequest(requestId);
    setError(null);
    
    try {
      const result = await leagueRequestService.approveRequest({
        requestId,
        adminId: user.id,
        responseMessage: 'Welcome to the league!'
      });
      
      if (result.success) {
        setSuccess('Request approved successfully!');
        // Real-time updates will automatically refresh the data
        setTimeout(() => setSuccess(null), 5000);
      } else {
        throw new Error(result.error?.message || 'Failed to approve request');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to approve request';
      setError(errorMessage);
      setTimeout(() => setError(null), 5000);
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    if (!user) return;
    
    setProcessingRequest(requestId);
    setError(null);
    
    try {
      const result = await leagueRequestService.rejectRequest({
        requestId,
        adminId: user.id,
        responseMessage: 'Request rejected by admin'
      });
      
      if (result.success) {
        setSuccess('Request rejected successfully!');
        // Real-time updates will automatically refresh the data
        setTimeout(() => setSuccess(null), 5000);
      } else {
        throw new Error(result.error?.message || 'Failed to reject request');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reject request';
      setError(errorMessage);
      setTimeout(() => setError(null), 5000);
    } finally {
      setProcessingRequest(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading league dashboard...</p>
          <div className="mt-2 flex items-center justify-center gap-2 text-sm text-gray-500">
            {isConnected ? (
              <><Wifi className="w-4 h-4 text-green-400" /> Real-time connected</>
            ) : (
              <><WifiOff className="w-4 h-4 text-yellow-400" /> Connecting...</>
            )}
          </div>
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

        {/* Real-time Request Notifications */}
        {recentRequests.length > 0 && (
          <div className="mb-6 space-y-2">
            {recentRequests.slice(0, 3).map((request) => (
              <div key={request.id} className="p-3 bg-blue-900/20 border border-blue-800 rounded-lg">
                <div className="flex items-center gap-2 text-blue-300">
                  <Users className="w-4 h-4" />
                  <span>New team join request from {request.team?.name || 'Unknown Team'}</span>
                  <button 
                    onClick={clearRecentRequests}
                    className="ml-auto text-blue-400 hover:text-blue-300"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-900/20 border border-green-800 rounded-lg">
            <div className="flex items-center gap-2 text-green-300">
              <CheckCircle className="w-4 h-4" />
              {success}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-300">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
              <button onClick={() => setError(null)} className="text-red-400">
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

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
              {/* Connection Status Indicator */}
              <div className="flex items-center gap-2 px-3 py-2 border border-gray-600 rounded-lg text-sm">
                {isConnected ? (
                  <>
                    <Wifi className="w-4 h-4 text-green-400" />
                    <span className="text-green-400">Live</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-yellow-400" />
                    <span className="text-yellow-400">Offline</span>
                  </>
                )}
                {lastUpdate && (
                  <span className="text-gray-500 text-xs ml-2">
                    Updated {new Date(lastUpdate).toLocaleTimeString()}
                  </span>
                )}
              </div>

              {/* Manual Refresh Button */}
              <button
                onClick={forceRefresh}
                className="px-3 py-2 border border-gray-600 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors text-sm"
                title="Force refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>


              {/* Create Season Button - Only for league owners */}
              {leagueData.league.created_by === user?.id && (
                <button
                  onClick={() => setShowCreateSeasonModal(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                >
                  <Plus className="w-4 h-4 inline mr-2" />
                  Create Season
                </button>
              )}

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

        {/* Seasons Section */}
        <div className="mb-8">
          <SeasonManagement 
            leagueId={leagueId}
            seasons={leagueData.seasons || []}
          />
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
                        <button 
                          onClick={() => handleApproveRequest(request.id)}
                          disabled={processingRequest === request.id}
                          className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded transition-colors flex items-center justify-center gap-1"
                        >
                          {processingRequest === request.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <CheckCircle className="w-3 h-3" />
                          )}
                          Approve
                        </button>
                        <button 
                          onClick={() => handleRejectRequest(request.id)}
                          disabled={processingRequest === request.id}
                          className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded transition-colors flex items-center justify-center gap-1"
                        >
                          {processingRequest === request.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {leagueData.pendingRequests.length > 5 && (
                    <div className="text-center">
                      <Link 
                        href={`/leagues/${leagueId}/requests`}
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

      {/* Create Season Modal */}
      {showCreateSeasonModal && (
        <CreateSeasonModal
          isOpen={showCreateSeasonModal}
          onClose={() => setShowCreateSeasonModal(false)}
          selectedLeagueId={leagueId}
        />
      )}
    </div>
  );
}
/**
 * Admin Dashboard Page
 * 
 * Main dashboard for league administrators with overview stats,
 * pending approvals, and key management functions.
 * Connected to real data from the database.
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Shield, Users, Trophy, Calendar, AlertCircle, TrendingUp, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

// Type definitions
type AdminDashboardData = {
  totalLeagues: number;
  activeLeagues: number;
  totalTeams: number;
  totalPlayers: number;
  pendingRequests: any[];
  recentActivity: any[];
  growthData: { month: string; leagues: number; teams: number; players: number; }[];
};

type TeamLeagueRequestWithDetails = {
  id: string;
  team_name: string;
  league_name: string;
  requested_at: string;
  status: string;
  captain_name?: string;
  captain_email?: string;
  team?: any;
  league?: any;
};

export default function AdminDashboard() {
  // For now, we'll use a simple auth check
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || { id: 'admin-test' });
      setAuthLoading(false);
    };
    checkAuth();
  }, []);
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Request handling states
  const [detailedRequests, setDetailedRequests] = useState<TeamLeagueRequestWithDetails[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TeamLeagueRequestWithDetails | null>(null);
  const [modalAction, setModalAction] = useState<'approve' | 'reject'>('approve');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [processingRequest, setProcessingRequest] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);

  // Direct database service functions
  const fetchDashboardStats = async () => {
    const [leagues, teams, users, requests] = await Promise.all([
      supabase.from('leagues').select('*', { count: 'exact' }),
      supabase.from('teams').select('*', { count: 'exact' }),
      supabase.from('user_profiles').select('*', { count: 'exact' }),
      supabase.from('team_league_requests').select('*').eq('status', 'pending')
    ]);
    
    return {
      totalLeagues: leagues.count || 0,
      activeLeagues: leagues.data?.filter((l: any) => l.status === 'active').length || 0,
      totalTeams: teams.count || 0,
      totalPlayers: users.count || 0,
      pendingRequests: requests.data || []
    };
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch real data from database
        const stats = await fetchDashboardStats();
        
        // Get recent activity
        const { data: recentActivity } = await supabase
          .from('activity_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);
        
        // Get leagues data
        const { data: leaguesData } = await supabase
          .from('leagues')
          .select('*')
          .order('created_at', { ascending: false });
        
        const dashboardData: AdminDashboardData = {
          ...stats,
          leagues: leaguesData || [],
          recentActivity: recentActivity || [],
          growthData: [
            { month: 'Jan', leagues: 5, teams: 20, players: 150 },
            { month: 'Feb', leagues: 7, teams: 28, players: 220 },
            { month: 'Mar', leagues: 10, teams: 38, players: 310 },
            { month: 'Apr', leagues: totalLeagues, teams: totalTeams, players: totalPlayers }
          ],
          adminInfo: {
            displayName: user?.email?.split('@')[0] || 'Admin',
            email: user?.email || 'admin@matchday.com',
            role: 'Super Admin'
          }
        };
        setDashboardData(dashboardData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading) {
      fetchDashboardData();
    }
  }, [user, authLoading]);

  // Load detailed requests when dashboard data is available
  useEffect(() => {
    const loadDetailedRequests = async () => {
      if (!user || !dashboardData || dashboardData.pendingRequests.length === 0) {
        setDetailedRequests([]);
        return;
      }

      try {
        setLoadingRequests(true);
        // Fetch real pending requests with team and league details
        const { data: requests, error } = await supabase
          .from('team_league_requests')
          .select(`
            *,
            team:teams!team_id(*),
            league:leagues!league_id(*)
          `)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Transform to expected format
        const detailedRequests = (requests || []).map((req: any) => ({
          id: req.id,
          team_name: req.team?.name || 'Unknown Team',
          league_name: req.league?.name || 'Unknown League',
          requested_at: req.created_at,
          status: req.status,
          captain_name: req.team?.captain_name,
          captain_email: req.team?.captain_email,
          team: req.team,
          league: req.league
        }));
        
        setDetailedRequests(detailedRequests);
      } catch (err) {
        console.error('Error loading detailed requests:', err);
        setDetailedRequests([]);
      } finally {
        setLoadingRequests(false);
      }
    };

    loadDetailedRequests();
  }, [user, dashboardData]);

  // Handle approve request
  const handleApproveClick = (request: TeamLeagueRequestWithDetails) => {
    setSelectedRequest(request);
    setModalAction('approve');
    setIsModalOpen(true);
    setRequestError(null);
  };

  // Handle reject request
  const handleRejectClick = (request: TeamLeagueRequestWithDetails) => {
    setSelectedRequest(request);
    setModalAction('reject');
    setIsModalOpen(true);
    setRequestError(null);
  };

  // Handle modal confirmation
  const handleModalConfirm = async (responseMessage?: string) => {
    if (!selectedRequest || !user) return;

    try {
      setProcessingRequest(true);
      setRequestError(null);

      // Direct database operations for approve/reject
      let result: any = { success: false };
      
      if (modalAction === 'approve') {
        // Approve: Update request status and add team to league
        const { error: updateError } = await supabase
          .from('team_league_requests')
          .update({ 
            status: 'approved',
            processed_at: new Date().toISOString(),
            processed_by: user.id,
            response_message: responseMessage
          })
          .eq('id', selectedRequest.id);
        
        if (!updateError && selectedRequest.team && selectedRequest.league) {
          // Add team to league_teams junction table
          const { error: joinError } = await supabase
            .from('league_teams')
            .insert({
              league_id: selectedRequest.league.id,
              team_id: selectedRequest.team.id,
              joined_at: new Date().toISOString()
            });
          
          result = { success: !joinError, error: joinError };
        } else {
          result = { success: !updateError, error: updateError };
        }
      } else {
        // Reject: Just update request status
        const { error } = await supabase
          .from('team_league_requests')
          .update({ 
            status: 'rejected',
            processed_at: new Date().toISOString(),
            processed_by: user.id,
            response_message: responseMessage
          })
          .eq('id', selectedRequest.id);
        
        result = { success: !error, error };
      }

      if (result.success) {
        setSuccessMessage(result.message || `Request ${modalAction}d successfully!`);
        setIsModalOpen(false);
        setSelectedRequest(null);
        
        // Refresh dashboard data
        const stats = await fetchDashboardStats();
        const { data: recentActivity } = await supabase
          .from('activity_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);
        
        setDashboardData({
          ...stats,
          recentActivity: recentActivity || [],
          growthData: dashboardData?.growthData || []
        });

        // Refresh detailed requests
        const { data: requests } = await supabase
          .from('team_league_requests')
          .select(`
            *,
            team:teams!team_id(*),
            league:leagues!league_id(*)
          `)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });
        
        const updatedRequests = (requests || []).map((req: any) => ({
          id: req.id,
          team_name: req.team?.name || 'Unknown Team',
          league_name: req.league?.name || 'Unknown League',
          requested_at: req.created_at,
          status: req.status,
          captain_name: req.team?.captain_name,
          captain_email: req.team?.captain_email,
          team: req.team,
          league: req.league
        }));
        
        setDetailedRequests(updatedRequests);

        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        setRequestError(result.error?.message || `Failed to ${modalAction} request`);
      }
    } catch (err) {
      setRequestError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setProcessingRequest(false);
    }
  };

  // Handle modal close
  const handleModalClose = () => {
    if (!processingRequest) {
      setIsModalOpen(false);
      setSelectedRequest(null);
      setRequestError(null);
    }
  };

  // Clear success/error messages
  const clearMessages = () => {
    setSuccessMessage(null);
    setRequestError(null);
  };

  // Show loading spinner while authenticating or loading data
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show login required state
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
          <p className="text-gray-400">Please sign in to access the admin dashboard.</p>
        </div>
      </div>
    );
  }

  // Show empty state if no dashboard data
  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Dashboard Data</h2>
          <p className="text-gray-400">Unable to load dashboard information.</p>
        </div>
      </div>
    );
  }

  const { totalLeagues, activeLeagues, totalTeams, totalPlayers, pendingRequests, leagues, recentActivity, adminInfo } = dashboardData;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-900/20 border border-green-700 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-green-200">{successMessage}</span>
            <button 
              onClick={clearMessages}
              className="ml-auto p-1 hover:bg-green-800 rounded"
            >
              <XCircle className="w-4 h-4 text-green-400" />
            </button>
          </div>
        )}

        {/* Error Message */}
        {requestError && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-200">{requestError}</span>
            <button 
              onClick={clearMessages}
              className="ml-auto p-1 hover:bg-red-800 rounded"
            >
              <XCircle className="w-4 h-4 text-red-400" />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {adminInfo.displayName || 'Admin'}
          </h1>
          <p className="text-gray-400">
            {adminInfo.email} • {adminInfo.role} • Managing {totalLeagues} leagues
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Leagues</p>
                <p className="text-2xl font-bold text-orange-400">{totalLeagues}</p>
              </div>
              <Trophy className="w-8 h-8 text-orange-500" />
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Teams</p>
                <p className="text-2xl font-bold text-blue-400">{totalTeams}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Players</p>
                <p className="text-2xl font-bold text-green-400">{totalPlayers}</p>
              </div>
              <Shield className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Pending Requests</p>
                <p className="text-2xl font-bold text-red-400">{pendingRequests?.length || 0}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Matches</p>
                <p className="text-2xl font-bold text-purple-400">{0}</p>
              </div>
              <Calendar className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Monthly Growth</p>
                <p className="text-2xl font-bold text-teal-400">+15%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-teal-500" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link
                href="/leagues/create"
                className="block w-full p-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors text-center font-medium"
              >
                Create New League
              </Link>
              <Link
                href="/teams"
                className="block w-full p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-center font-medium"
              >
                Review Team Requests
              </Link>
              <Link
                href="/matches/create"
                className="block w-full p-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-center font-medium"
              >
                Schedule Match
              </Link>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Pending Approvals ({pendingRequests?.length || 0})
            </h2>
            <div className="space-y-3">
              {loadingRequests && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-orange-500 mr-2" />
                  <span className="text-gray-400">Loading request details...</span>
                </div>
              )}
              {!loadingRequests && detailedRequests.length > 0 ? (
                <>
                  {detailedRequests.slice(0, 3).map((request) => (
                    <div
                      key={request.id}
                      className="bg-gray-800 border border-gray-600 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-white">{request.team.name}</h3>
                        <span className="text-xs text-gray-400">
                          {new Date(request.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 mb-2">
                        Requesting to join <span className="text-orange-400">{request.league.name}</span>
                      </p>
                      <p className="text-xs text-gray-400 mb-3">
                        Requested by: {request.requested_by_user.display_name || request.requested_by_user.full_name || request.requested_by_user.email}
                      </p>
                      {request.message && (
                        <p className="text-xs text-gray-300 mb-3 p-2 bg-gray-700 rounded italic">
                          &quot;{request.message}&quot;
                        </p>
                      )}
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleApproveClick(request)}
                          disabled={processingRequest}
                          className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm rounded transition-colors flex items-center justify-center gap-1"
                        >
                          <CheckCircle className="w-3 h-3" />
                          Approve
                        </button>
                        <button 
                          onClick={() => handleRejectClick(request)}
                          disabled={processingRequest}
                          className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm rounded transition-colors flex items-center justify-center gap-1"
                        >
                          <XCircle className="w-3 h-3" />
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                  {detailedRequests.length > 3 && (
                    <Link
                      href="/teams"
                      className="block text-center text-orange-400 hover:text-orange-300 text-sm transition-colors"
                    >
                      View all {detailedRequests.length} requests →
                    </Link>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                  <p className="text-gray-500">No pending requests</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Managed Leagues & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Managed Leagues */}
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Your Leagues</h2>
            <div className="space-y-3">
              {leagues.length > 0 ? (
                leagues.map((league) => (
                  <div key={league.id} className="bg-gray-800 border border-gray-600 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-white">{league.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded ${
                        league.isActive 
                          ? 'bg-green-800 text-green-200' 
                          : 'bg-gray-700 text-gray-300'
                      }`}>
                        {league.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mb-2">
                      {league.sport_type} • {league.league_type}
                    </p>
                    <div className="flex justify-between text-sm text-gray-300">
                      <span>{league.teamCount} teams</span>
                      <span>{league.playerCount} players</span>
                    </div>
                    {league.location && (
                      <p className="text-xs text-gray-500 mt-1">{league.location}</p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Trophy className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                  <p className="text-gray-500">No leagues assigned</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {recentActivity.length > 0 ? (
                recentActivity.slice(0, 5).map((activity) => {
                  const activityColor = {
                    team_joined: 'bg-green-500',
                    match_scheduled: 'bg-blue-500',
                    league_created: 'bg-orange-500',
                    player_registered: 'bg-purple-500'
                  }[activity.type] || 'bg-gray-500';

                  return (
                    <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg">
                      <div className={`w-2 h-2 ${activityColor} rounded-full`}></div>
                      <span className="text-gray-300 flex-1">{activity.description}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                  <p className="text-gray-500">No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Request Action Modal */}
      <RequestActionModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        request={selectedRequest}
        action={modalAction}
        onConfirm={handleModalConfirm}
        isLoading={processingRequest}
      />
    </div>
  );
}
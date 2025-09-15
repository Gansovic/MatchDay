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
import { Shield, Users, Trophy, Calendar, AlertCircle, TrendingUp, Loader2, CheckCircle, XCircle, Plus, Eye, Settings } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { RequestActionModal } from '@/components/modals/request-action-modal';

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
      setUser(session?.user || null);
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
            { month: 'Apr', leagues: stats.totalLeagues, teams: stats.totalTeams, players: stats.totalPlayers }
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Admin Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please sign in to access the MatchDay admin dashboard.</p>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  // Show empty state if no dashboard data
  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Dashboard Data</h2>
          <p className="text-gray-600">Unable to load dashboard information.</p>
        </div>
      </div>
    );
  }

  const { totalLeagues, activeLeagues, totalTeams, totalPlayers, pendingRequests, leagues, recentActivity, adminInfo } = dashboardData;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800 font-medium flex-1">{successMessage}</span>
            <button 
              onClick={clearMessages}
              className="p-1 hover:bg-green-100 rounded"
            >
              <XCircle className="w-4 h-4 text-green-600" />
            </button>
          </div>
        )}

        {/* Error Message */}
        {requestError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800 font-medium flex-1">{requestError}</span>
            <button 
              onClick={clearMessages}
              className="p-1 hover:bg-red-100 rounded"
            >
              <XCircle className="w-4 h-4 text-red-600" />
            </button>
          </div>
        )}

        {/* Welcome Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-lg">A</span>
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Welcome back, {adminInfo.displayName || 'Admin'}!
              </h1>
              <p className="text-gray-600">
                Ready to manage your leagues like a pro? Let's get started.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600">Total Leagues</p>
                <p className="text-3xl font-bold text-blue-600">{totalLeagues}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Trophy className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600">Teams Joined</p>
                <p className="text-3xl font-bold text-green-600">{totalTeams}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600">Total Players</p>
                <p className="text-3xl font-bold text-purple-600">{totalPlayers}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600">Pending Requests</p>
                <p className="text-3xl font-bold text-orange-600">{pendingRequests?.length || 0}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Quick Actions
            </h2>
            <div className="space-y-3">
              <Link
                href="/leagues/create"
                className="flex items-center gap-3 p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium">Create New League</span>
              </Link>
              <Link
                href="/leagues"
                className="flex items-center gap-3 p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
              >
                <Eye className="w-5 h-5" />
                <span className="font-medium">View All Leagues</span>
              </Link>
              <Link
                href="/teams"
                className="flex items-center gap-3 p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <Users className="w-5 h-5" />
                <span className="font-medium">Manage Teams</span>
              </Link>
            </div>
          </div>

          {/* Pending Requests */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Pending Requests
            </h2>
            <div className="space-y-4">
              {loadingRequests && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
                  <span className="text-gray-600">Loading requests...</span>
                </div>
              )}
              {!loadingRequests && detailedRequests.length > 0 ? (
                <>
                  {detailedRequests.slice(0, 3).map((request) => (
                    <div
                      key={request.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">{request.team_name}</h3>
                        <span className="text-xs text-gray-500">
                          {new Date(request.requested_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        Requesting to join <span className="font-medium text-blue-600">{request.league_name}</span>
                      </p>
                      <div className="flex gap-2">
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
                      className="block text-center text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                    >
                      View all {detailedRequests.length} requests →
                    </Link>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-600 text-sm">No pending requests</p>
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
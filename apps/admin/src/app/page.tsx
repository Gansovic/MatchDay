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
import { useAuth } from '@/components/auth/auth-provider';
import { AdminDashboardService, type AdminDashboardData } from '@/lib/services/admin-dashboard.service';
import { LeagueRequestService, type TeamLeagueRequestWithDetails } from '@/lib/services/league-request.service';
import { RequestActionModal } from '@/components/modals/request-action-modal';
import { AdminStatsCard } from '@/components/dashboard/AdminStatsCard';
import { PendingRequestsPanel } from '@/components/dashboard/PendingRequestsPanel';
import { LeagueOverviewGrid } from '@/components/dashboard/LeagueOverviewGrid';
import { RecentActivityFeed } from '@/components/dashboard/RecentActivityFeed';

export default function AdminDashboard() {
  const { user, isLoading: authLoading } = useAuth();
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

  const adminDashboardService = useMemo(() => AdminDashboardService.getInstance(), []);
  const leagueRequestService = useMemo(() => LeagueRequestService.getInstance(), []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) {
        console.log('[Dashboard] No user found, skipping data fetch');
        setIsLoading(false);
        return;
      }

      try {
        console.log('[Dashboard] Fetching dashboard data for user:', user.id, user.email);
        setIsLoading(true);
        setError(null);
        
        const result = await adminDashboardService.getDashboardData(user.id);
        console.log('[Dashboard] Dashboard service result:', { success: result.success, hasData: !!result.data, error: result.error });
        
        if (result.success && result.data) {
          setDashboardData(result.data);
          console.log('[Dashboard] Dashboard data loaded successfully');
        } else {
          const errorMessage = result.error?.message || 'Failed to load dashboard data';
          console.error('[Dashboard] Failed to load dashboard data:', result.error);
          setError(errorMessage);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
        console.error('[Dashboard] Unexpected error:', err);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading) {
      console.log('[Dashboard] Auth loading complete, checking user state:', { hasUser: !!user, authLoading });
      fetchDashboardData();
    } else {
      console.log('[Dashboard] Still loading auth...');
    }
  }, [user, authLoading, adminDashboardService]);

  // Load detailed requests when dashboard data is available
  useEffect(() => {
    const loadDetailedRequests = async () => {
      if (!user || !dashboardData || dashboardData.pendingRequests.length === 0) {
        setDetailedRequests([]);
        return;
      }

      try {
        setLoadingRequests(true);
        const result = await leagueRequestService.getPendingRequests(user.id);
        
        if (result.success && result.data) {
          setDetailedRequests(result.data);
        } else {
          console.error('Failed to load detailed requests:', result.error);
          setDetailedRequests([]);
        }
      } catch (err) {
        console.error('Error loading detailed requests:', err);
        setDetailedRequests([]);
      } finally {
        setLoadingRequests(false);
      }
    };

    loadDetailedRequests();
  }, [user, dashboardData, leagueRequestService]);

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

      const result = modalAction === 'approve' 
        ? await leagueRequestService.approveRequest({
            requestId: selectedRequest.id,
            adminId: user.id,
            responseMessage
          })
        : await leagueRequestService.rejectRequest({
            requestId: selectedRequest.id,
            adminId: user.id,
            responseMessage
          });

      if (result.success) {
        setSuccessMessage(result.message || `Request ${modalAction}d successfully!`);
        setIsModalOpen(false);
        setSelectedRequest(null);
        
        // Refresh both dashboard data and detailed requests
        const dashboardResult = await adminDashboardService.getDashboardData(user.id);
        if (dashboardResult.success && dashboardResult.data) {
          setDashboardData(dashboardResult.data);
        }

        // Refresh detailed requests
        const requestsResult = await leagueRequestService.getPendingRequests(user.id);
        if (requestsResult.success && requestsResult.data) {
          setDetailedRequests(requestsResult.data);
        }

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

  const { stats, leagues, recentActivity, adminInfo } = dashboardData;

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
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-white mb-2 admin-gradient bg-clip-text text-transparent">
            Welcome back, {adminInfo.displayName || 'Admin'}
          </h1>
          <p className="text-gray-400">
            {adminInfo.email} • {adminInfo.role} • Managing {stats.totalLeagues} leagues
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <AdminStatsCard
            label="Total Leagues"
            value={stats.totalLeagues}
            icon={Trophy}
            iconColor="text-orange-500"
            valueColor="text-orange-400"
          />
          <AdminStatsCard
            label="Teams I Manage"
            value={stats.totalTeams}
            icon={Users}
            iconColor="text-blue-500"
            valueColor="text-blue-400"
          />
          <AdminStatsCard
            label="Total Players"
            value={stats.totalPlayers}
            icon={Shield}
            iconColor="text-green-500"
            valueColor="text-green-400"
          />
          <AdminStatsCard
            label="Pending Requests"
            value={stats.pendingRequests}
            icon={AlertCircle}
            iconColor="text-red-500"
            valueColor="text-red-400"
          />
          <AdminStatsCard
            label="Active Matches"
            value={stats.activeMatches}
            icon={Calendar}
            iconColor="text-purple-500"
            valueColor="text-purple-400"
          />
          <AdminStatsCard
            label="Monthly Growth"
            value={`${stats.monthlyGrowth >= 0 ? '+' : ''}${stats.monthlyGrowth}%`}
            icon={TrendingUp}
            iconColor="text-teal-500"
            valueColor="text-teal-400"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 card-hover">
            <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link
                href="/leagues/create"
                className="block w-full p-3 admin-gradient text-white rounded-lg transition-all text-center font-medium hover:shadow-lg hover:scale-105"
              >
                Create New League
              </Link>
              <Link
                href="/teams"
                className="block w-full p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all text-center font-medium hover:shadow-lg hover:scale-105"
              >
                Review Team Requests
              </Link>
              <Link
                href="/matches/create"
                className="block w-full p-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all text-center font-medium hover:shadow-lg hover:scale-105"
              >
                Schedule Match
              </Link>
            </div>
          </div>

          <PendingRequestsPanel
            requests={detailedRequests}
            isLoading={loadingRequests}
            totalCount={stats.pendingRequests}
            onApprove={handleApproveClick}
            onReject={handleRejectClick}
            isProcessing={processingRequest}
          />
        </div>

        {/* Managed Leagues & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LeagueOverviewGrid leagues={leagues} />
          <RecentActivityFeed activities={recentActivity} />
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
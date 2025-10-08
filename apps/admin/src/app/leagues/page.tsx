/**
 * Admin Leagues Management Page
 * 
 * Comprehensive league management interface where admins can:
 * - View all their leagues
 * - See pending team requests for each league
 * - Approve/reject team requests
 * - Create new leagues
 * - View league statistics
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { 
  Trophy, 
  Users, 
  Calendar, 
  MapPin, 
  Settings,
  Plus,
  Clock,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  Filter,
  Globe,
  Star,
  Upload,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import { AdminDashboardService, type AdminDashboardData } from '@/lib/services/admin-dashboard.service';
import { LeagueRequestService } from '@/lib/services/league-request.service';
import { LeagueService, type PublishLeagueData } from '@matchday/services';
import { supabase } from '@/lib/supabase/client';
import { RequestActionModal } from '@/components/modals/request-action-modal';
import { CreateLeagueModal } from '@/components/leagues/CreateLeagueModal';
import { useRealtimeLeagues, usePageVisibility } from '@/lib/hooks/use-realtime-leagues';

interface League {
  id: string;
  name: string;
  description?: string;
  sport_type: string;
  league_type: string;
  location?: string;
  max_teams?: number;
  season_start?: string;
  season_end?: string;
  entry_fee?: number;
  is_active: boolean;
  created_at: string;
  teamCount: number;
  pendingRequests: number;
  // Publishing fields
  is_public?: boolean;
  auto_approve_teams?: boolean;
  registration_deadline?: string;
  published_at?: string;
  featured?: boolean;
}

export default function AdminLeaguesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Real-time data with connection status
  const {
    leagues: realtimeLeagues,
    pendingRequests: realtimePendingRequests,
    pendingRequestsCount,
    isLoading,
    isConnected,
    lastUpdate,
    forceRefresh
  } = useRealtimeLeagues(user?.id);

  const isVisible = usePageVisibility();
  
  // Transform real-time leagues to match expected format
  const leagues = realtimeLeagues.map(league => ({
    ...league,
    pendingRequests: realtimePendingRequests.filter(req => req.league.id === league.id).length
  }));
  
  const pendingRequests = realtimePendingRequests;
  
  // Request handling states
  const [selectedRequest, setSelectedRequest] = useState<TeamLeagueRequestWithDetails | null>(null);
  const [modalAction, setModalAction] = useState<'approve' | 'reject'>('approve');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [processingRequest, setProcessingRequest] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);

  const leagueRequestService = LeagueRequestService.getInstance();
  const leagueService = LeagueService.getInstance(supabase);

  // Publishing states
  const [publishingLeague, setPublishingLeague] = useState<string | null>(null);

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
        
        // Real-time updates will automatically refresh the data

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

  // Clear messages
  const clearMessages = () => {
    setSuccessMessage(null);
    setRequestError(null);
  };

  // Handle publishing/unpublishing leagues
  const handlePublishToggle = async (league: League) => {
    if (!user || publishingLeague) return;

    try {
      setPublishingLeague(league.id);
      setRequestError(null);

      const publishData: PublishLeagueData = {
        leagueId: league.id,
        isPublic: !league.is_public,
        autoApproveTeams: league.auto_approve_teams || false,
        registrationDeadline: league.registration_deadline,
        maxTeams: league.max_teams,
        featured: league.featured || false
      };

      const result = await leagueService.publishLeague(publishData);

      if (result.success && result.data) {
        // Real-time updates will automatically refresh the leagues data
        
        setSuccessMessage(
          result.data.is_public 
            ? 'League published successfully! Teams can now join.' 
            : 'League unpublished successfully.'
        );

        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        setRequestError(result.error?.message || 'Failed to update league publication status');
      }
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setPublishingLeague(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading leagues...</p>
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Leagues</h2>
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

  const leagueRequests = selectedLeague 
    ? pendingRequests.filter(req => req.league.id === selectedLeague)
    : pendingRequests;

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                League Management
              </h1>
              <p className="text-gray-400">
                Manage your leagues and review team requests
              </p>
              
              {/* Connection Status */}
              <div className="flex items-center gap-2 mt-2 text-sm">
                {isConnected ? (
                  <>
                    <Wifi className="w-4 h-4 text-green-400" />
                    <span className="text-green-400">Live updates enabled</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-yellow-400" />
                    <span className="text-yellow-400">Offline mode</span>
                  </>
                )}
                {lastUpdate && (
                  <span className="text-gray-500 ml-2">
                    • Last updated {new Date(lastUpdate).toLocaleTimeString()}
                  </span>
                )}
                {pendingRequestsCount > 0 && (
                  <span className="ml-2 px-2 py-1 bg-orange-900/20 text-orange-300 text-xs rounded-full">
                    {pendingRequestsCount} total pending
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Manual Refresh Button */}
              <button 
                onClick={forceRefresh}
                className="px-3 py-2 border border-gray-600 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors text-sm"
                title="Force refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create League
              </button>
            </div>
          </div>
        </div>

        {/* League Filter */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-gray-400">Filter by league:</span>
            <select
              value={selectedLeague || ''}
              onChange={(e) => setSelectedLeague(e.target.value || null)}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-1 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">All Leagues</option>
              {leagues.map(league => (
                <option key={league.id} value={league.id}>
                  {league.name} ({league.pendingRequests} pending)
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Leagues List */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-white mb-4">
              Your Leagues ({leagues.length})
            </h2>
            
            {leagues.length === 0 ? (
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-12 text-center">
                <Trophy className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-300 mb-2">No leagues yet</h3>
                <p className="text-gray-500 mb-6">Create your first league to get started</p>
                <button className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors">
                  <Plus className="w-5 h-5" />
                  Create League
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {leagues.map((league) => (
                  <div key={league.id} className="bg-gray-900 border border-gray-700 rounded-lg p-6">
                    <Link 
                      href={`/leagues/${league.id}`}
                      className="block mb-4 hover:bg-gray-800/50 -m-6 p-6 rounded-lg transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-1">{league.name}</h3>
                          <p className="text-gray-400 text-sm mb-2">{league.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="capitalize">{league.sport_type} • {league.league_type}</span>
                            {league.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {league.location}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {league.pendingRequests > 0 && (
                            <span className="px-2 py-1 bg-orange-900/20 text-orange-300 text-xs rounded-full">
                              {league.pendingRequests} pending
                            </span>
                          )}
                          {league.is_public && (
                            <span className="px-2 py-1 bg-blue-900/20 text-blue-300 text-xs rounded-full flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              Public
                            </span>
                          )}
                          {league.featured && (
                            <span className="px-2 py-1 bg-purple-900/20 text-purple-300 text-xs rounded-full flex items-center gap-1">
                              <Star className="w-3 h-3" />
                              Featured
                            </span>
                          )}
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            league.is_active 
                              ? 'bg-green-900/20 text-green-300' 
                              : 'bg-gray-700 text-gray-400'
                          }`}>
                            {league.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white">{league.teamCount}</div>
                          <div className="text-xs text-gray-500">Teams</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white">
                            {league.max_teams ? `${league.teamCount}/${league.max_teams}` : league.teamCount}
                          </div>
                          <div className="text-xs text-gray-500">Capacity</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white">
                            {league.entry_fee ? `$${league.entry_fee}` : 'Free'}
                          </div>
                          <div className="text-xs text-gray-500">Entry Fee</div>
                        </div>
                      </div>
                    </Link>

                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedLeague(selectedLeague === league.id ? null : league.id);
                        }}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                          selectedLeague === league.id
                            ? 'bg-orange-600 hover:bg-orange-700 text-white'
                            : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                        }`}
                      >
                        <Eye className="w-4 h-4 inline mr-2" />
                        {selectedLeague === league.id ? 'Hide' : 'View'} Requests
                      </button>
                      
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          handlePublishToggle(league);
                        }}
                        disabled={publishingLeague === league.id}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-2 ${
                          league.is_public
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        } ${publishingLeague === league.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {publishingLeague === league.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : league.is_public ? (
                          <Globe className="w-4 h-4" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        {publishingLeague === league.id ? 'Publishing...' : league.is_public ? 'Unpublish' : 'Publish'}
                      </button>
                      
                      <button 
                        onClick={(e) => e.preventDefault()}
                        className="px-4 py-2 border border-gray-600 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors text-sm"
                      >
                        <Settings className="w-4 h-4 inline mr-2" />
                        Settings
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Requests */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">
              Pending Requests ({leagueRequests.length})
            </h2>
            
            {leagueRequests.length === 0 ? (
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-8 text-center">
                <Clock className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-300 mb-2">No pending requests</h3>
                <p className="text-gray-500 text-sm">
                  {selectedLeague ? 'No requests for this league' : 'All caught up!'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {leagueRequests.map((request) => (
                  <div key={request.id} className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-white">{request.team.name}</h4>
                        <p className="text-sm text-gray-400">{request.league.name}</p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(request.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-xs text-gray-400 mb-3">
                      Requested by: {request.requested_by_user.display_name || request.requested_by_user.full_name}
                    </p>

                    {request.message && (
                      <p className="text-sm text-gray-300 mb-4 p-2 bg-gray-800 rounded italic">
                        "{request.message}"
                      </p>
                    )}

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
              </div>
            )}
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

      {/* Create League Modal */}
      <CreateLeagueModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onLeagueCreated={(leagueId) => {
          setShowCreateModal(false);
          router.push(`/leagues/${leagueId}`);
        }}
      />
    </div>
  );
}
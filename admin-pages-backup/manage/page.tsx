/**
 * League Management Page
 * 
 * Admin interface for league creators to manage their leagues.
 * Includes team join request approval/rejection and team management.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Shield, 
  Users, 
  Clock, 
  Check, 
  X, 
  Loader2, 
  ArrowLeft,
  Mail,
  MessageSquare,
  AlertCircle,
  Trophy,
  Calendar,
  MapPin
} from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { supabase } from '@/lib/supabase/client';
import { TeamLeagueRequestWithDetails } from '@/lib/types/database.types';

interface League {
  id: string;
  name: string;
  description?: string;
  location?: string;
  sport_type: string;
  league_type: string;
  entry_fee?: number;
  max_teams?: number;
  created_by: string;
  season_start?: string;
  season_end?: string;
}

interface Team {
  id: string;
  name: string;
  team_color?: string;
  captain_id: string;
  captain?: {
    display_name?: string;
    email: string;
  };
  member_count: number;
}

export default function LeagueManagePage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  
  const leagueId = params.leagueId as string;
  
  const [league, setLeague] = useState<League | null>(null);
  const [pendingRequests, setPendingRequests] = useState<TeamLeagueRequestWithDetails[]>([]);
  const [currentTeams, setCurrentTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'requests' | 'teams'>('requests');

  // Check if user is the league admin
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  // Load league data and check admin access
  useEffect(() => {
    if (user && leagueId) {
      loadLeagueData();
    }
  }, [user, leagueId]);

  const loadLeagueData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Authentication required');
      }

      // Load league details
      const { data: leagueData, error: leagueError } = await supabase
        .from('leagues')
        .select('*')
        .eq('id', leagueId)
        .single();

      if (leagueError || !leagueData) {
        throw new Error('League not found');
      }

      // Check if user is the league admin
      if (leagueData.created_by !== user?.id) {
        setError('Access denied. Only league administrators can access this page.');
        return;
      }

      setLeague(leagueData);

      // Load pending requests
      const requestsResponse = await fetch(`/api/leagues/${leagueId}/requests?status=pending`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (requestsResponse.ok) {
        const requestsResult = await requestsResponse.json();
        setPendingRequests(requestsResult.data || []);
      }

      // Load current teams
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select(`
          *,
          captain:captain_id (
            email,
            user_profiles (
              display_name
            )
          ),
          team_members (
            count
          )
        `)
        .eq('league_id', leagueId);

      if (teams) {
        const transformedTeams = teams.map(team => ({
          ...team,
          captain: team.captain ? {
            email: team.captain.email,
            display_name: team.captain.user_profiles?.[0]?.display_name
          } : undefined,
          member_count: team.team_members?.[0]?.count || 1
        }));
        setCurrentTeams(transformedTeams);
      }

    } catch (err) {
      console.error('Error loading league data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load league data');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestResponse = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      setProcessingRequest(requestId);

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`/api/league-requests/${requestId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ 
          action,
          review_message: action === 'approve' 
            ? 'Welcome to the league!' 
            : 'Unfortunately, we cannot accept your team at this time.'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action} request`);
      }

      // Remove the request from pending list
      setPendingRequests(prev => prev.filter(req => req.id !== requestId));

      // If approved, reload teams list
      if (action === 'approve') {
        loadLeagueData();
      }

    } catch (err) {
      console.error(`Error ${action}ing request:`, err);
      alert(err instanceof Error ? err.message : `Failed to ${action} request`);
    } finally {
      setProcessingRequest(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600 dark:text-gray-400">Loading league management...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Access Error
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
              <button
                onClick={() => router.push('/leagues')}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Back to Leagues
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!league) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/leagues')}
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Leagues
          </button>
          
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {league.name}
                </h1>
                <div className="flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-sm font-medium">
                  <Shield className="w-4 h-4" />
                  Admin
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Manage teams and join requests for your league
              </p>
            </div>
          </div>
        </div>

        {/* League Info Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Type</p>
                <p className="font-medium capitalize">{league.league_type}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                <p className="font-medium">{league.location || 'Not specified'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Teams</p>
                <p className="font-medium">
                  {currentTeams.length}{league.max_teams ? `/${league.max_teams}` : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Season</p>
                <p className="font-medium">
                  {league.season_start ? new Date(league.season_start).getFullYear() : 'Ongoing'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('requests')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'requests'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Join Requests
                  {pendingRequests.length > 0 && (
                    <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-xs font-medium">
                      {pendingRequests.length}
                    </span>
                  )}
                </div>
              </button>
              <button
                onClick={() => setActiveTab('teams')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'teams'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Current Teams ({currentTeams.length})
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Join Requests Tab */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            {pendingRequests.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No Pending Requests
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  There are no teams waiting to join your league.
                </p>
              </div>
            ) : (
              pendingRequests.map((request) => (
                <div key={request.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: request.teams.team_color || '#3B82F6' }}
                      >
                        {request.teams.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {request.teams.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Captain: {request.requested_by_user.user_profiles?.display_name || request.requested_by_user.email}
                        </p>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {request.teams.member_count} members
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatDate(request.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Message */}
                  {request.message && (
                    <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          {request.message}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Team Bio */}
                  {request.teams.team_bio && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {request.teams.team_bio}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleRequestResponse(request.id, 'approve')}
                      disabled={processingRequest === request.id}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-lg transition-colors"
                    >
                      {processingRequest === request.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      Approve
                    </button>
                    <button
                      onClick={() => handleRequestResponse(request.id, 'reject')}
                      disabled={processingRequest === request.id}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium rounded-lg transition-colors"
                    >
                      {processingRequest === request.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Current Teams Tab */}
        {activeTab === 'teams' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentTeams.length === 0 ? (
              <div className="col-span-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No Teams Yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  No teams have joined your league yet.
                </p>
              </div>
            ) : (
              currentTeams.map((team) => (
                <div key={team.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: team.team_color || '#3B82F6' }}
                    >
                      {team.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {team.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {team.member_count} members
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <p>Captain: {team.captain?.display_name || team.captain?.email || 'Unknown'}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
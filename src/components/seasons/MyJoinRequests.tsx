'use client';

import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface JoinRequest {
  id: string;
  season_id: string;
  team_id: string;
  user_id: string;
  message?: string;
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn';
  response_message?: string;
  responded_at?: string;
  created_at: string;
  season: {
    id: string;
    name: string;
    display_name?: string;
    league_id: string;
  };
  team: {
    id: string;
    name: string;
    team_color?: string;
  };
  league: {
    id: string;
    name: string;
  };
}

interface MyJoinRequestsProps {
  seasonId?: string;
  teamId?: string;
}

export const MyJoinRequests: React.FC<MyJoinRequestsProps> = ({
  seasonId,
  teamId
}) => {
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClientComponentClient();

  useEffect(() => {
    loadRequests();

    // Set up real-time subscription
    const channel = supabase
      .channel('join-requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'season_join_requests'
        },
        () => {
          loadRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [seasonId, teamId]);

  const loadRequests = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('season_join_requests')
        .select(`
          *,
          season:seasons (
            id,
            name,
            display_name,
            league_id
          ),
          team:teams (
            id,
            name,
            team_color
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (seasonId) {
        query = query.eq('season_id', seasonId);
      }

      if (teamId) {
        query = query.eq('team_id', teamId);
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;

      // Get league info for each request
      const requestsWithLeagues = await Promise.all(
        (data || []).map(async (request) => {
          const { data: league } = await supabase
            .from('leagues')
            .select('id, name')
            .eq('id', request.season.league_id)
            .single();

          return {
            ...request,
            league: league || { id: '', name: 'Unknown League' }
          };
        })
      );

      setRequests(requestsWithLeagues);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load requests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('season_join_requests')
        .update({ status: 'withdrawn' })
        .eq('id', requestId);

      if (error) throw error;

      setRequests(prev =>
        prev.map(req =>
          req.id === requestId ? { ...req, status: 'withdrawn' } : req
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to withdraw request');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'withdrawn':
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'approved':
        return 'text-green-600 bg-green-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      case 'withdrawn':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
        <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 dark:text-gray-400">
          No join requests yet
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        My Join Requests
      </h3>

      <div className="space-y-3">
        {requests.map((request) => (
          <div
            key={request.id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: request.team.team_color || '#6B7280' }}
                  />
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {request.team.name}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 mx-2">→</span>
                    <span className="text-gray-900 dark:text-white">
                      {request.season.display_name || request.season.name}
                    </span>
                  </div>
                </div>

                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {request.league.name} • Requested {formatDate(request.created_at)}
                </div>

                {request.message && (
                  <div className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 rounded p-2 mb-2">
                    {request.message}
                  </div>
                )}

                {request.response_message && (
                  <div className="text-sm bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-2">
                    <span className="font-medium">Admin response:</span> {request.response_message}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${getStatusColor(request.status)}`}>
                  {getStatusIcon(request.status)}
                  {request.status}
                </span>

                {request.status === 'pending' && (
                  <button
                    onClick={() => handleWithdraw(request.id)}
                    className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Withdraw
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
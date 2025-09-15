'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle, Loader2, MessageSquare, Users } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { SeasonJoinRequestWithDetails, SeasonJoinRequestStatus } from '@/lib/types/database.types';
import { useToast } from '@/components/ui/toast';

interface PendingRequestsCardProps {
  leagueId: string;
  seasonId?: string;
}

export const PendingRequestsCard: React.FC<PendingRequestsCardProps> = ({
  leagueId,
  seasonId
}) => {
  const [requests, setRequests] = useState<SeasonJoinRequestWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { showToast } = useToast();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadRequests();

    // Set up real-time subscription
    const channel = supabase
      .channel('season-join-requests')
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
  }, [leagueId, seasonId]);

  const loadRequests = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('season_join_requests')
        .select(`
          *,
          season:seasons (
            id,
            name,
            league_id
          ),
          team:teams (
            id,
            name,
            team_color,
            captain_id
          ),
          user:users (
            id,
            display_name,
            email
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      // Filter by league
      if (leagueId && !seasonId) {
        // Get all pending requests for seasons in this league
        const { data: seasons } = await supabase
          .from('seasons')
          .select('id')
          .eq('league_id', leagueId);

        if (seasons && seasons.length > 0) {
          const seasonIds = seasons.map(s => s.id);
          query = query.in('season_id', seasonIds);
        }
      } else if (seasonId) {
        // Filter by specific season
        query = query.eq('season_id', seasonId);
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;

      setRequests(data as SeasonJoinRequestWithDetails[] || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load requests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRespond = async (requestId: string, action: 'approved' | 'rejected', responseMessage?: string) => {
    setProcessingId(requestId);
    setError(null);

    try {
      const response = await fetch(`/api/seasons/${requests.find(r => r.id === requestId)?.season_id}/join-requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: action,
          response_message: responseMessage
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || `Failed to ${action} request`);
      }

      const request = requests.find(r => r.id === requestId);
      showToast({
        type: action === 'approved' ? 'success' : 'info',
        title: `Request ${action === 'approved' ? 'Approved' : 'Rejected'}`,
        message: `Join request from ${request?.team?.name} has been ${action}.`
      });

      // Remove the request from the list
      setRequests(prev => prev.filter(req => req.id !== requestId));
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} request`);
    } finally {
      setProcessingId(null);
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
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          Season Join Requests ({requests.length})
        </h3>
        {requests.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Clock className="w-4 h-4" />
            Pending review
          </div>
        )}
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-8">
          <CheckCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h4 className="font-semibold text-gray-300 mb-2">No pending requests</h4>
          <p className="text-gray-500 text-sm">All season join requests have been processed</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div key={request.id} className="border border-gray-700 rounded-lg p-4 hover:bg-gray-800/50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: request.team?.team_color || '#6B7280' }}
                  >
                    <span className="text-white font-bold text-sm">
                      {request.team?.name?.charAt(0)?.toUpperCase() || 'T'}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{request.team?.name}</h4>
                    <p className="text-sm text-gray-400">
                      Season: {request.season?.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Requested by: {request.user?.display_name || request.user?.email}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-xs text-yellow-400 mb-1">
                    {getStatusIcon(request.status)}
                    <span className="capitalize">{request.status}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(request.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {request.message && (
                <div className="mb-4 p-3 bg-gray-800 rounded border-l-4 border-blue-500">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-300 italic">"{request.message}"</p>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => handleRespond(request.id, 'approved')}
                  disabled={processingId === request.id}
                  className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white text-sm rounded transition-colors flex items-center justify-center gap-1"
                >
                  {processingId === request.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <CheckCircle className="w-3 h-3" />
                  )}
                  Approve
                </button>
                <button
                  onClick={() => handleRespond(request.id, 'rejected')}
                  disabled={processingId === request.id}
                  className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white text-sm rounded transition-colors flex items-center justify-center gap-1"
                >
                  {processingId === request.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <XCircle className="w-3 h-3" />
                  )}
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
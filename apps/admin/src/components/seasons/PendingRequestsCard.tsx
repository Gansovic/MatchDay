'use client';

import React, { useState, useEffect } from 'react';
import { UserPlus, CheckCircle, XCircle, Loader2, AlertCircle, Users } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

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
  team: {
    id: string;
    name: string;
    team_color?: string;
    captain_id: string;
  };
  user: {
    id: string;
    email: string;
  };
}

interface PendingRequestsCardProps {
  seasonId: string;
  seasonName: string;
  onRequestProcessed?: () => void;
}

export const PendingRequestsCard: React.FC<PendingRequestsCardProps> = ({
  seasonId,
  seasonName,
  onRequestProcessed
}) => {
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [responseMessage, setResponseMessage] = useState<{ [key: string]: string }>({});

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadRequests();

    // Set up real-time subscription
    const channel = supabase
      .channel(`season-requests-${seasonId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'season_join_requests',
          filter: `season_id=eq.${seasonId}`
        },
        () => {
          loadRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [seasonId]);

  const loadRequests = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/seasons/${seasonId}/requests`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to load requests');
      }

      setRequests(result.data.filter((r: JoinRequest) => r.status === 'pending'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load requests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessRequest = async (requestId: string, action: 'approve' | 'reject') => {
    setProcessingId(requestId);
    setError(null);

    try {
      const response = await fetch(`/api/admin/seasons/${seasonId}/requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: action === 'approve' ? 'approved' : 'rejected',
          response_message: responseMessage[requestId] || null
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || `Failed to ${action} request`);
      }

      // Remove processed request from list
      setRequests(prev => prev.filter(r => r.id !== requestId));
      setResponseMessage(prev => {
        const updated = { ...prev };
        delete updated[requestId];
        return updated;
      });

      onRequestProcessed?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} request`);
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Pending Join Requests
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {seasonName}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
          <Users className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
          <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
            {requests.length} pending
          </span>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-8">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400">
            No pending requests
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: request.team.team_color || '#6B7280' }}
                  >
                    {request.team.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {request.team.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Captain: {request.user.email}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-500">
                  {formatDate(request.created_at)}
                </span>
              </div>

              {request.message && (
                <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded text-sm text-gray-700 dark:text-gray-300">
                  {request.message}
                </div>
              )}

              <div className="space-y-2">
                <textarea
                  value={responseMessage[request.id] || ''}
                  onChange={(e) => setResponseMessage(prev => ({
                    ...prev,
                    [request.id]: e.target.value
                  }))}
                  placeholder="Add a response message (optional)..."
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={processingId === request.id}
                />

                <div className="flex gap-2">
                  <button
                    onClick={() => handleProcessRequest(request.id, 'approve')}
                    disabled={processingId === request.id}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processingId === request.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleProcessRequest(request.id, 'reject')}
                    disabled={processingId === request.id}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processingId === request.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" />
                        Reject
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
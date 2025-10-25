/**
 * Pending Requests Panel Component
 *
 * Displays pending team join requests with approve/reject actions
 * Extracted from the main dashboard for better modularity
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { EmptyState } from '@matchday/ui';
import type { TeamLeagueRequestWithDetails } from '@/lib/services/league-request.service';

interface PendingRequestsPanelProps {
  requests: TeamLeagueRequestWithDetails[];
  isLoading: boolean;
  totalCount: number;
  onApprove: (request: TeamLeagueRequestWithDetails) => void;
  onReject: (request: TeamLeagueRequestWithDetails) => void;
  isProcessing: boolean;
}

export const PendingRequestsPanel: React.FC<PendingRequestsPanelProps> = ({
  requests,
  isLoading,
  totalCount,
  onApprove,
  onReject,
  isProcessing
}) => {
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-4">
        Pending Approvals ({totalCount})
      </h2>
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin text-orange-500 mr-2" />
            <span className="text-gray-400">Loading request details...</span>
          </div>
        ) : requests.length > 0 ? (
          <>
            {requests.slice(0, 3).map((request) => (
              <div
                key={request.id}
                className="bg-gray-800 border border-gray-600 rounded-lg p-4 animate-fade-in"
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
                    onClick={() => onApprove(request)}
                    disabled={isProcessing}
                    className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:opacity-50 text-white text-sm rounded transition-colors flex items-center justify-center gap-1"
                  >
                    <CheckCircle className="w-3 h-3" />
                    Approve
                  </button>
                  <button
                    onClick={() => onReject(request)}
                    disabled={isProcessing}
                    className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:opacity-50 text-white text-sm rounded transition-colors flex items-center justify-center gap-1"
                  >
                    <XCircle className="w-3 h-3" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
            {requests.length > 3 && (
              <Link
                href="/teams"
                className="block text-center text-orange-400 hover:text-orange-300 text-sm transition-colors"
              >
                View all {requests.length} requests →
              </Link>
            )}
          </>
        ) : (
          <EmptyState
            icon={<AlertCircle className="w-8 h-8" />}
            title="No pending requests"
            compact
          />
        )}
      </div>
    </div>
  );
};

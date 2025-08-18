/**
 * Request Action Modal Component
 * 
 * Modal for confirming approval or rejection of team league join requests.
 * Allows admins to add optional response messages.
 */

'use client';

import React, { useState } from 'react';
import { X, CheckCircle, XCircle, MessageSquare, Users, Trophy, Loader2 } from 'lucide-react';
import { TeamLeagueRequestWithDetails } from '@/lib/services/league-request.service';

interface RequestActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: TeamLeagueRequestWithDetails | null;
  action: 'approve' | 'reject';
  onConfirm: (responseMessage?: string) => void;
  isLoading?: boolean;
}

export const RequestActionModal: React.FC<RequestActionModalProps> = ({
  isOpen,
  onClose,
  request,
  action,
  onConfirm,
  isLoading = false
}) => {
  const [responseMessage, setResponseMessage] = useState('');

  const handleConfirm = () => {
    onConfirm(responseMessage.trim() || undefined);
  };

  const handleClose = () => {
    if (!isLoading) {
      setResponseMessage('');
      onClose();
    }
  };

  if (!isOpen || !request) return null;

  const isApproval = action === 'approve';
  const actionColor = isApproval ? 'green' : 'red';
  const ActionIcon = isApproval ? CheckCircle : XCircle;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 bg-${actionColor}-100 dark:bg-${actionColor}-900/30 rounded-lg flex items-center justify-center`}>
              <ActionIcon className={`w-5 h-5 text-${actionColor}-600 dark:text-${actionColor}-400`} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {isApproval ? 'Approve' : 'Reject'} Team Request
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isApproval 
                  ? 'The team will be added to your league'
                  : 'The team will be notified of the rejection'
                }
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Request Details */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Request Details
            </h3>
            
            {/* Team Info */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {request.team.name}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Team requesting to join
                </div>
              </div>
            </div>

            {/* League Info */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                <Trophy className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {request.league.name}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {request.league.sport_type} • {request.league.league_type}
                </div>
              </div>
            </div>

            {/* Requested By */}
            <div className="text-sm">
              <span className="text-gray-600 dark:text-gray-400">Requested by:</span>
              <span className="ml-1 text-gray-900 dark:text-white">
                {request.requested_by_user.display_name || 
                 request.requested_by_user.full_name || 
                 request.requested_by_user.email}
              </span>
            </div>

            {/* Request Message */}
            {request.message && (
              <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Message from team:
                </div>
                <div className="text-sm text-gray-900 dark:text-white">
                  "{request.message}"
                </div>
              </div>
            )}

            {/* Request Date */}
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-3">
              Requested on {new Date(request.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>

          {/* Response Message Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <MessageSquare className="w-4 h-4 inline mr-2" />
              {isApproval ? 'Welcome Message' : 'Rejection Reason'} (Optional)
            </label>
            <textarea
              value={responseMessage}
              onChange={(e) => setResponseMessage(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors resize-none"
              placeholder={isApproval 
                ? "Welcome the team to your league..."
                : "Explain why the request was rejected..."
              }
              disabled={isLoading}
              maxLength={500}
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isApproval 
                  ? 'This message will be sent to the team captain'
                  : 'Help the team understand your decision'
                }
              </p>
              <span className="text-xs text-gray-400">
                {responseMessage.length}/500
              </span>
            </div>
          </div>

          {/* Confirmation Warning */}
          <div className={`p-4 bg-${actionColor}-50 dark:bg-${actionColor}-900/20 border border-${actionColor}-200 dark:border-${actionColor}-800 rounded-lg`}>
            <div className="flex items-start gap-3">
              <ActionIcon className={`w-5 h-5 text-${actionColor}-600 dark:text-${actionColor}-400 mt-0.5`} />
              <div>
                <h4 className={`text-sm font-medium text-${actionColor}-900 dark:text-${actionColor}-100 mb-1`}>
                  {isApproval ? 'Confirm Approval' : 'Confirm Rejection'}
                </h4>
                <p className={`text-sm text-${actionColor}-800 dark:text-${actionColor}-200`}>
                  {isApproval 
                    ? `${request.team.name} will be immediately added to ${request.league.name} and can start participating in matches.`
                    : `${request.team.name} will be notified that their request to join ${request.league.name} has been rejected.`
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 pt-0">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className={`flex-1 px-4 py-3 bg-${actionColor}-600 hover:bg-${actionColor}-700 disabled:bg-${actionColor}-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <ActionIcon className="w-4 h-4" />
                {isApproval ? 'Approve Request' : 'Reject Request'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
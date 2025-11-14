'use client';

import React, { useState } from 'react';
import { X, Trophy, AlertCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { LeagueService } from '@matchday/services';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';
import { IconUpload } from '@/components/media/icon-upload';

interface CreateLeagueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeagueCreated: (leagueId: string) => void;
}

export const CreateLeagueModal: React.FC<CreateLeagueModalProps> = ({
  isOpen,
  onClose,
  onLeagueCreated
}) => {
  const { user } = useAuth();
  const [leagueName, setLeagueName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showIconUpload, setShowIconUpload] = useState(false);
  const [createdLeagueId, setCreatedLeagueId] = useState<string | null>(null);
  const [iconUploaded, setIconUploaded] = useState(false);

  const validateForm = (): string | null => {
    if (!leagueName.trim()) {
      return 'League name is required';
    }
    if (leagueName.trim().length < 3) {
      return 'League name must be at least 3 characters';
    }
    if (!user?.id) {
      return 'You must be logged in to create a league';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    setIsSubmitting(true);

    try {
      const leagueService = LeagueService.getInstance(supabase);
      const result = await leagueService.createLeague(leagueName.trim(), user.id);

      if (!result.success || !result.data) {
        throw new Error(result.error?.message || 'Failed to create league');
      }

      // Store the league ID for icon upload
      setCreatedLeagueId(result.data.id);

      // If icon upload section is not shown, complete the flow
      if (!showIconUpload) {
        onLeagueCreated(result.data.id);
        handleClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create league');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setLeagueName('');
    setError(null);
    setShowIconUpload(false);
    setCreatedLeagueId(null);
    setIconUploaded(false);
    onClose();
  };

  const handleIconUploadComplete = () => {
    setIconUploaded(true);
  };

  const handleFinish = () => {
    if (createdLeagueId) {
      onLeagueCreated(createdLeagueId);
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">
            Create New League
          </h2>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-300 rounded-lg hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg">
              <div className="flex items-center gap-2 text-red-300">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              League Name *
            </label>
            <input
              type="text"
              value={leagueName}
              onChange={(e) => setLeagueName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder:text-gray-500"
              placeholder="e.g., Sunday Football League"
              required
              autoFocus
              minLength={3}
              disabled={!!createdLeagueId}
            />
            {!createdLeagueId && (
              <p className="mt-2 text-sm text-gray-400">
                You can edit all other details after creation
              </p>
            )}
          </div>

          {/* Optional Icon Upload Section */}
          {!createdLeagueId && (
            <div>
              <button
                type="button"
                onClick={() => setShowIconUpload(!showIconUpload)}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300 transition-colors"
              >
                {showIconUpload ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                <span>Add league icon (optional)</span>
              </button>
            </div>
          )}

          {/* Icon Upload (shown after league creation if enabled) */}
          {createdLeagueId && showIconUpload && user && (
            <div className="border border-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-300 mb-4">Upload League Icon</h3>
              <IconUpload
                contextType="league_icon"
                entityId={createdLeagueId}
                leagueId={createdLeagueId}
                entityName={leagueName}
                onUploadComplete={handleIconUploadComplete}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-700">
            {!createdLeagueId ? (
              <>
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 text-gray-300 bg-gray-800 hover:bg-gray-700 font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Trophy className="w-4 h-4" />
                      {showIconUpload ? 'Create & Add Icon' : 'Create League'}
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    // Skip icon upload and finish
                    handleFinish();
                  }}
                  className="flex-1 px-4 py-2 text-gray-300 bg-gray-800 hover:bg-gray-700 font-medium rounded-lg transition-colors"
                >
                  Skip Icon
                </button>
                <button
                  type="button"
                  onClick={handleFinish}
                  disabled={!iconUploaded}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trophy className="w-4 h-4" />
                  Finish
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

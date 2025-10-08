'use client';

import React, { useState } from 'react';
import { X, Trophy, AlertCircle, Loader2 } from 'lucide-react';
import { LeagueService } from '@matchday/services';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';

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

      // Call the success callback with the new league ID
      onLeagueCreated(result.data.id);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create league');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setLeagueName('');
    setError(null);
    onClose();
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
            />
            <p className="mt-2 text-sm text-gray-400">
              You can edit all other details after creation
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-700">
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
                  Create League
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

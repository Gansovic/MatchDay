'use client';

import React, { useState, useEffect } from 'react';
import { X, UserPlus, Loader2, AlertCircle, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toast';

interface TeamJoinRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  seasonId: string;
  seasonName: string;
  leagueId: string;
  onRequestSubmitted?: () => void;
}

interface Team {
  id: string;
  name: string;
  team_color?: string;
  captain_id: string;
  is_recruiting: boolean;
}

export const TeamJoinRequestModal: React.FC<TeamJoinRequestModalProps> = ({
  isOpen,
  onClose,
  seasonId,
  seasonName,
  leagueId,
  onRequestSubmitted
}) => {
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [existingRequest, setExistingRequest] = useState<boolean>(false);

  // Using imported supabase client
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadUserTeams();
      checkExistingRequest();
    }
  }, [isOpen, seasonId]);

  const loadUserTeams = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get teams where user is captain
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .eq('captain_id', user.id);

      if (teamsError) throw teamsError;

      // Filter out teams already in this season
      const { data: seasonTeams, error: seasonTeamsError } = await supabase
        .from('season_teams')
        .select('team_id')
        .eq('season_id', seasonId);

      if (seasonTeamsError) throw seasonTeamsError;

      const registeredTeamIds = new Set(seasonTeams?.map(st => st.team_id) || []);
      const availableTeams = teams?.filter(team => !registeredTeamIds.has(team.id)) || [];

      setUserTeams(availableTeams);
      if (availableTeams.length > 0) {
        setSelectedTeamId(availableTeams[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load teams');
    } finally {
      setIsLoading(false);
    }
  };

  const checkExistingRequest = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user has pending request for this season
      const { data: requests } = await supabase
        .from('season_join_requests')
        .select('id')
        .eq('season_id', seasonId)
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .single();

      setExistingRequest(!!requests);
    } catch (err) {
      // No existing request
      setExistingRequest(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamId || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/seasons/${seasonId}/join-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          team_id: selectedTeamId,
          message: message.trim()
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to submit request');
      }

      showToast({
        type: 'success',
        title: 'Request Submitted',
        message: 'Your join request has been submitted successfully. League administrators will review it soon.'
      });

      onRequestSubmitted?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Request to Join Season
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {seasonName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2 text-red-800 dark:text-red-300">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          {existingRequest && (
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-300">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">You already have a pending request for this season</span>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : userTeams.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">
                You don't have any teams eligible for this season
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                Create a team first or ensure you're the team captain
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Team
                </label>
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isSubmitting}
                >
                  {userTeams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Message (Optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add any additional information about your team..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedTeamId || existingRequest}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Submit Request
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
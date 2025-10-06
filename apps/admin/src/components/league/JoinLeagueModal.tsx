/**
 * Join League Modal Component
 * 
 * Modal for team captains to request their team to join a league.
 * Includes team selection and message functionality.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { X, Users, Loader2, MessageSquare, Send, Zap, Star, Calendar } from 'lucide-react';
import { CreateLeagueRequestForm } from '@matchday/database';
import { supabase } from '@/lib/supabase/client';

interface Team {
  id: string;
  name: string;
  team_color?: string;
  team_bio?: string;
  league_id?: string;
}

interface League {
  id: string;
  name: string;
  description?: string;
  location?: string;
  sport_type: string;
  league_type: string;
  entry_fee?: number;
  auto_approve_teams?: boolean;
  registration_deadline?: string;
  featured?: boolean;
}

interface JoinLeagueModalProps {
  isOpen: boolean;
  onClose: () => void;
  league: League;
  onRequestSent: () => void;
}

interface FormErrors {
  team_id?: string;
  general?: string;
}

export const JoinLeagueModal: React.FC<JoinLeagueModalProps> = ({
  isOpen,
  onClose,
  league,
  onRequestSent
}) => {
  const [formData, setFormData] = useState<CreateLeagueRequestForm & { team_id: string }>({
    league_id: league.id,
    team_id: '',
    message: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);

  // Load user's teams when modal opens
  useEffect(() => {
    if (isOpen) {
      loadUserTeams();
      setFormData({
        league_id: league.id,
        team_id: '',
        message: ''
      });
      setErrors({});
    }
  }, [isOpen, league.id]);

  const loadUserTeams = async () => {
    try {
      setLoadingTeams(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setErrors({ general: 'Authentication required' });
        return;
      }

      const response = await fetch('/api/teams', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        // Filter teams that aren't already in a league and where user is captain
        const availableTeams = (result.data || []).filter((team: any) => 
          !team.league_id && team.captain_id === session.user.id
        );
        setTeams(availableTeams);
      } else {
        setErrors({ general: 'Failed to load teams' });
      }
    } catch (error) {
      console.error('Error loading teams:', error);
      setErrors({ general: 'Failed to load teams' });
    } finally {
      setLoadingTeams(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.team_id) {
      newErrors.team_id = 'Please select a team';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof (CreateLeagueRequestForm & { team_id: string }), value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear errors for this field
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Clear general error
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setErrors({});

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`/api/teams/${formData.team_id}/league-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          league_id: formData.league_id,
          message: formData.message?.trim() || undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit request');
      }

      const result = await response.json();
      
      // Success - show different messages for auto-approval vs request
      if (result.auto_approved) {
        // Show success message for instant join
        alert(`🎉 Success! Your team has instantly joined ${league.name}!`);
      } else {
        // Show success message for request submission
        alert(`✅ Request submitted! The league admin will review your team's application.`);
      }
      
      onRequestSent();
      onClose();

    } catch (error) {
      console.error('Error submitting league request:', error);
      setErrors({ 
        general: error instanceof Error ? error.message : 'Failed to submit request' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Join League
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {league.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* General Error */}
          {errors.general && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{errors.general}</p>
            </div>
          )}

          {/* League Info */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-medium text-blue-900 dark:text-blue-100">
                {league.name}
              </h3>
              <div className="flex gap-1">
                {league.featured && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
                    <Star className="w-3 h-3 text-yellow-600 dark:text-yellow-400 fill-current" />
                    <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">
                      Featured
                    </span>
                  </div>
                )}
                {league.auto_approve_teams && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/20 rounded-full">
                    <Zap className="w-3 h-3 text-green-600 dark:text-green-400" />
                    <span className="text-xs font-medium text-green-600 dark:text-green-400">
                      Instant Join
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {league.auto_approve_teams && (
              <div className="mb-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-2 text-green-800 dark:text-green-200 text-sm font-medium">
                  <Zap className="w-4 h-4" />
                  Your team will be instantly accepted!
                </div>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  No waiting for approval - you'll join the league immediately.
                </p>
              </div>
            )}

            {league.description && (
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                {league.description}
              </p>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700 dark:text-blue-300">Sport:</span>
                <span className="ml-1 capitalize">{league.sport_type}</span>
              </div>
              <div>
                <span className="text-blue-700 dark:text-blue-300">Type:</span>
                <span className="ml-1 capitalize">{league.league_type}</span>
              </div>
              {league.location && (
                <div className="col-span-2">
                  <span className="text-blue-700 dark:text-blue-300">Location:</span>
                  <span className="ml-1">{league.location}</span>
                </div>
              )}
              {league.registration_deadline && (
                <div className="col-span-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-700 dark:text-blue-300" />
                    <span className="text-blue-700 dark:text-blue-300">Registration Deadline:</span>
                    <span className="ml-1">{new Date(league.registration_deadline).toLocaleDateString()}</span>
                  </div>
                </div>
              )}
              {league.entry_fee !== undefined && (
                <div>
                  <span className="text-blue-700 dark:text-blue-300">Entry Fee:</span>
                  <span className="ml-1">
                    {league.entry_fee === 0 ? 'Free' : `$${league.entry_fee}`}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Team Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Users className="w-4 h-4 inline mr-2" />
              Select Team *
            </label>
            {loadingTeams ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600 dark:text-gray-400">Loading teams...</span>
              </div>
            ) : teams.length === 0 ? (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  No eligible teams found. You need to be the captain of a team that isn't already in a league.
                </p>
              </div>
            ) : (
              <select
                value={formData.team_id}
                onChange={(e) => handleInputChange('team_id', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  errors.team_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                disabled={isSubmitting}
              >
                <option value="">Choose a team</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            )}
            {errors.team_id && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.team_id}</p>
            )}
          </div>

          {/* Message Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <MessageSquare className="w-4 h-4 inline mr-2" />
              Message to League Admin (Optional)
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-none"
              placeholder="Tell the league admin why your team would be a great addition..."
              disabled={isSubmitting}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Introduce your team and explain why you'd like to join this league
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`flex-1 px-4 py-3 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${
                league.auto_approve_teams
                  ? 'bg-green-600 hover:bg-green-700 disabled:bg-green-400'
                  : 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400'
              }`}
              disabled={isSubmitting || teams.length === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {league.auto_approve_teams ? 'Joining...' : 'Submitting...'}
                </>
              ) : league.auto_approve_teams ? (
                <>
                  <Zap className="w-4 h-4" />
                  Join Instantly
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
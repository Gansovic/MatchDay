/**
 * Create Match Modal Component
 * 
 * Modal for creating new matches between teams
 * Allows team captains to schedule matches with other teams
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  MapPin, 
  Users, 
  Clock,
  Loader2,
  AlertCircle,
  Check
} from 'lucide-react';

interface Team {
  id: string;
  name: string;
  team_color?: string;
}

interface CreateMatchData {
  homeTeamId: string;
  awayTeamId: string;
  matchDate: string;
  matchTime: string;
  venue: string;
  matchType: 'friendly' | 'league' | 'tournament';
}

interface CreateMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  userTeams: Team[];
  availableTeams: Team[];
  onMatchCreated?: (match: any) => void;
}

export const CreateMatchModal: React.FC<CreateMatchModalProps> = ({
  isOpen,
  onClose,
  userTeams = [],
  availableTeams = [],
  onMatchCreated
}) => {
  const [formData, setFormData] = useState<CreateMatchData>({
    homeTeamId: '',
    awayTeamId: '',
    matchDate: '',
    matchTime: '',
    venue: '',
    matchType: 'friendly'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        homeTeamId: '',
        awayTeamId: '',
        matchDate: '',
        matchTime: '',
        venue: '',
        matchType: 'friendly'
      });
      setError(null);
      setSuccess(null);
    }
  }, [isOpen]);

  // Filter available teams (exclude user's teams and already selected teams)
  const getAvailableAwayTeams = () => {
    return availableTeams.filter(team => 
      team.id !== formData.homeTeamId && 
      !userTeams.some(userTeam => userTeam.id === team.id)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.homeTeamId || !formData.awayTeamId || !formData.matchDate || !formData.matchTime) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.homeTeamId === formData.awayTeamId) {
      setError('Home and away teams must be different');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const matchDateTime = `${formData.matchDate}T${formData.matchTime}:00.000Z`;
      
      const response = await fetch('/api/matches/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          homeTeamId: formData.homeTeamId,
          awayTeamId: formData.awayTeamId,
          matchDate: matchDateTime,
          venue: formData.venue || 'TBD',
          matchType: formData.matchType
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create match');
      }

      const result = await response.json();
      
      setSuccess('Match created successfully!');
      onMatchCreated?.(result.data);
      
      // Close modal after short delay
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create match');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof CreateMatchData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null); // Clear error when user makes changes
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Create New Match
          </h3>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Success Message */}
          {success && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2 text-green-800 dark:text-green-300">
                <Check className="w-4 h-4" />
                {success}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2 text-red-800 dark:text-red-300">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            </div>
          )}

          {/* Team Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your Team (Home) *
              </label>
              <select
                value={formData.homeTeamId}
                onChange={(e) => handleInputChange('homeTeamId', e.target.value)}
                disabled={isSubmitting}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="">Select your team</option>
                {userTeams.map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Opponent Team (Away) *
              </label>
              <select
                value={formData.awayTeamId}
                onChange={(e) => handleInputChange('awayTeamId', e.target.value)}
                disabled={isSubmitting || !formData.homeTeamId}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="">Select opponent</option>
                {getAvailableAwayTeams().map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Match Date *
              </label>
              <input
                type="date"
                value={formData.matchDate}
                onChange={(e) => handleInputChange('matchDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                disabled={isSubmitting}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Match Time *
              </label>
              <input
                type="time"
                value={formData.matchTime}
                onChange={(e) => handleInputChange('matchTime', e.target.value)}
                disabled={isSubmitting}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Venue and Match Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Venue
              </label>
              <input
                type="text"
                value={formData.venue}
                onChange={(e) => handleInputChange('venue', e.target.value)}
                placeholder="Enter venue name"
                disabled={isSubmitting}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Match Type
              </label>
              <select
                value={formData.matchType}
                onChange={(e) => handleInputChange('matchType', e.target.value as 'friendly' | 'league' | 'tournament')}
                disabled={isSubmitting}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="friendly">Friendly Match</option>
                <option value="league">League Match</option>
                <option value="tournament">Tournament Match</option>
              </select>
            </div>
          </div>

          {/* Form Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4" />
                  Create Match
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
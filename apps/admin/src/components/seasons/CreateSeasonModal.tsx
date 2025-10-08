'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, Users, Trophy, AlertCircle, Loader2 } from 'lucide-react';
import { SeasonService } from '@matchday/services';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';

interface CreateSeasonData {
  name: string;
  display_name: string;
  league_id: string;
  season_year: number;
  tournament_format: 'league' | 'knockout' | 'hybrid';
  start_date: string;
  end_date: string;
  registration_deadline: string;
  min_teams: number;
  max_teams: number;
  status: 'draft' | 'registration';
}

interface CreateSeasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSeasonCreated: () => void;
  selectedLeagueId?: string;
}

export const CreateSeasonModal: React.FC<CreateSeasonModalProps> = ({
  isOpen,
  onClose,
  onSeasonCreated,
  selectedLeagueId
}) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentYear = new Date().getFullYear();

  const [formData, setFormData] = useState<CreateSeasonData>({
    name: '',
    display_name: '',
    league_id: selectedLeagueId || '',
    season_year: currentYear,
    tournament_format: 'league',
    start_date: '',
    end_date: '',
    registration_deadline: '',
    min_teams: 4,
    max_teams: 16,
    status: 'draft'
  });

  // Update league_id when selectedLeagueId changes
  useEffect(() => {
    if (selectedLeagueId) {
      setFormData(prev => ({ ...prev, league_id: selectedLeagueId }));
    }
  }, [selectedLeagueId]);

  const handleInputChange = (field: keyof CreateSeasonData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-generate display name if not manually set
    if (field === 'name' && typeof value === 'string') {
      setFormData(prev => ({
        ...prev,
        display_name: prev.display_name === '' ? value : prev.display_name
      }));
    }
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) return 'Season name is required';
    if (!formData.start_date) return 'Start date is required';
    if (!formData.end_date) return 'End date is required';
    if (!formData.registration_deadline) return 'Registration deadline is required';

    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);
    const regDeadline = new Date(formData.registration_deadline);

    if (regDeadline >= startDate) {
      return 'Registration deadline must be before season start date';
    }

    if (startDate >= endDate) {
      return 'End date must be after start date';
    }

    if (formData.min_teams >= formData.max_teams) {
      return 'Maximum teams must be greater than minimum teams';
    }

    if (formData.min_teams < 2) {
      return 'Minimum teams must be at least 2';
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
      setError('You must be logged in to create a season');
      return;
    }

    setIsSubmitting(true);

    try {
      const seasonService = SeasonService.getInstance(supabase);
      const result = await seasonService.createSeason({
        ...formData,
        created_by: user.id
      });

      if (!result.success || !result.data) {
        throw new Error(result.error?.message || 'Failed to create season');
      }

      onSeasonCreated();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create season');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      display_name: '',
      league_id: selectedLeagueId || '',
      season_year: currentYear,
      tournament_format: 'league',
      start_date: '',
      end_date: '',
      registration_deadline: '',
      min_teams: 4,
      max_teams: 16,
      status: 'draft'
    });
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Create New Season
          </h2>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2 text-red-800 dark:text-red-300">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Season Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Spring 2024 Championship"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={formData.display_name}
                onChange={(e) => handleInputChange('display_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Public display name (optional)"
              />
            </div>
          </div>

          {/* Tournament Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tournament Format *
            </label>
            <select
              value={formData.tournament_format}
              onChange={(e) => handleInputChange('tournament_format', e.target.value as 'league' | 'knockout' | 'hybrid')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="league">League (Round Robin)</option>
              <option value="knockout">Knockout (Elimination)</option>
              <option value="hybrid">Hybrid (League + Playoffs)</option>
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Registration Deadline *
              </label>
              <input
                type="date"
                value={formData.registration_deadline}
                onChange={(e) => handleInputChange('registration_deadline', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Season Start Date *
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => handleInputChange('start_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Season End Date *
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => handleInputChange('end_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Team Limits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Minimum Teams *
              </label>
              <input
                type="number"
                value={formData.min_teams}
                onChange={(e) => handleInputChange('min_teams', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min={2}
                max={64}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Maximum Teams *
              </label>
              <input
                type="number"
                value={formData.max_teams}
                onChange={(e) => handleInputChange('max_teams', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min={2}
                max={64}
                required
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Initial Status *
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value as 'draft' | 'registration')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="draft">Draft (Private)</option>
              <option value="registration">Open for Registration</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Trophy className="w-4 h-4" />
                  Create Season
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
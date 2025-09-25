/**
 * Create League Modal Component
 * 
 * Modal for creating new leagues with comprehensive settings
 */

'use client';

import React, { useState } from 'react';
import { 
  Trophy,
  X,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Globe,
  Lock,
  Loader2
} from 'lucide-react';

interface CreateLeagueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeagueCreated: (league: any) => void;
}

interface CreateLeagueForm {
  name: string;
  description: string;
  sport_type: string;
  league_type: 'recreational' | 'competitive' | 'semi-pro';
  location: string;
  season_start: string;
  season_end: string;
  max_teams: number;
  entry_fee: number;
  is_public: boolean;
}

export const CreateLeagueModal: React.FC<CreateLeagueModalProps> = ({
  isOpen,
  onClose,
  onLeagueCreated
}) => {
  const [form, setForm] = useState<CreateLeagueForm>({
    name: '',
    description: '',
    sport_type: 'football',
    league_type: 'recreational',
    location: '',
    season_start: '',
    season_end: '',
    max_teams: 16,
    entry_fee: 0,
    is_public: true
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate form
      if (!form.name.trim()) {
        throw new Error('League name is required');
      }

      if (!form.description.trim()) {
        throw new Error('League description is required');
      }

      // Create league via API
      const response = await fetch('/api/leagues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...form,
          season: form.season_start && form.season_end ? 
            `${new Date(form.season_start).getFullYear()}/${new Date(form.season_end).getFullYear()}` : 
            undefined
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create league');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create league');
      }

      // Reset form and close modal
      setForm({
        name: '',
        description: '',
        sport_type: 'football',
        league_type: 'recreational',
        location: '',
        season_start: '',
        season_end: '',
        max_teams: 16,
        entry_fee: 0,
        is_public: true
      });

      onLeagueCreated(result.data);
      onClose();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create league';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof CreateLeagueForm, value: any) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <Trophy className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Create New League
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Set up a new league for teams to join
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Basic Information
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                League Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter league name"
                disabled={isSubmitting}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description *
              </label>
              <textarea
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Describe your league"
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sport Type
                </label>
                <select
                  value={form.sport_type}
                  onChange={(e) => handleChange('sport_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  disabled={isSubmitting}
                >
                  <option value="football">Football ⚽</option>
                  <option value="basketball">Basketball 🏀</option>
                  <option value="baseball">Baseball ⚾</option>
                  <option value="tennis">Tennis 🎾</option>
                  <option value="volleyball">Volleyball 🏐</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  League Level
                </label>
                <select
                  value={form.league_type}
                  onChange={(e) => handleChange('league_type', e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  disabled={isSubmitting}
                >
                  <option value="recreational">Recreational 🌟</option>
                  <option value="competitive">Competitive 🔥</option>
                  <option value="semi-pro">Semi-Pro ⚡</option>
                </select>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              League Settings
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <MapPin className="inline w-4 h-4 mr-1" />
                Location
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => handleChange('location', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="City, region, or venue"
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  Season Start
                </label>
                <input
                  type="date"
                  value={form.season_start}
                  onChange={(e) => handleChange('season_start', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  Season End
                </label>
                <input
                  type="date"
                  value={form.season_end}
                  onChange={(e) => handleChange('season_end', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Users className="inline w-4 h-4 mr-1" />
                  Max Teams
                </label>
                <input
                  type="number"
                  min="2"
                  max="32"
                  value={form.max_teams}
                  onChange={(e) => handleChange('max_teams', parseInt(e.target.value) || 16)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <DollarSign className="inline w-4 h-4 mr-1" />
                  Entry Fee
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.entry_fee}
                  onChange={(e) => handleChange('entry_fee', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="0.00"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                {form.is_public ? (
                  <Globe className="w-5 h-5 text-green-600" />
                ) : (
                  <Lock className="w-5 h-5 text-gray-600" />
                )}
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {form.is_public ? 'Public League' : 'Private League'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {form.is_public 
                      ? 'Anyone can discover and join this league'
                      : 'Only invited teams can join this league'
                    }
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleChange('is_public', !form.is_public)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  form.is_public ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
                disabled={isSubmitting}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    form.is_public ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !form.name.trim() || !form.description.trim()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create League'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
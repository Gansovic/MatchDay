/**
 * LeagueSettingsModal Component
 *
 * Modal for editing league settings in the admin app
 * Allows updating: name, description, logo, public/private status,
 * active/inactive status, max teams, entry fee, sport type, league type, location
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Loader2,
  AlertCircle,
  Image as ImageIcon,
  MapPin,
  Users,
  DollarSign,
  Trophy,
  Shield,
  Globe,
  Lock,
  Trash2
} from 'lucide-react';

interface LeagueData {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  is_public: boolean;
  is_active: boolean;
  max_teams: number;
  entry_fee: number;
  sport_type: 'football' | 'basketball' | 'volleyball' | 'other';
  league_type: 'recreational' | 'competitive' | 'semi-pro';
  location?: string;
}

interface LeagueSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  league: LeagueData;
  onSuccess?: (updatedLeague: LeagueData) => void;
  onDeleted?: () => void;
}

export const LeagueSettingsModal: React.FC<LeagueSettingsModalProps> = ({
  isOpen,
  onClose,
  league,
  onSuccess,
  onDeleted
}) => {
  const [formData, setFormData] = useState<LeagueData>(league);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Reset form when league changes
  useEffect(() => {
    setFormData(league);
    setError(null);
    setSuccessMessage(null);
  }, [league]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/leagues/${league.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update league settings');
      }

      setSuccessMessage('League settings updated successfully!');
      onSuccess?.(result.data);

      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    field: keyof LeagueData,
    value: string | number | boolean
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDelete = async () => {
    if (deleteConfirmText !== league.name) {
      setError('Please type the league name exactly to confirm deletion');
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/leagues/${league.id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete league');
      }

      onDeleted?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-800">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Shield className="w-6 h-6 text-blue-400" />
              League Settings
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Configure league details and preferences
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 font-medium">Error</p>
                <p className="text-red-300 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-900/20 border border-green-800 rounded-lg p-4 flex items-start gap-3">
              <Save className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-green-400 font-medium">Success</p>
                <p className="text-green-300 text-sm mt-1">{successMessage}</p>
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-gray-800 pb-2">
              Basic Information
            </h3>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                League Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter league name"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={3}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Enter league description"
              />
            </div>

            {/* Logo URL */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Logo URL
              </label>
              <input
                type="url"
                value={formData.logo_url || ''}
                onChange={(e) => handleChange('logo_url', e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/logo.png"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Location
              </label>
              <input
                type="text"
                value={formData.location || ''}
                onChange={(e) => handleChange('location', e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter location"
              />
            </div>
          </div>

          {/* League Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-gray-800 pb-2">
              League Configuration
            </h3>

            {/* Sport Type */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Sport Type <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.sport_type}
                onChange={(e) => handleChange('sport_type', e.target.value as LeagueData['sport_type'])}
                required
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="football">Football</option>
                <option value="basketball">Basketball</option>
                <option value="volleyball">Volleyball</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* League Type */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                League Type <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.league_type}
                onChange={(e) => handleChange('league_type', e.target.value as LeagueData['league_type'])}
                required
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="recreational">Recreational</option>
                <option value="competitive">Competitive</option>
                <option value="semi-pro">Semi-Pro</option>
              </select>
            </div>

            {/* Max Teams */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Maximum Teams <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                value={formData.max_teams}
                onChange={(e) => handleChange('max_teams', parseInt(e.target.value))}
                required
                min={2}
                max={100}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Entry Fee */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Entry Fee
              </label>
              <input
                type="number"
                value={formData.entry_fee}
                onChange={(e) => handleChange('entry_fee', parseFloat(e.target.value))}
                min={0}
                step={0.01}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Status Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-gray-800 pb-2">
              Status Settings
            </h3>

            {/* Public/Private Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700">
              <div className="flex items-center gap-3">
                {formData.is_public ? (
                  <Globe className="w-5 h-5 text-green-400" />
                ) : (
                  <Lock className="w-5 h-5 text-orange-400" />
                )}
                <div>
                  <p className="text-white font-medium">
                    {formData.is_public ? 'Public League' : 'Private League'}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {formData.is_public
                      ? 'Anyone can discover and join this league'
                      : 'Only invited users can join this league'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleChange('is_public', !formData.is_public)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.is_public ? 'bg-green-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.is_public ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Active/Inactive Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700">
              <div className="flex items-center gap-3">
                <Shield className={`w-5 h-5 ${formData.is_active ? 'text-blue-400' : 'text-gray-400'}`} />
                <div>
                  <p className="text-white font-medium">
                    {formData.is_active ? 'Active League' : 'Inactive League'}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {formData.is_active
                      ? 'League is currently active and accepting registrations'
                      : 'League is paused and not accepting new registrations'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleChange('is_active', !formData.is_active)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.is_active ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.is_active ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-red-400 border-b border-red-900/50 pb-2">
              Danger Zone
            </h3>

            <div className="bg-red-900/10 border-2 border-red-900/50 rounded-lg p-4">
              <div className="flex items-start gap-3 mb-4">
                <Trash2 className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-red-400 font-medium mb-1">Delete League</h4>
                  <p className="text-gray-400 text-sm mb-2">
                    Permanently delete this league and all associated data including seasons, matches, team registrations, and player statistics.
                  </p>
                  <p className="text-red-300 text-sm font-medium">
                    ⚠️ This action cannot be undone!
                  </p>
                </div>
              </div>

              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isSubmitting || isDeleting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete League
                </button>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-red-400 mb-2">
                      Type <span className="font-bold">{league.name}</span> to confirm deletion:
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder={league.name}
                      disabled={isDeleting}
                      className="w-full px-4 py-2 bg-gray-800 border border-red-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteConfirmText('');
                      }}
                      disabled={isDeleting}
                      className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isDeleting || deleteConfirmText !== league.name}
                      className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          Confirm Delete
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

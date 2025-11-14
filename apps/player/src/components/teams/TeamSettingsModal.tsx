'use client';

import React, { useState, useEffect } from 'react';
import { X, Shield, Loader2, AlertCircle, CheckCircle, Save, Trash2 } from 'lucide-react';
import { TeamLogoUpload } from '../media/team-logo-upload';
import { useAuth } from '../auth/supabase-auth-provider';

interface TeamSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: {
    id: string;
    name: string;
    logo_url?: string;
    team_color?: string;
    team_bio?: string;
    max_players?: number;
  };
  onSuccess: (updatedTeam: any) => void;
}

export const TeamSettingsModal: React.FC<TeamSettingsModalProps> = ({
  isOpen,
  onClose,
  team,
  onSuccess
}) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: team.name || '',
    team_color: team.team_color || '#3b82f6',
    team_bio: team.team_bio || '',
    max_players: team.max_players || 22,
    logo_url: team.logo_url || undefined,
    logo_media_id: undefined as string | undefined
  });

  // Reset form when modal opens or team changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: team.name || '',
        team_color: team.team_color || '#3b82f6',
        team_bio: team.team_bio || '',
        max_players: team.max_players || 22,
        logo_url: team.logo_url || undefined,
        logo_media_id: undefined
      });
      setError(null);
      setSuccess(null);
    }
  }, [isOpen, team]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLogoUploadComplete = async (url: string, mediaId: string) => {
    console.log('🏆 TeamSettingsModal - Logo uploaded:', { url, mediaId });

    // Update local state immediately
    setFormData(prev => ({
      ...prev,
      logo_url: url,
      logo_media_id: mediaId
    }));

    // Save logo to database immediately (like profile photo does)
    try {
      console.log('🏆 TeamSettingsModal - Saving logo to database immediately...');
      const response = await fetch(`/api/teams/${team.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          logo_url: url,
          logo_media_id: mediaId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save logo');
      }

      console.log('🏆 TeamSettingsModal - Logo saved to database successfully');
      setSuccess('Logo uploaded and saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('🏆 TeamSettingsModal - Error saving logo:', err);
      setError(err instanceof Error ? err.message : 'Failed to save logo');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Team name is required');
      return;
    }

    if (!user?.id) {
      setError('You must be logged in to update team settings');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('🏆 TeamSettingsModal - Updating team with data:', formData);

      // Build update payload (logo is saved separately on upload)
      const updatePayload = {
        name: formData.name,
        team_color: formData.team_color,
        team_bio: formData.team_bio,
        max_players: formData.max_players
      };

      const response = await fetch(`/api/teams/${team.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatePayload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update team settings');
      }

      const result = await response.json();
      console.log('🏆 TeamSettingsModal - Team updated successfully:', result);

      setSuccess('Team settings updated successfully!');
      setTimeout(() => {
        onSuccess(result.data);
        handleClose();
      }, 1500);
    } catch (err) {
      console.error('🏆 TeamSettingsModal - Update error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update team settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!user?.id) {
      setError('You must be logged in to delete a team');
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      console.log('🗑️ Deleting team:', team.id);

      const response = await fetch(`/api/teams/${team.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete team');
      }

      console.log('✅ Team deleted successfully');
      setSuccess('Team deleted successfully!');

      // Close modal and notify parent after short delay
      setTimeout(() => {
        onSuccess({ deleted: true, teamId: team.id });
        handleClose();
      }, 1500);
    } catch (err) {
      console.error('❌ Error deleting team:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete team');
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting && !isDeleting) {
      setShowDeleteConfirm(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              Team Settings
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage {team.name}'s settings and appearance
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Success Message */}
          {success && (
            <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900 dark:text-green-100">{success}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900 dark:text-red-100">Error</p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Team Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Team Logo
            </label>
            <TeamLogoUpload
              teamId={team.id}
              teamName={formData.name || team.name}
              currentLogoUrl={formData.logo_url || team.logo_url}
              onUploadComplete={handleLogoUploadComplete}
            />
          </div>

          {/* Team Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Team Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter team name"
              className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
              required
            />
          </div>

          {/* Team Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Team Color
            </label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={formData.team_color}
                onChange={(e) => handleInputChange('team_color', e.target.value)}
                className="w-16 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                disabled={isSubmitting}
              />
              <input
                type="text"
                value={formData.team_color}
                onChange={(e) => handleInputChange('team_color', e.target.value)}
                placeholder="#3b82f6"
                className="flex-1 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Team Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Team Bio
            </label>
            <textarea
              value={formData.team_bio}
              onChange={(e) => handleInputChange('team_bio', e.target.value)}
              placeholder="Tell us about your team..."
              rows={3}
              className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* Max Players */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Max Players *
            </label>
            <input
              type="number"
              value={formData.max_players}
              onChange={(e) => handleInputChange('max_players', parseInt(e.target.value) || 1)}
              min="1"
              className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
              required
            />
          </div>

          {/* Danger Zone - Delete Team */}
          <div className="border-t border-red-200 dark:border-red-900 pt-6">
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-3">
              Danger Zone
            </h3>
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                Once you delete a team, there is no going back. This will permanently delete the team, all members, stats, and match history.
              </p>
              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isSubmitting || isDeleting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Team
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-red-900 dark:text-red-100">
                    Are you absolutely sure? This action cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isDeleting}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteTeam}
                      disabled={isDeleting}
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
                          Yes, Delete Team
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

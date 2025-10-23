'use client';

import React, { useState, useEffect } from 'react';
import { X, Shield, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { TeamService } from '@matchday/services';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';
import { TeamLogoUpload } from '../media/team-logo-upload';

interface CreateTeamData {
  name: string;
  league_id: string;
  team_color: string;
  team_bio: string;
  max_players: number;
  min_players: number;
  logo_url?: string;
  logo_media_id?: string;
}

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTeamCreated: () => void;
  leagueId: string;
  leagueName: string;
}

export const CreateTeamModal: React.FC<CreateTeamModalProps> = ({
  isOpen,
  onClose,
  onTeamCreated,
  leagueId,
  leagueName
}) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tempTeamId, setTempTeamId] = useState<string>('temp-' + Date.now());

  const [formData, setFormData] = useState<CreateTeamData>({
    name: '',
    league_id: leagueId,
    team_color: '#3b82f6',
    team_bio: '',
    max_players: 22,
    min_players: 7,
    logo_url: undefined,
    logo_media_id: undefined
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        league_id: leagueId,
        team_color: '#3b82f6',
        team_bio: '',
        max_players: 22,
        min_players: 7,
        logo_url: undefined,
        logo_media_id: undefined
      });
      setTempTeamId('temp-' + Date.now());
      setError(null);
      setSuccess(null);
    }
  }, [isOpen, leagueId]);

  const handleInputChange = (field: keyof CreateTeamData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLogoUploadComplete = (url: string, mediaId: string) => {
    console.log('🏆 CreateTeamModal - Logo uploaded:', { url, mediaId });
    setFormData(prev => ({
      ...prev,
      logo_url: url,
      logo_media_id: mediaId
    }));
    setSuccess('Logo uploaded successfully!');
    setTimeout(() => setSuccess(null), 3000);
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) return 'Team name is required';
    if (formData.min_players < 1) return 'Minimum players must be at least 1';
    if (formData.max_players <= formData.min_players) {
      return 'Maximum players must be greater than minimum players';
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
      setError('You must be logged in to create a team');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('🏆 CreateTeamModal - Creating team with data:', formData);

      const teamService = TeamService.getInstance(supabase);
      const result = await teamService.createTeam(
        user.id,
        {
          name: formData.name,
          league_id: formData.league_id,
          sport: 'soccer', // Default for now
          team_color: formData.team_color,
          description: formData.team_bio,
          max_players: formData.max_players,
          min_players: formData.min_players
        },
        {
          auto_add_creator: true
        }
      );

      if (!result.success || !result.data) {
        throw new Error(result.error?.message || 'Failed to create team');
      }

      console.log('🏆 CreateTeamModal - Team created successfully:', result.data);

      // Update team with logo if uploaded
      if (formData.logo_url && formData.logo_media_id) {
        console.log('🏆 CreateTeamModal - Updating team with logo...');
        const updateResult = await teamService.updateTeam(
          result.data.id,
          user.id,
          {
            logo_url: formData.logo_url,
            logo_media_id: formData.logo_media_id
          }
        );

        if (!updateResult.success) {
          console.warn('🏆 CreateTeamModal - Failed to update logo:', updateResult.error);
          // Don't fail the whole creation if logo update fails
        } else {
          console.log('🏆 CreateTeamModal - Logo updated successfully');
        }
      }

      setSuccess('Team created successfully!');
      setTimeout(() => {
        onTeamCreated();
        handleClose();
      }, 1500);
    } catch (err) {
      console.error('🏆 CreateTeamModal - Creation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create team');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Shield className="w-6 h-6 text-blue-400" />
              Create New Team
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Add a new team to {leagueName}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Success Message */}
          {success && (
            <div className="flex items-start gap-3 p-4 bg-green-900/20 border border-green-800 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-100">{success}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-900/20 border border-red-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-100">Error</p>
                <p className="text-sm text-red-300 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Team Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Team Logo
            </label>
            <TeamLogoUpload
              teamId={tempTeamId}
              teamName={formData.name || 'New Team'}
              currentLogoUrl={formData.logo_url}
              onUploadComplete={handleLogoUploadComplete}
            />
          </div>

          {/* Team Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Team Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter team name"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
              required
            />
          </div>

          {/* Team Color */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Team Color
            </label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={formData.team_color}
                onChange={(e) => handleInputChange('team_color', e.target.value)}
                className="w-16 h-10 rounded border border-gray-700 cursor-pointer"
                disabled={isSubmitting}
              />
              <input
                type="text"
                value={formData.team_color}
                onChange={(e) => handleInputChange('team_color', e.target.value)}
                placeholder="#3b82f6"
                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Team Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Team Bio
            </label>
            <textarea
              value={formData.team_bio}
              onChange={(e) => handleInputChange('team_bio', e.target.value)}
              placeholder="Tell us about your team..."
              rows={3}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* Player Limits */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Min Players *
              </label>
              <input
                type="number"
                value={formData.min_players}
                onChange={(e) => handleInputChange('min_players', parseInt(e.target.value) || 1)}
                min="1"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Max Players *
              </label>
              <input
                type="number"
                value={formData.max_players}
                onChange={(e) => handleInputChange('max_players', parseInt(e.target.value) || 1)}
                min="1"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={handleClose}
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
                  Creating...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Create Team
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

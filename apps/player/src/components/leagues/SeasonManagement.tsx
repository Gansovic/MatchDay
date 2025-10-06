/**
 * Season Management Component
 * 
 * Comprehensive season management interface for leagues that includes:
 * - Season creation and editing
 * - Team registration management
 * - Fixture generation and viewing
 * - Season status tracking
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Calendar,
  Users,
  Trophy,
  Play,
  Pause,
  Settings,
  Eye,
  UserPlus,
  Loader2,
  AlertCircle,
  Check,
  X,
  RotateCcw,
  Target
} from 'lucide-react';
import { CreateSeasonModal } from './CreateSeasonModal';
import { TeamJoinRequestModal } from '../seasons/TeamJoinRequestModal';

export interface Season {
  id: string;
  name: string;
  display_name?: string;
  league_id: string;
  season_year: number;
  status: 'draft' | 'registration' | 'active' | 'completed' | 'cancelled';
  tournament_format: 'league' | 'knockout' | 'hybrid';
  start_date: string;
  end_date: string;
  registration_deadline?: string;
  min_teams?: number;
  max_teams?: number;
  registered_teams_count?: number;
  rounds?: number;
  points_for_win?: number;
  points_for_draw?: number;
  points_for_loss?: number;
  allow_draws?: boolean;
  home_away_balance?: boolean;
  fixtures_status: 'pending' | 'generating' | 'completed' | 'error';
  fixtures_generated_at?: string;
  total_matches_planned?: number;
  created_at: string;
  updated_at: string;
  teams?: Array<{
    id: string;
    team_id: string;
    registration_date: string;
    status: string;
    team: {
      id: string;
      name: string;
      team_color?: string;
      captain_id?: string;
    };
  }>;
}

interface SeasonManagementProps {
  leagueId: string;
  leagueName: string;
}

export const SeasonManagement: React.FC<SeasonManagementProps> = ({
  leagueId,
  leagueName
}) => {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinRequestModal, setShowJoinRequestModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingFixtures, setIsGeneratingFixtures] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadSeasons();
  }, [leagueId]);

  const loadSeasons = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/leagues/${leagueId}/seasons`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load seasons');
      }
      
      const seasonsWithDetails = await Promise.all(
        (result.data || []).map(async (season: Season) => {
          try {
            const detailsResponse = await fetch(`/api/seasons/${season.id}`);
            const detailsResult = await detailsResponse.json();
            return detailsResult.success ? detailsResult.data : season;
          } catch {
            return season;
          }
        })
      );
      
      setSeasons(seasonsWithDetails);
      
      if (seasonsWithDetails.length > 0 && !selectedSeason) {
        setSelectedSeason(seasonsWithDetails[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load seasons');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeasonCreated = (newSeason: Season) => {
    setSeasons(prev => [newSeason, ...prev]);
    setSelectedSeason(newSeason);
    setSuccess('Season created successfully!');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleGenerateFixtures = async (seasonId: string) => {
    setIsGeneratingFixtures(seasonId);
    setError(null);
    
    try {
      const response = await fetch(`/api/seasons/${seasonId}/fixtures`, {
        method: 'POST',
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to generate fixtures');
      }
      
      // Refresh the selected season
      await loadSeasonDetails(seasonId);
      setSuccess('Fixtures generated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate fixtures');
    } finally {
      setIsGeneratingFixtures(null);
    }
  };

  const loadSeasonDetails = async (seasonId: string) => {
    try {
      const response = await fetch(`/api/seasons/${seasonId}`);
      const result = await response.json();
      
      if (result.success) {
        setSelectedSeason(result.data);
        setSeasons(prev => prev.map(s => s.id === seasonId ? result.data : s));
      }
    } catch (err) {
      console.error('Failed to load season details:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'text-gray-600 bg-gray-100';
      case 'registration': return 'text-blue-600 bg-blue-100';
      case 'active': return 'text-green-600 bg-green-100';
      case 'completed': return 'text-purple-600 bg-purple-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getFixturesStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'generating': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Season Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage seasons for {leagueName}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Season
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center gap-2 text-green-800 dark:text-green-300">
            <Check className="w-4 h-4" />
            {success}
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-300">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
            <button onClick={() => setError(null)} className="text-red-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {seasons.length === 0 ? (
        /* No Seasons State */
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No seasons yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Create your first season to start organizing team matchups and competitions.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors mx-auto"
          >
            <Plus className="w-4 h-4" />
            Create First Season
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Seasons List */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Seasons</h3>
              <div className="space-y-2">
                {seasons.map((season) => (
                  <button
                    key={season.id}
                    onClick={() => setSelectedSeason(season)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedSeason?.id === season.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {season.display_name || season.name}
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(season.status)}`}>
                        {season.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {season.registered_teams_count || 0} teams • {formatDate(season.start_date)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Season Details */}
          <div className="lg:col-span-2">
            {selectedSeason && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-6">
                {/* Season Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {selectedSeason.display_name || selectedSeason.name}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(selectedSeason.start_date)} - {formatDate(selectedSeason.end_date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {selectedSeason.registered_teams_count || 0} teams
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(selectedSeason.status)}`}>
                      {selectedSeason.status}
                    </span>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getFixturesStatusColor(selectedSeason.fixtures_status)}`}>
                      fixtures: {selectedSeason.fixtures_status}
                    </span>
                  </div>
                </div>

                {/* Season Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                    <div className="font-bold text-gray-900 dark:text-white text-lg">
                      {selectedSeason.tournament_format}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Format</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                    <div className="font-bold text-gray-900 dark:text-white text-lg">
                      {selectedSeason.rounds || 1}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Rounds</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                    <div className="font-bold text-gray-900 dark:text-white text-lg">
                      {selectedSeason.points_for_win || 3}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Win Points</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                    <div className="font-bold text-gray-900 dark:text-white text-lg">
                      {selectedSeason.total_matches_planned || 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Matches</div>
                  </div>
                </div>

                {/* Teams */}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                    Registered Teams ({selectedSeason.registered_teams_count || 0})
                  </h4>
                  {selectedSeason.teams && selectedSeason.teams.length > 0 ? (
                    <div className="space-y-2">
                      {selectedSeason.teams.map((teamReg) => (
                        <div key={teamReg.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-sm"
                              style={{ backgroundColor: teamReg.team.team_color || '#6B7280' }}
                            >
                              {teamReg.team.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {teamReg.team.name}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                Registered {formatDate(teamReg.registration_date)}
                              </div>
                            </div>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            teamReg.status === 'registered' ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100'
                          }`}>
                            {teamReg.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No teams registered yet</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowJoinRequestModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    Request to Join Season
                  </button>

                  <button
                    onClick={() => handleGenerateFixtures(selectedSeason.id)}
                    disabled={
                      isGeneratingFixtures === selectedSeason.id ||
                      selectedSeason.fixtures_status === 'generating' ||
                      (selectedSeason.registered_teams_count || 0) < 2
                    }
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGeneratingFixtures === selectedSeason.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : selectedSeason.fixtures_status === 'completed' ? (
                      <>
                        <RotateCcw className="w-4 h-4" />
                        Regenerate Fixtures
                      </>
                    ) : (
                      <>
                        <Target className="w-4 h-4" />
                        Generate Fixtures
                      </>
                    )}
                  </button>

                  {selectedSeason.fixtures_status === 'completed' && (
                    <button
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View Fixtures
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Season Modal */}
      <CreateSeasonModal
        leagueId={leagueId}
        leagueName={leagueName}
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSeasonCreated={handleSeasonCreated}
      />

      {/* Team Join Request Modal */}
      {selectedSeason && (
        <TeamJoinRequestModal
          isOpen={showJoinRequestModal}
          onClose={() => setShowJoinRequestModal(false)}
          seasonId={selectedSeason.id}
          seasonName={selectedSeason.display_name || selectedSeason.name}
          leagueId={leagueId}
          onRequestSubmitted={() => {
            setSuccess('Join request submitted successfully!');
            setTimeout(() => setSuccess(null), 3000);
          }}
        />
      )}
    </div>
  );
};
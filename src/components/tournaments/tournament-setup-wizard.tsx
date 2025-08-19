/**
 * Tournament Setup Wizard Component
 * 
 * Provides interface for setting up automated tournament fixtures:
 * - Tournament format selection (League, Knockout, League + Playoffs)
 * - Configuration options (start date, match frequency, etc.)
 * - Fixture preview and generation
 * - Tournament management
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Settings,
  Trophy,
  Users,
  Clock,
  MapPin,
  Eye,
  Play,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader2,
  Info
} from 'lucide-react';
import { TournamentFormat, League } from '@/lib/types/database.types';

interface TournamentSetupWizardProps {
  league: League;
  onFixturesGenerated?: () => void;
}

interface TournamentConfig {
  format: TournamentFormat;
  startDate: string;
  matchFrequency: number;
  playoffTeamsCount: number;
  venue: string;
}

interface FixturePreview {
  totalMatches: number;
  regularSeasonMatches: number;
  playoffMatches: number;
  estimatedEndDate: string;
  fixtures: {
    regularSeason: any[];
    playoffs?: any[];
  };
}

export default function TournamentSetupWizard({ league, onFixturesGenerated }: TournamentSetupWizardProps) {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<TournamentConfig>({
    format: TournamentFormat.LEAGUE,
    startDate: new Date().toISOString().split('T')[0],
    matchFrequency: 7,
    playoffTeamsCount: 4,
    venue: league.location || ''
  });
  
  const [preview, setPreview] = useState<FixturePreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Check if fixtures already exist
  const [existingFixtures, setExistingFixtures] = useState<any>(null);
  const [loadingExisting, setLoadingExisting] = useState(true);

  useEffect(() => {
    checkExistingFixtures();
  }, [league.id]);

  const checkExistingFixtures = async () => {
    try {
      setLoadingExisting(true);
      const response = await fetch(`/api/leagues/${league.id}/fixtures`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.totalMatches > 0) {
          setExistingFixtures(data.data);
        }
      }
    } catch (err) {
      console.error('Error checking existing fixtures:', err);
    } finally {
      setLoadingExisting(false);
    }
  };

  const generatePreview = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/leagues/${league.id}/fixtures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...config,
          preview: true
        })
      });

      const data = await response.json();

      if (data.success) {
        setPreview(data.data);
        setStep(3);
      } else {
        setError(data.error || 'Failed to generate fixture preview');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const generateFixtures = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/leagues/${league.id}/fixtures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Tournament fixtures generated successfully!');
        setStep(4);
        onFixturesGenerated?.();
      } else {
        setError(data.error || 'Failed to generate fixtures');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const deleteExistingFixtures = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/leagues/${league.id}/fixtures`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Existing fixtures deleted successfully!');
        setExistingFixtures(null);
        setStep(1);
      } else {
        setError(data.error || 'Failed to delete fixtures');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTournamentDescription = (format: TournamentFormat): string => {
    switch (format) {
      case TournamentFormat.LEAGUE:
        return 'Single round-robin: Each team plays every other team once. Winner determined by points.';
      case TournamentFormat.KNOCKOUT:
        return 'Single elimination tournament: Teams are eliminated after losing once. Winner determined by bracket progression.';
      case TournamentFormat.LEAGUE_WITH_PLAYOFFS:
        return 'Regular season followed by playoffs: Round-robin season, then top teams advance to knockout playoffs.';
      default:
        return '';
    }
  };

  const getEstimatedMatches = (teamCount: number, format: TournamentFormat, playoffTeams: number): number => {
    const leagueMatches = (teamCount * (teamCount - 1)) / 2; // Single round-robin
    
    switch (format) {
      case TournamentFormat.LEAGUE:
        return leagueMatches;
      case TournamentFormat.KNOCKOUT:
        return teamCount - 1; // Single elimination
      case TournamentFormat.LEAGUE_WITH_PLAYOFFS:
        const playoffMatches = playoffTeams - 1; // Single elimination for playoffs
        return leagueMatches + playoffMatches;
      default:
        return leagueMatches;
    }
  };

  if (loadingExisting) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">Loading tournament data...</span>
        </div>
      </div>
    );
  }

  if (existingFixtures) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tournament Management</h3>
          <Trophy className="w-5 h-5 text-gray-400" />
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-800 dark:text-green-200">Tournament Fixtures Generated</h4>
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                This league has a {existingFixtures.league.tournament_format.replace('_', ' + ')} tournament with {existingFixtures.totalMatches} matches scheduled.
              </p>
              <div className="mt-3 flex items-center gap-6 text-sm text-green-600 dark:text-green-400">
                <span>Regular Season: {existingFixtures.regularSeasonMatches} matches</span>
                {existingFixtures.playoffMatches > 0 && (
                  <span>Playoffs: {existingFixtures.playoffMatches} matches</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setStep(1)}
            className="px-4 py-2 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          >
            View Configuration
          </button>
          <button
            onClick={deleteExistingFixtures}
            disabled={loading}
            className="px-4 py-2 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {loading ? 'Deleting...' : 'Delete & Regenerate'}
          </button>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="mt-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-sm text-green-600 dark:text-green-400">{success}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tournament Setup Wizard</h3>
        <Trophy className="w-5 h-5 text-gray-400" />
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3, 4].map((num) => (
          <div key={num} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= num 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
            }`}>
              {step > num ? <CheckCircle className="w-4 h-4" /> : num}
            </div>
            {num < 4 && (
              <div className={`w-12 h-0.5 ml-2 ${
                step > num ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Choose Tournament Format</h4>
            
            <div className="space-y-4">
              {Object.values(TournamentFormat).map((format) => (
                <label key={format} className="flex items-start gap-3 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    value={format}
                    checked={config.format === format}
                    onChange={(e) => setConfig(prev => ({ ...prev, format: e.target.value as TournamentFormat }))}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white capitalize">
                      {format.replace('_', ' + ')}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {getTournamentDescription(format)}
                    </p>
                    <div className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                      ~{getEstimatedMatches(league.teamCount || 8, format, config.playoffTeamsCount)} matches estimated
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setStep(2)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Next: Configure Tournament
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Tournament Configuration</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Tournament Start Date
                </label>
                <input
                  type="date"
                  value={config.startDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setConfig(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Match Frequency (days)
                </label>
                <select
                  value={config.matchFrequency}
                  onChange={(e) => setConfig(prev => ({ ...prev, matchFrequency: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value={1}>Daily</option>
                  <option value={3}>Every 3 days</option>
                  <option value={7}>Weekly</option>
                  <option value={14}>Bi-weekly</option>
                </select>
              </div>

              {config.format === TournamentFormat.LEAGUE_WITH_PLAYOFFS && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Users className="w-4 h-4 inline mr-1" />
                    Teams in Playoffs
                  </label>
                  <select
                    value={config.playoffTeamsCount}
                    onChange={(e) => setConfig(prev => ({ ...prev, playoffTeamsCount: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value={2}>Top 2 teams</option>
                    <option value={4}>Top 4 teams</option>
                    <option value={8}>Top 8 teams</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Venue (optional)
                </label>
                <input
                  type="text"
                  value={config.venue}
                  onChange={(e) => setConfig(prev => ({ ...prev, venue: e.target.value }))}
                  placeholder="Main Stadium"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Back
            </button>
            <button
              onClick={generatePreview}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              {loading ? 'Generating...' : 'Preview Fixtures'}
            </button>
          </div>
        </div>
      )}

      {step === 3 && preview && (
        <div className="space-y-6">
          <div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Fixture Preview</h4>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <h5 className="font-medium text-blue-800 dark:text-blue-200">Tournament Summary</h5>
                  <div className="mt-2 space-y-1 text-sm text-blue-600 dark:text-blue-400">
                    <p>Format: {config.format.replace('_', ' + ')} tournament</p>
                    <p>Total matches: {preview.totalMatches}</p>
                    <p>Start date: {formatDate(config.startDate)}</p>
                    <p>Estimated end: {formatDate(preview.estimatedEndDate)}</p>
                    <p>Match frequency: Every {config.matchFrequency} days</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 dark:text-white mb-2">Regular Season</h5>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{preview.regularSeasonMatches}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">matches</div>
              </div>

              {preview.playoffMatches > 0 && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 dark:text-white mb-2">Playoffs</h5>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{preview.playoffMatches}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">matches</div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep(2)}
              className="px-6 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Back
            </button>
            <button
              onClick={generateFixtures}
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              {loading ? 'Generating...' : 'Generate Tournament'}
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Tournament Generated Successfully!</h4>
            <p className="text-gray-600 dark:text-gray-400">
              Your {config.format.replace('_', ' + ')} tournament has been created with all fixtures scheduled.
              You can now view the matches in the Matches tab.
            </p>
          </div>

          <button
            onClick={() => {
              setStep(1);
              setPreview(null);
              checkExistingFixtures();
            }}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Done
          </button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
          </div>
        </div>
      )}
    </div>
  );
}
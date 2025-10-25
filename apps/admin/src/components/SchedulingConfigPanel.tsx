'use client';

import { useState, useEffect } from 'react';
import { Settings, Calendar, Clock, Users, Save, AlertCircle, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export interface SchedulingConfig {
  match_day: string; // Day of week: 'monday', 'tuesday', etc.
  match_start_time: string; // Start time: '19:00:00'
  match_end_time: string; // End time: '21:00:00'
  courts_available: number; // Number of courts
  games_per_court: number; // Games per court in time window
  rest_weeks_between_matches: number; // Weeks between team matches
}

interface SchedulingConfigPanelProps {
  seasonId: string;
  leagueId: string;
  disabled?: boolean;
  onConfigChange?: (config: SchedulingConfig) => void;
}

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
];

export default function SchedulingConfigPanel({
  seasonId,
  leagueId,
  disabled = false,
  onConfigChange
}: SchedulingConfigPanelProps) {
  const [config, setConfig] = useState<SchedulingConfig>({
    match_day: 'saturday',
    match_start_time: '19:00:00',
    match_end_time: '21:00:00',
    courts_available: 1,
    games_per_court: 2,
    rest_weeks_between_matches: 0
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Calculate total capacity
  const totalCapacity = config.courts_available * config.games_per_court;

  // Load scheduling configuration
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current session for authentication
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('You must be logged in');
        }

        const response = await fetch(`/api/seasons/${seasonId}/scheduling`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        if (!response.ok) {
          // Silently handle errors - scheduling config may not exist yet or permissions may not be set
          if (response.status === 404 || response.status === 403) {
            // This is normal for new seasons or if user doesn't have permissions
            return;
          }
          // For other errors, just silently return without throwing
          console.warn('Could not load scheduling configuration (this is normal if fixtures already exist)');
          return;
        }

        const result = await response.json();
        if (result.success && result.data) {
          setConfig(result.data);
          // Notify parent of initial config
          if (onConfigChange) {
            onConfigChange(result.data);
          }
        }
      } catch (err) {
        // Silently handle all errors - this component is optional
        // Don't clutter console or show errors to user
        return;
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, [seasonId, onConfigChange]);

  // Helper to update config and notify parent
  const updateConfig = (newConfig: SchedulingConfig) => {
    setConfig(newConfig);
    if (onConfigChange) {
      onConfigChange(newConfig);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      // Get current session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('You must be logged in');
      }

      const response = await fetch(`/api/seasons/${seasonId}/scheduling`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(config)
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Failed to save configuration');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save scheduling config:', err);
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-800 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-800 rounded"></div>
            <div className="h-20 bg-gray-800 rounded"></div>
            <div className="h-20 bg-gray-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Settings className="w-5 h-5 text-purple-400" />
          <h2 className="text-xl font-semibold text-white">Match Scheduling</h2>
        </div>
        <button
          onClick={handleSave}
          disabled={disabled || saving}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            disabled || saving
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-700 text-white'
          }`}
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-900/30 border border-green-700 rounded-lg">
          <p className="text-sm text-green-300">Configuration saved successfully!</p>
        </div>
      )}

      {/* Info Box */}
      <div className="mb-6 p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
        <p className="text-sm text-blue-300">
          Configure when and where your league plays. All games in a matchday happen at the same time on different courts.
        </p>
      </div>

      <div className="space-y-6">
        {/* Match Day */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
            <Calendar className="w-4 h-4" />
            Match Day
          </label>
          <select
            value={config.match_day}
            onChange={(e) => updateConfig({ ...config, match_day: e.target.value })}
            disabled={disabled}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {DAYS_OF_WEEK.map(day => (
              <option key={day.value} value={day.value}>
                {day.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Which day of the week matches are played
          </p>
        </div>

        {/* Time Window */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
              <Clock className="w-4 h-4" />
              Start Time
            </label>
            <input
              type="time"
              value={config.match_start_time.substring(0, 5)}
              onChange={(e) => updateConfig({ ...config, match_start_time: `${e.target.value}:00` })}
              disabled={disabled}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
              <Clock className="w-4 h-4" />
              End Time
            </label>
            <input
              type="time"
              value={config.match_end_time.substring(0, 5)}
              onChange={(e) => updateConfig({ ...config, match_end_time: `${e.target.value}:00` })}
              disabled={disabled}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>
        <p className="text-xs text-gray-500 -mt-4">
          Example: 19:00 to 21:00 (2-hour match window)
        </p>

        {/* Courts Available */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
            <Users className="w-4 h-4" />
            Courts/Pitches Available
          </label>
          <input
            type="number"
            min="1"
            max="20"
            value={config.courts_available}
            onChange={(e) => updateConfig({ ...config, courts_available: parseInt(e.target.value) || 1 })}
            disabled={disabled}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <p className="mt-1 text-xs text-gray-500">
            How many courts/pitches can be used simultaneously
          </p>
        </div>

        {/* Games Per Court */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
            <TrendingUp className="w-4 h-4" />
            Games Per Court
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={config.games_per_court}
            onChange={(e) => updateConfig({ ...config, games_per_court: parseInt(e.target.value) || 1 })}
            disabled={disabled}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <p className="mt-1 text-xs text-gray-500">
            How many games can be played per court during the match window
          </p>
        </div>

        {/* Total Capacity Display */}
        <div className="p-4 bg-purple-900/20 border border-purple-700/50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Total Matchday Capacity:</span>
            <span className="text-2xl font-bold text-purple-400">{totalCapacity} games</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {config.courts_available} {config.courts_available === 1 ? 'court' : 'courts'} × {config.games_per_court} {config.games_per_court === 1 ? 'game' : 'games'} = {totalCapacity} games per matchday
          </p>
        </div>

        {/* Rest Weeks */}
        <div>
          <label className="text-sm font-medium text-gray-300 mb-2 block">
            Rest Weeks Between Matches
          </label>
          <input
            type="number"
            min="0"
            max="4"
            value={config.rest_weeks_between_matches}
            onChange={(e) => updateConfig({ ...config, rest_weeks_between_matches: parseInt(e.target.value) || 0 })}
            disabled={disabled}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <p className="mt-1 text-xs text-gray-500">
            Minimum weeks a team must rest between matches (0 = teams can play every week)
          </p>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Wand2, AlertCircle, Trash2, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface FixtureGenerationPanelProps {
  seasonId: string;
  leagueId: string;
  hasExistingFixtures: boolean;
  fixturesCount: number;
  onFixturesGenerated: () => void;
  onPreview: (previewData: any) => void;
}

export default function FixtureGenerationPanel({
  seasonId,
  leagueId,
  hasExistingFixtures,
  fixturesCount,
  onFixturesGenerated,
  onPreview
}: FixtureGenerationPanelProps) {
  const [generating, setGenerating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleGeneratePreview = async () => {
    try {
      setPreviewing(true);
      setError(null);
      setSuccess(null);

      // Get current session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('You must be logged in');
      }

      const response = await fetch(`/api/seasons/${seasonId}/fixtures/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ preview: true })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || 'Failed to generate preview');
      }

      if (result.success && result.data) {
        onPreview(result.data);
      }
    } catch (err) {
      console.error('Failed to generate preview:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate preview');
    } finally {
      setPreviewing(false);
    }
  };

  const handleGenerate = async () => {
    if (!confirm('Are you sure you want to generate fixtures? This will create all matches for the season.')) {
      return;
    }

    try {
      setGenerating(true);
      setError(null);
      setSuccess(null);

      // Get current session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('You must be logged in');
      }

      const response = await fetch(`/api/seasons/${seasonId}/fixtures/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ preview: false })
      });

      console.log('Response status:', response.status, response.statusText);

      let result;
      try {
        result = await response.json();
        console.log('Generate fixtures response:', result);
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError);
        const text = await response.text();
        console.error('Raw response:', text);
        throw new Error(`Server error (${response.status}): Unable to parse response`);
      }

      if (!response.ok) {
        const errorMsg = result.message || result.error || 'Failed to generate fixtures';
        console.error('Generate fixtures failed:', errorMsg, result);
        throw new Error(errorMsg);
      }

      if (result.success) {
        setSuccess(result.message || 'Fixtures generated successfully!');
        setTimeout(() => setSuccess(null), 5000);
        onFixturesGenerated();
      }
    } catch (err) {
      console.error('Failed to generate fixtures:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate fixtures');
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete all ${fixturesCount} fixtures? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeleting(true);
      setError(null);
      setSuccess(null);

      // Get current session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('You must be logged in');
      }

      const response = await fetch(`/api/seasons/${seasonId}/fixtures`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || 'Failed to delete fixtures');
      }

      if (result.success) {
        setSuccess(result.message || 'Fixtures deleted successfully!');
        setTimeout(() => setSuccess(null), 3000);
        onFixturesGenerated();
      }
    } catch (err) {
      console.error('Failed to delete fixtures:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete fixtures');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Wand2 className="w-5 h-5 text-green-400" />
        <h2 className="text-xl font-semibold text-white">Fixture Generation</h2>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-300 font-medium">{error}</p>
            {error.includes('Not enough available match dates') && (
              <p className="text-xs text-red-400 mt-1">
                Suggestion: Try increasing the season duration, adding more available match days, or reducing rest days between matches.
              </p>
            )}
          </div>
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-900/30 border border-green-700 rounded-lg">
          <p className="text-sm text-green-300">{success}</p>
        </div>
      )}

      {/* Status Info */}
      {hasExistingFixtures && (
        <div className="mb-4 p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
          <p className="text-sm text-blue-300">
            <span className="font-semibold">{fixturesCount} fixtures</span> have been generated for this season.
          </p>
        </div>
      )}

      {/* Description */}
      <p className="text-sm text-gray-400 mb-6">
        {hasExistingFixtures
          ? 'You can preview or regenerate fixtures. To regenerate, you must first delete the existing fixtures.'
          : 'Generate all fixtures for this season based on the scheduling configuration. You can preview the fixtures before generating them.'}
      </p>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleGeneratePreview}
          disabled={previewing || generating || deleting}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Eye className="w-4 h-4" />
          {previewing ? 'Generating Preview...' : 'Preview Fixtures'}
        </button>

        {hasExistingFixtures ? (
          <button
            onClick={handleDelete}
            disabled={previewing || generating || deleting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            {deleting ? 'Deleting...' : 'Delete All Fixtures'}
          </button>
        ) : (
          <button
            onClick={handleGenerate}
            disabled={previewing || generating || deleting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Wand2 className="w-4 h-4" />
            {generating ? 'Generating...' : 'Generate Fixtures'}
          </button>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-4 p-3 bg-gray-800/50 border border-gray-700/50 rounded-lg">
        <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Fixture Generation Process</h4>
        <ul className="text-xs text-gray-500 space-y-1">
          <li>• Generates round-robin fixtures (all teams play each other)</li>
          <li>• Assigns matches to available days and time slots</li>
          <li>• Respects venue capacity constraints</li>
          <li>• Ensures minimum rest days between team matches</li>
          <li>• Creates matchdays for organized scheduling</li>
        </ul>
      </div>
    </div>
  );
}

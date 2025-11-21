'use client';

import React, { useState, useEffect } from 'react';
import { Award, Plus, Upload, Trash2, Loader2, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/components/auth/auth-provider';

interface Sponsor {
  id: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  display_order: number;
}

interface SeasonSponsorsSectionProps {
  seasonId: string;
  leagueId: string;
}

export function SeasonSponsorsSection({
  seasonId,
  leagueId
}: SeasonSponsorsSectionProps) {
  const { user } = useAuth();
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [newSponsor, setNewSponsor] = useState({ name: '', website_url: '' });

  useEffect(() => {
    if (seasonId) {
      loadSponsors();
    }
  }, [seasonId]);

  const loadSponsors = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/seasons/${seasonId}/sponsors`);

      if (res.ok) {
        const data = await res.json();
        setSponsors(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load sponsors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSponsor = async () => {
    if (!newSponsor.name.trim()) return;

    try {
      setIsSaving(true);
      const res = await fetch(`/api/seasons/${seasonId}/sponsors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newSponsor.name.trim(),
          website_url: newSponsor.website_url.trim() || null,
          display_order: sponsors.length
        })
      });

      if (res.ok) {
        await loadSponsors();
        setNewSponsor({ name: '', website_url: '' });
        setIsAdding(false);
      } else {
        const error = await res.json();
        console.error('Failed to add sponsor:', error);
        alert(error.error || 'Failed to add sponsor');
      }
    } catch (error) {
      console.error('Failed to add sponsor:', error);
      alert('Failed to add sponsor');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadLogo = async (sponsorId: string, file: File) => {
    if (!file || !user) return;

    try {
      setUploadingId(sponsorId);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', user.id);

      const res = await fetch(
        `/api/seasons/${seasonId}/sponsors/${sponsorId}/logo`,
        {
          method: 'POST',
          body: formData
        }
      );

      if (res.ok) {
        await loadSponsors();
      } else {
        const error = await res.json();
        console.error('Failed to upload logo:', error);
        alert(error.error || 'Failed to upload logo');
      }
    } catch (error) {
      console.error('Failed to upload logo:', error);
      alert('Failed to upload logo');
    } finally {
      setUploadingId(null);
    }
  };

  const handleDelete = async (sponsorId: string, sponsorName: string) => {
    if (!confirm(`Delete sponsor "${sponsorName}"?`)) return;

    try {
      const res = await fetch(
        `/api/seasons/${seasonId}/sponsors/${sponsorId}`,
        {
          method: 'DELETE'
        }
      );

      if (res.ok) {
        await loadSponsors();
      } else {
        const error = await res.json();
        console.error('Failed to delete sponsor:', error);
        alert(error.error || 'Failed to delete sponsor');
      }
    } catch (error) {
      console.error('Failed to delete sponsor:', error);
      alert('Failed to delete sponsor');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 text-center text-gray-500">
        You must be logged in to manage sponsors
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Season Sponsors
          </h3>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          disabled={isAdding}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Sponsor
        </button>
      </div>

      {/* Add Sponsor Form */}
      {isAdding && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
          <div>
            <label htmlFor="sponsor-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Sponsor Name *
            </label>
            <input
              id="sponsor-name"
              type="text"
              placeholder="e.g., Adidas, Nike"
              value={newSponsor.name}
              onChange={(e) => setNewSponsor({ ...newSponsor, name: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="sponsor-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Website URL (optional)
            </label>
            <input
              id="sponsor-url"
              type="url"
              placeholder="https://example.com"
              value={newSponsor.website_url}
              onChange={(e) => setNewSponsor({ ...newSponsor, website_url: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAddSponsor}
              disabled={isSaving || !newSponsor.name.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setNewSponsor({ name: '', website_url: '' });
              }}
              disabled={isSaving}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Sponsors List */}
      <div className="space-y-3">
        {sponsors.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
            <Award className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 dark:text-gray-400">No sponsors yet</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              Add sponsors to showcase league supporters
            </p>
          </div>
        ) : (
          sponsors.map((sponsor) => (
            <div
              key={sponsor.id}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-4 flex-1">
                {sponsor.logo_url ? (
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-white border border-gray-200 dark:border-gray-600">
                    <Image
                      src={sponsor.logo_url}
                      alt={sponsor.name}
                      fill
                      className="object-contain p-1"
                      sizes="64px"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center border border-gray-300 dark:border-gray-600">
                    <Award className="w-6 h-6 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-gray-900 dark:text-white font-medium truncate">
                    {sponsor.name}
                  </h4>
                  {sponsor.website_url && (
                    <a
                      href={sponsor.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 dark:text-blue-400 text-sm hover:underline mt-1"
                    >
                      <span className="truncate">{sponsor.website_url}</span>
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                  )}
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <label className="relative flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
                  {uploadingId === sponsor.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span className="text-sm">Logo</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingId === sponsor.id}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadLogo(sponsor.id, file);
                      e.target.value = '';
                    }}
                  />
                </label>
                <button
                  onClick={() => handleDelete(sponsor.id, sponsor.name)}
                  className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-sm">Delete</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

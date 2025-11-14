'use client';

import React, { useState, useEffect } from 'react';
import { ImageIcon, Loader2 } from 'lucide-react';
import { IconUpload } from '@/components/media/icon-upload';
import { getSeasonIcon, deleteSeasonIcon } from '@/lib/utils/icon-helpers';
import { useAuth } from '@/components/auth/auth-provider';

interface SeasonIconSectionProps {
  seasonId: string;
  leagueId: string;
  seasonName: string;
}

export function SeasonIconSection({
  seasonId,
  leagueId,
  seasonName
}: SeasonIconSectionProps) {
  const { user } = useAuth();
  const [iconUrl, setIconUrl] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (seasonId && leagueId) {
      loadSeasonIcon();
    }
  }, [seasonId, leagueId]);

  const loadSeasonIcon = async () => {
    try {
      setIsLoading(true);
      const icon = await getSeasonIcon(seasonId, leagueId);
      setIconUrl(icon?.url);
    } catch (error) {
      console.error('Error loading season icon:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIconDelete = async () => {
    const success = await deleteSeasonIcon(seasonId);
    if (success) {
      // Reload to show league icon fallback
      await loadSeasonIcon();
    }
  };

  const handleIconUploadComplete = (url: string) => {
    setIconUrl(url);
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
        You must be logged in to manage icons
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-gray-200 dark:border-gray-700">
        <ImageIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Season Icon
        </h3>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Upload a custom icon for this season. If no icon is uploaded, the league icon will be used automatically.
        </p>

        <IconUpload
          currentIconUrl={iconUrl}
          contextType="season_icon"
          entityId={seasonId}
          leagueId={leagueId}
          entityName={seasonName}
          onUploadComplete={handleIconUploadComplete}
          onDelete={handleIconDelete}
          showDelete={!!iconUrl}
        />
      </div>
    </div>
  );
}

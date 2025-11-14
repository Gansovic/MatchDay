'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Season } from '@matchday/services';
import { SeasonCard } from '@matchday/ui';
import { SeasonIcon } from '@/components/ui/season-icon';

export interface SeasonManagementProps {
  leagueId: string;
  seasons: Season[];
  onSeasonsUpdate?: (seasons: Season[]) => void;
}

export default function SeasonManagement({
  leagueId,
  seasons,
  onSeasonsUpdate
}: SeasonManagementProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-white">Seasons</h3>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-700 rounded w-1/4"></div>
          <div className="h-16 bg-gray-700 rounded"></div>
          <div className="h-16 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg">
      <div className="p-6 border-b border-gray-700">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white">
            Seasons ({seasons.length})
          </h3>
        </div>
      </div>

      <div className="p-6">
        {seasons.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <svg 
              className="mx-auto h-12 w-12 text-gray-500 mb-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2h3z"
              />
            </svg>
            <h4 className="text-sm font-medium text-gray-300 mb-1">No seasons found</h4>
            <p className="text-sm text-gray-500">
              This league doesn't have any seasons yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {seasons.map((season) => (
              <SeasonCard
                key={season.id}
                season={{
                  id: season.id,
                  name: season.name,
                  display_name: season.display_name,
                  start_date: season.start_date,
                  end_date: season.end_date,
                  is_current: season.is_current,
                  status: season.status,
                  stats: {
                    completed_matches: season.total_matches_played || 0,
                    total_matches: season.total_matches_planned || 0,
                    registered_teams: season.registered_teams_count
                  }
                }}
                leagueId={leagueId}
                onClick={() => router.push(`/leagues/${leagueId}/seasons/${season.id}`)}
                seasonIcon={
                  <SeasonIcon
                    seasonId={season.id}
                    leagueId={leagueId}
                    seasonName={season.display_name || season.name}
                    size="md"
                  />
                }
                variant="admin"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
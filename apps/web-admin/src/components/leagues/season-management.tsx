'use client';

import { useState } from 'react';
import { Season } from '@/lib/services/league-detail.service';

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
  const [isLoading, setIsLoading] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: Season['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'registration':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFixturesStatusColor = (status: Season['fixtures_status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'generating':
        return 'bg-blue-100 text-blue-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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
              <div key={season.id} className="border border-gray-600 rounded-lg p-4 hover:border-gray-500 transition-colors bg-gray-800">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-medium text-white">
                      {season.display_name || season.name}
                    </h4>
                    <p className="text-sm text-gray-400">{season.season_year}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(season.status)}`}>
                      {season.status.charAt(0).toUpperCase() + season.status.slice(1)}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getFixturesStatusColor(season.fixtures_status)}`}>
                      Fixtures: {season.fixtures_status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-400">Format:</span>
                    <p className="text-gray-200 capitalize">{season.tournament_format}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-400">Start Date:</span>
                    <p className="text-gray-200">{formatDate(season.start_date)}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-400">End Date:</span>
                    <p className="text-gray-200">{formatDate(season.end_date)}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-400">Teams:</span>
                    <p className="text-gray-200">
                      {season.registered_teams_count || 0}
                      {season.max_teams ? ` / ${season.max_teams}` : ''}
                    </p>
                  </div>
                </div>

                {season.total_matches_planned && (
                  <div className="mt-3 pt-3 border-t border-gray-600">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">
                        <strong>Matches:</strong> {season.total_matches_planned} planned
                      </span>
                      {season.fixtures_generated_at && (
                        <span className="text-gray-400">
                          Generated: {formatDate(season.fixtures_generated_at)}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {season.registration_deadline && (
                  <div className="mt-2 text-sm">
                    <span className="text-gray-400">
                      <strong>Registration Deadline:</strong> {formatDate(season.registration_deadline)}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
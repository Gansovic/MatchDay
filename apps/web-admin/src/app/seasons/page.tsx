'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Calendar, Users, Loader2, AlertCircle, Plus, Eye } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { PendingRequestsCard } from '@/components/seasons/PendingRequestsCard';
import { CreateSeasonModal } from '@/components/seasons/CreateSeasonModal';

interface Season {
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
  created_at: string;
  league: {
    id: string;
    name: string;
  };
}

export default function SeasonsPage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadSeasons();
  }, []);

  const loadSeasons = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: seasonsData, error: seasonsError } = await supabase
        .from('seasons')
        .select(`
          *,
          league:leagues (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (seasonsError) throw seasonsError;

      // Get team counts for each season
      const seasonsWithCounts = await Promise.all(
        (seasonsData || []).map(async (season) => {
          const { count } = await supabase
            .from('season_teams')
            .select('*', { count: 'exact', head: true })
            .eq('season_id', season.id);

          return {
            ...season,
            registered_teams_count: count || 0
          };
        })
      );

      setSeasons(seasonsWithCounts);
      if (seasonsWithCounts.length > 0 && !selectedSeason) {
        setSelectedSeason(seasonsWithCounts[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load seasons');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeasonCreated = () => {
    loadSeasons(); // Refresh the seasons list
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
            <div className="flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Season Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage seasons across all leagues
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-300">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Seasons List */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 dark:text-white">All Seasons</h2>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  title="Create New Season"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {seasons.length === 0 ? (
                <div className="text-center py-8">
                  <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400">No seasons yet</p>
                </div>
              ) : (
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
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {season.display_name || season.name}
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(season.status)}`}>
                          {season.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {season.league.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {season.registered_teams_count} teams • {formatDate(season.start_date)}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Season Details and Requests */}
          <div className="lg:col-span-2 space-y-6">
            {selectedSeason ? (
              <>
                {/* Season Info */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {selectedSeason.display_name || selectedSeason.name}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {selectedSeason.league.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(selectedSeason.status)}`}>
                        {selectedSeason.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                      <Trophy className="w-6 h-6 text-gray-600 dark:text-gray-400 mx-auto mb-2" />
                      <div className="font-bold text-gray-900 dark:text-white">
                        {selectedSeason.tournament_format}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Format</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                      <Users className="w-6 h-6 text-gray-600 dark:text-gray-400 mx-auto mb-2" />
                      <div className="font-bold text-gray-900 dark:text-white">
                        {selectedSeason.registered_teams_count || 0}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Teams</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                      <Calendar className="w-6 h-6 text-gray-600 dark:text-gray-400 mx-auto mb-2" />
                      <div className="font-bold text-gray-900 dark:text-white">
                        {formatDate(selectedSeason.start_date)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Start Date</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                      <Calendar className="w-6 h-6 text-gray-600 dark:text-gray-400 mx-auto mb-2" />
                      <div className="font-bold text-gray-900 dark:text-white">
                        {formatDate(selectedSeason.end_date)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">End Date</div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                  </div>
                </div>

                {/* Pending Requests */}
                <PendingRequestsCard
                  seasonId={selectedSeason.id}
                  seasonName={selectedSeason.display_name || selectedSeason.name}
                  onRequestProcessed={loadSeasons}
                />
              </>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Select a season to view details
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Create Season Modal */}
        <CreateSeasonModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSeasonCreated={handleSeasonCreated}
        />
      </div>
    </div>
  );
}
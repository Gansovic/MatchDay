/**
 * Season Detail Page (Player App)
 *
 * Read-only view of season information including:
 * - Standings
 * - Matches/Fixtures
 * - Statistics
 * - Season Information
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { SeasonDashboardLayout } from '@matchday/ui';
import type { Season as SharedSeason, League as SharedLeague, TabConfig } from '@matchday/ui';
import { Trophy, Calendar, Target, Info, Users, Image as ImageIcon } from 'lucide-react';
import { LeagueStandings } from '@/components/leagues/league-standings';
import { SeasonMediaTab } from '@/components/media/season-media-tab';
import { supabase } from '@/lib/supabase/client';
import { LeagueService } from '@matchday/services';
import { LeagueDiscovery } from '@matchday/database';
import { Season } from '@/components/leagues/season-selector';
import { SeasonIcon } from '@/components/ui/season-icon';

export default function SeasonDetailPage() {
  const params = useParams();
  const leagueId = params.leagueId as string;
  const seasonId = params.seasonId as string;
  const [activeTab, setActiveTab] = useState<'standings' | 'teams' | 'matches' | 'media' | 'stats' | 'info'>('standings');

  // State for data
  const [leagueData, setLeagueData] = useState<LeagueDiscovery | null>(null);
  const [currentSeason, setCurrentSeason] = useState<Season | null>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matchesLoading, setMatchesLoading] = useState(false);

  // Initialize services
  const leagueService = LeagueService.getInstance(supabase);

  // Fetch league details
  const fetchLeagueDetails = useCallback(async () => {
    try {
      const response = await leagueService.getLeagueDetails(leagueId);

      if (response.success && response.data) {
        setLeagueData(response.data);
      } else {
        setError(response.error?.message || 'Failed to load league details');
      }
    } catch (err) {
      console.error('Error fetching league details:', err);
      setError('An unexpected error occurred');
    }
  }, [leagueId]);

  // Fetch season details
  const fetchSeasonDetails = useCallback(async () => {
    try {
      const baseUrl = typeof window !== 'undefined'
        ? window.location.origin
        : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

      const response = await fetch(`${baseUrl}/api/leagues/${leagueId}/seasons`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data && result.data.length > 0) {
          // Find the current season by ID
          const season = result.data.find((s: Season) => s.id === seasonId);
          if (season) {
            setCurrentSeason(season);
          } else {
            setError('Season not found');
          }
        }
      } else {
        setError('Failed to load season details');
      }
    } catch (err) {
      console.error('Error fetching season details:', err);
      setError('An unexpected error occurred');
    }
  }, [leagueId, seasonId]);

  // Fetch teams for the season
  const fetchSeasonTeams = useCallback(async () => {
    try {
      const baseUrl = typeof window !== 'undefined'
        ? window.location.origin
        : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

      const response = await fetch(`${baseUrl}/api/seasons/${seasonId}/teams`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setTeams(result.data);
        }
      }
    } catch (err) {
      console.error('Error fetching season teams:', err);
    }
  }, [seasonId]);

  // Fetch matches for the season
  const fetchSeasonMatches = useCallback(async () => {
    try {
      setMatchesLoading(true);
      const baseUrl = typeof window !== 'undefined'
        ? window.location.origin
        : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

      const response = await fetch(`${baseUrl}/api/leagues/${leagueId}/matches?season_id=${seasonId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setMatches(result.data);
        }
      }
    } catch (err) {
      console.error('Error fetching season matches:', err);
    } finally {
      setMatchesLoading(false);
    }
  }, [leagueId, seasonId]);

  // Initial data load
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      setError(null);

      await Promise.all([
        fetchLeagueDetails(),
        fetchSeasonDetails(),
        fetchSeasonTeams(),
        fetchSeasonMatches()
      ]);

      setLoading(false);
    };

    loadInitialData();
  }, [fetchLeagueDetails, fetchSeasonDetails, fetchSeasonTeams, fetchSeasonMatches]);

  // Transform data to match shared layout interface
  const seasonForLayout: SharedSeason | null = currentSeason ? {
    id: currentSeason.id,
    name: currentSeason.name,
    display_name: currentSeason.display_name,
    status: currentSeason.is_current ? 'active' : 'completed',
    start_date: currentSeason.start_date,
    end_date: currentSeason.end_date,
    is_current: currentSeason.is_current,
    description: currentSeason.description,
    registered_teams_count: currentSeason.stats?.registered_teams || 0
  } : null;

  const leagueForLayout: SharedLeague | null = leagueData ? {
    id: leagueData.id,
    name: leagueData.name,
    sport_type: leagueData.sport_type,
    description: leagueData.description || '',
    teamCount: leagueData.teamCount || 0
  } : null;

  // Tab configuration
  const tabs: TabConfig[] = [
    { id: 'standings', label: 'Standings', icon: Trophy },
    { id: 'teams', label: 'Teams', icon: Users },
    { id: 'matches', label: 'Matches', icon: Calendar },
    { id: 'media', label: 'Media', icon: ImageIcon },
    { id: 'stats', label: 'Statistics', icon: Target },
    { id: 'info', label: 'Season Info', icon: Info }
  ];

  return (
    <SeasonDashboardLayout
      backLink={{
        href: `/leagues/${leagueId}`,
        label: `Back to ${leagueData?.name || 'League'}`
      }}
      season={seasonForLayout}
      league={leagueForLayout}
      isLoading={loading}
      error={error}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(tab) => setActiveTab(tab as any)}
      seasonIcon={
        currentSeason && (
          <SeasonIcon
            seasonId={currentSeason.id}
            leagueId={leagueId}
            seasonName={currentSeason.display_name || currentSeason.name}
            size="xl"
          />
        )
      }
    >
      {/* Only render tab content if season data is loaded */}
      {!loading && currentSeason && (
        <>
          {activeTab === 'standings' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Standings</h3>
              <LeagueStandings leagueId={leagueId} currentSeasonId={seasonId} />
            </div>
          )}

          {activeTab === 'teams' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Teams</h3>
              </div>

              {teams && teams.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Team</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Captain</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Registered</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {teams.map((team: any) => (
                        <tr key={team.team_id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {team.team?.logo_url && (
                                <img
                                  className="h-10 w-10 rounded-full mr-3"
                                  src={team.team.logo_url}
                                  alt={team.team?.name || 'Team'}
                                />
                              )}
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {team.team?.name || 'Unknown Team'}
                                </div>
                                {team.seeding && (
                                  <div className="text-sm text-gray-500">
                                    Seed #{team.seeding}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                            {team.team?.captain?.display_name || 'No captain assigned'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              team.status === 'accepted'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : team.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {team.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {team.registered_at ? new Date(team.registered_at).toLocaleDateString() : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">👥</div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No teams registered</h3>
                  <p className="text-gray-500 dark:text-gray-400">Teams will appear here once they register for this season.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'matches' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Matches</h3>
              </div>

              {matchesLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-500 dark:text-gray-400">Loading matches...</p>
                </div>
              ) : matches && matches.length > 0 ? (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {matches.map((match: any) => (
                    <div key={match.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {match.match_day && `Match Day ${match.match_day}`}
                          {match.scheduled_date && ` • ${new Date(match.scheduled_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          match.status === 'completed'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : match.status === 'live'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                        }`}>
                          {match.status === 'completed' ? 'Completed' : match.status === 'live' ? 'Live' : 'Scheduled'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="text-right flex-1">
                            <div className="font-medium text-gray-900 dark:text-white">{match.home_team_name}</div>
                          </div>
                          <div className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg min-w-[80px] text-center">
                            <div className="text-lg font-bold text-gray-900 dark:text-white">
                              {match.status === 'completed' || match.status === 'live'
                                ? `${match.home_score || 0} - ${match.away_score || 0}`
                                : 'vs'
                              }
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-white">{match.away_team_name}</div>
                          </div>
                        </div>

                        {match.venue && (
                          <div className="ml-4 text-sm text-gray-500 dark:text-gray-400">
                            {match.venue}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">⚽</div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No matches scheduled</h3>
                  <p className="text-gray-500 dark:text-gray-400">Matches will appear here once they are scheduled for this season.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'media' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <SeasonMediaTab
                seasonId={seasonId}
                seasonName={currentSeason?.display_name || currentSeason?.name || 'Season'}
                canUpload={false}
              />
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Statistics</h3>
              <p className="text-gray-600 dark:text-gray-400">Season statistics coming soon...</p>
            </div>
          )}

          {activeTab === 'info' && (
            <div className="space-y-6">
              {/* Description Section */}
              {currentSeason?.description && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    About This Season
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {currentSeason.description}
                  </p>
                </div>
              )}

              {/* Key Details Section */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Season Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentSeason?.start_date && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Start Date</p>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {new Date(currentSeason.start_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                  {currentSeason?.end_date && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">End Date</p>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {new Date(currentSeason.end_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Status</p>
                    <p className="text-gray-900 dark:text-white font-medium capitalize">
                      {currentSeason?.status?.replace(/_/g, ' ') || 'Active'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Teams</p>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {teams.length} registered
                    </p>
                  </div>
                </div>
              </div>

              {/* Empty state if no description */}
              {!currentSeason?.description && (
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
                  <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No Description Available
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    The league admin hasn't added a description for this season yet.
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </SeasonDashboardLayout>
  );
}

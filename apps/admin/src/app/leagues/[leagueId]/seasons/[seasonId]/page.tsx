/**
 * Season Detail Page (Admin - via League Route)
 *
 * Admin interface for managing a specific season accessed via league route.
 * This route includes leagueId in the URL, so it works seamlessly with SeasonDashboardLayout.
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { seasonService } from '@/lib/services/season.service'
import type {
  SeasonOverview,
  SeasonTeam,
  Fixture,
  SeasonStatus,
  TournamentFormat
} from '@matchday/database'
import { SeasonDashboardLayout } from '@matchday/ui'
import type { Season, League, TabConfig } from '@matchday/ui'
import { Info, Users, Calendar, Settings } from 'lucide-react'
import { SeasonIcon } from '@/components/ui/season-icon'
import { SeasonIconSection } from '@/components/seasons/season-icon-section'

interface SeasonDetailData extends SeasonOverview {
  league: {
    id: string
    name: string
    sport_type: string
    created_by: string
    created_by_user: { display_name: string; avatar_url?: string }
  }
  team_registrations: Array<SeasonTeam & {
    team: {
      id: string
      name: string
      logo_url?: string
      captain_id: string
      captain: { display_name: string }
    }
    registered_by_user: { display_name: string }
  }>
  stats: any
}

export default function SeasonDetailPage() {
  const router = useRouter()
  const params = useParams()
  const seasonId = params.seasonId as string
  const leagueId = params.leagueId as string

  const [season, setSeason] = useState<SeasonDetailData | null>(null)
  const [fixtures, setFixtures] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'teams' | 'fixtures' | 'settings'>('overview')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    if (seasonId) {
      loadSeasonData()
    }
  }, [seasonId])

  const loadSeasonData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load season details
      const seasonData = await seasonService.getSeason(seasonId)
      setSeason(seasonData)

      // Load fixtures if they exist
      if (seasonData.fixtures_status === 'completed') {
        const fixturesData = await seasonService.getFixtures(seasonId, {
          group_by: 'matchday',
          limit: 100
        })
        setFixtures(fixturesData.data || [])
      }
    } catch (err) {
      console.error('Error loading season:', err)
      setError(err instanceof Error ? err.message : 'Failed to load season')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateFixtures = async () => {
    try {
      setActionLoading('generate_fixtures')
      const result = await seasonService.generateFixtures(seasonId)
      await loadSeasonData() // Reload data
      alert(`Successfully generated ${result.data.fixtures_generated} fixtures!`)
    } catch (err) {
      console.error('Error generating fixtures:', err)
      alert(err instanceof Error ? err.message : 'Failed to generate fixtures')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteFixtures = async () => {
    if (!confirm('Are you sure you want to delete all fixtures? This action cannot be undone.')) {
      return
    }

    try {
      setActionLoading('delete_fixtures')
      await seasonService.deleteFixtures(seasonId)
      await loadSeasonData() // Reload data
      alert('Fixtures deleted successfully!')
    } catch (err) {
      console.error('Error deleting fixtures:', err)
      alert(err instanceof Error ? err.message : 'Failed to delete fixtures')
    } finally {
      setActionLoading(null)
    }
  }

  const handleUpdateTeamStatus = async (teamId: string, status: 'accepted' | 'declined') => {
    try {
      setActionLoading(`team_${teamId}`)
      await seasonService.updateTeamStatus(seasonId, teamId, status)
      await loadSeasonData() // Reload data
    } catch (err) {
      console.error('Error updating team status:', err)
      alert(err instanceof Error ? err.message : 'Failed to update team status')
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusColor = (status: SeasonStatus) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      registration: 'bg-blue-100 text-blue-800',
      fixtures_pending: 'bg-yellow-100 text-yellow-800',
      fixtures_generated: 'bg-green-100 text-green-800',
      active: 'bg-green-100 text-green-800',
      playoffs: 'bg-purple-100 text-purple-800',
      completed: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  // Prepare data for the shared layout
  const seasonForLayout: Season | null = season ? {
    id: season.id,
    name: season.name,
    display_name: season.display_name,
    status: season.status,
    start_date: season.start_date,
    end_date: season.end_date,
    is_current: season.is_current || false,
    description: season.description,
    registered_teams_count: season.registered_teams_count || season.team_registrations?.length || 0
  } : null;

  const leagueForLayout: League | null = season?.league ? {
    id: season.league.id,
    name: season.league.name,
    sport_type: season.league.sport_type,
    description: '',
    teamCount: season.team_registrations?.length || 0
  } : null;

  // Tab configuration
  const tabs: TabConfig[] = [
    { id: 'overview', label: 'Overview', icon: Info },
    { id: 'teams', label: 'Teams', icon: Users },
    { id: 'fixtures', label: 'Fixtures', icon: Calendar },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <SeasonDashboardLayout
      backLink={{
        href: `/leagues/${leagueId}`,
        label: `Back to ${season?.league?.name || 'League'}`
      }}
      season={seasonForLayout}
      league={leagueForLayout}
      isLoading={loading}
      error={error}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(tab) => setActiveTab(tab as any)}
      seasonIcon={
        season && (
          <SeasonIcon
            seasonId={season.id}
            leagueId={leagueId}
            seasonName={season.display_name || season.name}
            size="xl"
          />
        )
      }
    >
      {/* Only render tab content if season data is loaded */}
      {!loading && season && (
        <>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Progress Overview */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{season.registered_teams_count || 0}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Teams Registered</div>
                <div className="text-xs text-gray-500">Min: {season.min_teams} / Max: {season.max_teams || '∞'}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{season.total_matches_played || 0}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Matches Played</div>
                <div className="text-xs text-gray-500">Total: {season.total_matches_scheduled || 0}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{season.current_matchday || 1}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Current Matchday</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {season.completion_percentage ? Math.round(season.completion_percentage) : 0}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Complete</div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                  <div
                    className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${season.completion_percentage || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {(season.status === 'fixtures_pending' || season.fixtures_status === 'needs_regeneration') && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Fixtures Need Generation</h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">
                    {season.registered_teams_count >= season.min_teams
                      ? 'Ready to generate fixtures for this season.'
                      : `Need ${season.min_teams - (season.registered_teams_count || 0)} more teams to generate fixtures.`
                    }
                  </p>
                </div>
                {season.registered_teams_count >= season.min_teams && (
                  <button
                    onClick={handleGenerateFixtures}
                    disabled={actionLoading === 'generate_fixtures'}
                    className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 disabled:opacity-50 transition-colors"
                  >
                    {actionLoading === 'generate_fixtures' ? 'Generating...' : 'Generate Fixtures'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Teams Tab */}
      {activeTab === 'teams' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Registered Teams</h3>
          </div>

          {season.team_registrations && season.team_registrations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Team</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Captain</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Registered</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {season.team_registrations.map((registration) => (
                    <tr key={registration.team.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {registration.team.logo_url && (
                            <img
                              className="h-10 w-10 rounded-full mr-3"
                              src={registration.team.logo_url}
                              alt={registration.team.name}
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {registration.team.name}
                            </div>
                            {registration.seeding && (
                              <div className="text-sm text-gray-500">
                                Seed #{registration.seeding}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                        {registration.team.captain?.display_name || 'No captain assigned'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          registration.status === 'accepted'
                            ? 'bg-green-100 text-green-800'
                            : registration.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {registration.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(registration.registered_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        {registration.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleUpdateTeamStatus(registration.team.id, 'accepted')}
                              disabled={actionLoading === `team_${registration.team.id}`}
                              className="text-green-600 hover:text-green-800 disabled:opacity-50"
                            >
                              ✓ Accept
                            </button>
                            <button
                              onClick={() => handleUpdateTeamStatus(registration.team.id, 'declined')}
                              disabled={actionLoading === `team_${registration.team.id}`}
                              className="text-red-600 hover:text-red-800 disabled:opacity-50"
                            >
                              ✗ Decline
                            </button>
                          </>
                        )}
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

      {/* Fixtures Tab */}
      {activeTab === 'fixtures' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Fixtures</h3>
          </div>

          {fixtures.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {fixtures.map((fixture: any) => {
                // Handle both match object directly or nested under matches property
                const match = fixture.matches || fixture;
                return (
                  <div key={fixture.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
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
                          <div className="font-medium text-gray-900 dark:text-white">
                            {match.home_team?.name || match.home_team_name || 'TBD'}
                          </div>
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
                          <div className="font-medium text-gray-900 dark:text-white">
                            {match.away_team?.name || match.away_team_name || 'TBD'}
                          </div>
                        </div>
                      </div>

                      {match.venue && (
                        <div className="ml-4 text-sm text-gray-500 dark:text-gray-400">
                          {match.venue}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : season.fixtures_status === 'completed' ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📅</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No fixtures found</h3>
              <p className="text-gray-500 dark:text-gray-400">There was an issue loading the fixtures.</p>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">⏳</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Fixtures not generated</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Register teams and generate fixtures to see the match schedule.
              </p>
              {season.registered_teams_count >= season.min_teams && (
                <button
                  onClick={handleGenerateFixtures}
                  disabled={actionLoading === 'generate_fixtures'}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {actionLoading === 'generate_fixtures' ? 'Generating...' : 'Generate Fixtures Now'}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Season Settings</h3>
          {season && (
            <SeasonIconSection
              seasonId={season.id}
              leagueId={season.league_id}
              seasonName={season.display_name || season.name}
            />
          )}
        </div>
      )}
        </>
      )}
    </SeasonDashboardLayout>
  )
}

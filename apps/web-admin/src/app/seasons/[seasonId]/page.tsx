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
} from '@/lib/types/database.types'

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

  const handleUpdateTeamStatus = async (teamId: string, newStatus: string) => {
    try {
      setActionLoading(`team_${teamId}`)
      await seasonService.updateTeamRegistration(seasonId, teamId, { status: newStatus })
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

  const getTournamentFormatIcon = (format: TournamentFormat) => {
    switch (format) {
      case 'league': return '🏆'
      case 'knockout': return '⚔️'
      case 'league_with_playoffs': return '🎯'
      default: return '📅'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-300 rounded w-64"></div>
            <div className="h-64 bg-gray-300 rounded-lg"></div>
            <div className="h-96 bg-gray-300 rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !season) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">❌</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Error loading season</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.back()}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/seasons')}
            className="text-blue-600 hover:text-blue-800 mb-4 flex items-center space-x-2"
          >
            <span>←</span> <span>Back to Seasons</span>
          </button>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-4xl">{getTournamentFormatIcon(season.tournament_format)}</span>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {season.display_name || season.name}
                </h1>
                <p className="text-gray-600">{season.league.name} • {season.season_year}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(season.status)}`}>
                {season.status.replace('_', ' ').toUpperCase()}
              </span>
              <button
                onClick={() => router.push(`/seasons/${seasonId}/edit`)}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Edit Season
              </button>
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{season.registered_teams_count || 0}</div>
              <div className="text-sm text-gray-600">Teams Registered</div>
              <div className="text-xs text-gray-500">Min: {season.min_teams} / Max: {season.max_teams || '∞'}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{season.total_matches_played || 0}</div>
              <div className="text-sm text-gray-600">Matches Played</div>
              <div className="text-xs text-gray-500">Total: {season.total_matches_scheduled || 0}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{season.current_matchday || 1}</div>
              <div className="text-sm text-gray-600">Current Matchday</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {season.completion_percentage ? Math.round(season.completion_percentage) : 0}%
              </div>
              <div className="text-sm text-gray-600">Complete</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
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
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-yellow-800">Fixtures Need Generation</h3>
                <p className="text-sm text-yellow-700">
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

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'teams', label: `Teams (${season.team_registrations?.length || 0})`, icon: '👥' },
              { id: 'fixtures', label: `Fixtures (${fixtures.length || 0})`, icon: '📅' },
              { id: 'settings', label: 'Settings', icon: '⚙️' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Season Information */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Season Information</h3>
                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Tournament Format:</dt>
                    <dd className="text-sm font-medium capitalize">
                      {season.tournament_format.replace('_', ' ')}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Duration:</dt>
                    <dd className="text-sm font-medium">
                      {new Date(season.start_date).toLocaleDateString()} - {new Date(season.end_date).toLocaleDateString()}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Match Frequency:</dt>
                    <dd className="text-sm font-medium">Every {season.match_frequency} days</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Scoring:</dt>
                    <dd className="text-sm font-medium">
                      {season.points_for_win}W - {season.points_for_draw}D - {season.points_for_loss}L
                    </dd>
                  </div>
                  {season.tournament_format === 'league' && (
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Rounds:</dt>
                      <dd className="text-sm font-medium">
                        {season.rounds === 1 ? 'Single' : 'Double'} Round Robin
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  {season.fixtures_status === 'completed' && (
                    <button
                      onClick={handleDeleteFixtures}
                      disabled={actionLoading === 'delete_fixtures'}
                      className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors text-left"
                    >
                      {actionLoading === 'delete_fixtures' ? 'Deleting...' : '🗑️ Delete All Fixtures'}
                    </button>
                  )}
                  <button className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-left">
                    📊 Export Season Data
                  </button>
                  <button className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-left">
                    📧 Send Team Updates
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Teams Tab */}
          {activeTab === 'teams' && (
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Team Registrations</h3>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                    Register Team
                  </button>
                </div>
              </div>
              
              {season.team_registrations && season.team_registrations.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Team
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Captain
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Registered
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {season.team_registrations.map((registration) => (
                        <tr key={registration.id}>
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
                                <div className="text-sm font-medium text-gray-900">
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {registration.team.captain.display_name}
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No teams registered</h3>
                  <p className="text-gray-500">Teams will appear here once they register for this season.</p>
                </div>
              )}
            </div>
          )}

          {/* Fixtures Tab */}
          {activeTab === 'fixtures' && (
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Fixtures</h3>
              </div>
              
              {fixtures.length > 0 ? (
                <div className="p-6">
                  <p className="text-center text-gray-500">Fixture display component would go here</p>
                  <p className="text-center text-sm text-gray-400 mt-2">
                    Found {fixtures.length} fixtures to display
                  </p>
                </div>
              ) : season.fixtures_status === 'completed' ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">📅</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No fixtures found</h3>
                  <p className="text-gray-500">There was an issue loading the fixtures.</p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">⏳</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Fixtures not generated</h3>
                  <p className="text-gray-500 mb-4">
                    Register teams and generate fixtures to see the match schedule.
                  </p>
                  {season.registered_teams_count >= season.min_teams && (
                    <button
                      onClick={handleGenerateFixtures}
                      disabled={actionLoading === 'generate_fixtures'}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {actionLoading === 'generate_fixtures' ? 'Generating...' : 'Generate Fixtures'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Season Settings</h3>
              <p className="text-gray-500">Season configuration settings would go here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
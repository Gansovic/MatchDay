'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { seasonService } from '@/lib/services/season.service'
import type { 
  CreateSeasonParams, 
  TournamentFormat, 
  League 
} from '@/lib/types/database.types'

interface FormData extends CreateSeasonParams {
  // Additional form-specific fields
}

export default function CreateSeasonPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [availableLeagues, setAvailableLeagues] = useState<League[]>([])
  const [formData, setFormData] = useState<FormData>({
    name: '',
    league_id: '',
    season_year: new Date().getFullYear(),
    tournament_format: 'league',
    start_date: '',
    end_date: '',
    match_frequency: 7,
    preferred_match_time: '15:00',
    min_teams: 2,
    max_teams: 16,
    rounds: 1,
    points_for_win: 3,
    points_for_draw: 1,
    points_for_loss: 0,
    knockout_legs: 1,
    third_place_playoff: false,
    playoff_teams_count: 4,
    playoff_format: 'knockout',
    allow_draws: true,
    home_away_balance: true,
    venue_conflicts_check: true,
    bye_week_handling: 'rotate',
    rules: {},
    settings: {},
    metadata: {}
  })

  useEffect(() => {
    loadAvailableLeagues()
  }, [])

  const loadAvailableLeagues = async () => {
    try {
      const leagues = await seasonService.getAvailableLeagues()
      setAvailableLeagues(leagues)
    } catch (err) {
      console.error('Error loading leagues:', err)
      setError('Failed to load available leagues')
    }
  }

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return

    try {
      setLoading(true)
      setError(null)

      // Validate required fields
      if (!formData.name || !formData.league_id || !formData.start_date || !formData.end_date) {
        throw new Error('Please fill in all required fields')
      }

      // Validate dates
      const startDate = new Date(formData.start_date)
      const endDate = new Date(formData.end_date)
      if (endDate <= startDate) {
        throw new Error('End date must be after start date')
      }

      const result = await seasonService.createSeason(formData)
      
      // Redirect to the created season
      router.push(`/seasons/${result.data.id}`)
    } catch (err) {
      console.error('Error creating season:', err)
      setError(err instanceof Error ? err.message : 'Failed to create season')
    } finally {
      setLoading(false)
    }
  }

  const getTournamentFormatDescription = (format: TournamentFormat) => {
    switch (format) {
      case 'league':
        return 'Teams play each other in a round-robin format. Winner determined by points.'
      case 'knockout':
        return 'Single or double elimination tournament. Teams are eliminated after losing.'
      case 'league_with_playoffs':
        return 'Regular season followed by playoffs among top teams.'
      default:
        return ''
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800 mb-4 flex items-center space-x-2"
          >
            <span>←</span> <span>Back to Seasons</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Create New Season</h1>
          <p className="text-gray-600 mt-1">Set up a new tournament season for your league</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Season Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Spring 2024 Championship"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  League *
                </label>
                <select
                  value={formData.league_id}
                  onChange={(e) => handleInputChange('league_id', e.target.value)}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select a league</option>
                  {availableLeagues.map((league) => (
                    <option key={league.id} value={league.id}>
                      {league.name} ({league.sport_type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Season Year *
                </label>
                <input
                  type="number"
                  value={formData.season_year}
                  onChange={(e) => handleInputChange('season_year', parseInt(e.target.value))}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  min="2020"
                  max="2050"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={formData.display_name || ''}
                  onChange={(e) => handleInputChange('display_name', e.target.value)}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 2024-25 Premier League"
                />
              </div>
            </div>
          </div>

          {/* Tournament Format */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Tournament Format</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Tournament Type *
                </label>
                <div className="space-y-3">
                  {(['league', 'knockout', 'league_with_playoffs'] as TournamentFormat[]).map((format) => (
                    <div key={format} className="flex items-start space-x-3">
                      <input
                        type="radio"
                        id={format}
                        name="tournament_format"
                        value={format}
                        checked={formData.tournament_format === format}
                        onChange={(e) => handleInputChange('tournament_format', e.target.value as TournamentFormat)}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <label htmlFor={format} className="flex-1">
                        <div className="font-medium text-gray-900 capitalize">
                          {format.replace('_', ' ')}
                        </div>
                        <div className="text-sm text-gray-600">
                          {getTournamentFormatDescription(format)}
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Format-specific options */}
              {formData.tournament_format === 'league' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Rounds
                    </label>
                    <select
                      value={formData.rounds}
                      onChange={(e) => handleInputChange('rounds', parseInt(e.target.value))}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value={1}>Single Round (play once)</option>
                      <option value={2}>Double Round (home & away)</option>
                    </select>
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <input
                      type="checkbox"
                      id="home_away_balance"
                      checked={formData.home_away_balance}
                      onChange={(e) => handleInputChange('home_away_balance', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="home_away_balance" className="text-sm text-gray-700">
                      Balance home/away games
                    </label>
                  </div>
                </div>
              )}

              {formData.tournament_format === 'knockout' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Match Legs
                    </label>
                    <select
                      value={formData.knockout_legs}
                      onChange={(e) => handleInputChange('knockout_legs', parseInt(e.target.value))}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value={1}>Single Leg</option>
                      <option value={2}>Two Legs (home & away)</option>
                    </select>
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <input
                      type="checkbox"
                      id="third_place_playoff"
                      checked={formData.third_place_playoff}
                      onChange={(e) => handleInputChange('third_place_playoff', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="third_place_playoff" className="text-sm text-gray-700">
                      Third place playoff
                    </label>
                  </div>
                </div>
              )}

              {formData.tournament_format === 'league_with_playoffs' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Playoff Teams
                    </label>
                    <select
                      value={formData.playoff_teams_count}
                      onChange={(e) => handleInputChange('playoff_teams_count', parseInt(e.target.value))}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value={2}>Top 2 teams</option>
                      <option value={4}>Top 4 teams</option>
                      <option value={6}>Top 6 teams</option>
                      <option value={8}>Top 8 teams</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Playoff Format
                    </label>
                    <select
                      value={formData.playoff_format}
                      onChange={(e) => handleInputChange('playoff_format', e.target.value as 'knockout' | 'league')}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="knockout">Knockout</option>
                      <option value="league">Mini League</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Schedule Settings */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Schedule Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleInputChange('start_date', e.target.value)}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date *
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => handleInputChange('end_date', e.target.value)}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Registration Deadline
                </label>
                <input
                  type="datetime-local"
                  value={formData.registration_deadline || ''}
                  onChange={(e) => handleInputChange('registration_deadline', e.target.value)}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Match Time
                </label>
                <input
                  type="time"
                  value={formData.preferred_match_time}
                  onChange={(e) => handleInputChange('preferred_match_time', e.target.value)}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Match Frequency (days)
                </label>
                <input
                  type="number"
                  value={formData.match_frequency}
                  onChange={(e) => handleInputChange('match_frequency', parseInt(e.target.value))}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                  max="30"
                />
                <p className="text-xs text-gray-500 mt-1">Days between matches for the same team</p>
              </div>
            </div>
          </div>

          {/* Team Configuration */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Team Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Teams
                </label>
                <input
                  type="number"
                  value={formData.min_teams}
                  onChange={(e) => handleInputChange('min_teams', parseInt(e.target.value))}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  min="2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Teams
                </label>
                <input
                  type="number"
                  value={formData.max_teams || ''}
                  onChange={(e) => handleInputChange('max_teams', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  min="2"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty for unlimited</p>
              </div>
            </div>
          </div>

          {/* Scoring Rules */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Scoring Rules</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Points for Win
                </label>
                <input
                  type="number"
                  value={formData.points_for_win}
                  onChange={(e) => handleInputChange('points_for_win', parseInt(e.target.value))}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Points for Draw
                </label>
                <input
                  type="number"
                  value={formData.points_for_draw}
                  onChange={(e) => handleInputChange('points_for_draw', parseInt(e.target.value))}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  disabled={!formData.allow_draws}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Points for Loss
                </label>
                <input
                  type="number"
                  value={formData.points_for_loss}
                  onChange={(e) => handleInputChange('points_for_loss', parseInt(e.target.value))}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center space-x-2">
              <input
                type="checkbox"
                id="allow_draws"
                checked={formData.allow_draws}
                onChange={(e) => handleInputChange('allow_draws', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="allow_draws" className="text-sm text-gray-700">
                Allow draws (games can end in a tie)
              </label>
            </div>
          </div>

          {/* Advanced Options */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Advanced Options</h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="venue_conflicts_check"
                  checked={formData.venue_conflicts_check}
                  onChange={(e) => handleInputChange('venue_conflicts_check', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="venue_conflicts_check" className="text-sm text-gray-700">
                  Check for venue conflicts when scheduling
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bye Week Handling
                </label>
                <select
                  value={formData.bye_week_handling}
                  onChange={(e) => handleInputChange('bye_week_handling', e.target.value as 'rotate' | 'none' | 'end')}
                  className="w-full md:w-64 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="rotate">Rotate bye weeks</option>
                  <option value="none">No bye weeks</option>
                  <option value="end">Bye weeks at end</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">How to handle odd number of teams</p>
              </div>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Creating Season...' : 'Create Season'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
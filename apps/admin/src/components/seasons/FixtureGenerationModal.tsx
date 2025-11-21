'use client'

import { useState } from 'react'
import { X, Calendar, Clock, MapPin, Eye, Loader2, Check } from 'lucide-react'

interface FixturePreview {
  matchday_number: number
  match_date: string
  match_time: string
  court_number: number
  home_team_id: string
  away_team_id: string
  home_team?: { id: string; name: string; team_color: string }
  away_team?: { id: string; name: string; team_color: string }
}

interface SchedulingOptions {
  match_day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
  match_start_time: string
  courts_available: number
  games_per_court: number
  rest_weeks_between_matches: number
  tournament_format: 'single_round_robin' | 'double_round_robin'
}

interface FixtureGenerationModalProps {
  isOpen: boolean
  onClose: () => void
  seasonId: string
  seasonName: string
  startDate: string
  endDate: string
  currentSettings: SchedulingOptions
  onGenerate: (options: SchedulingOptions) => Promise<void>
  onPreview: (options: SchedulingOptions) => Promise<{ fixtures: FixturePreview[]; matchdays: number }>
}

export function FixtureGenerationModal({
  isOpen,
  onClose,
  seasonId,
  seasonName,
  startDate,
  endDate,
  currentSettings,
  onGenerate,
  onPreview
}: FixtureGenerationModalProps) {
  const [options, setOptions] = useState<SchedulingOptions>(currentSettings)
  const [preview, setPreview] = useState<FixturePreview[] | null>(null)
  const [previewMatchdays, setPreviewMatchdays] = useState<number>(0)
  const [loading, setLoading] = useState<'preview' | 'generate' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'configure' | 'preview'>('configure')

  if (!isOpen) return null

  const handlePreview = async () => {
    setLoading('preview')
    setError(null)
    try {
      const result = await onPreview(options)
      setPreview(result.fixtures)
      setPreviewMatchdays(result.matchdays)
      setStep('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate preview')
    } finally {
      setLoading(null)
    }
  }

  const handleGenerate = async () => {
    setLoading('generate')
    setError(null)
    try {
      await onGenerate(options)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate fixtures')
    } finally {
      setLoading(null)
    }
  }

  const groupFixturesByMatchday = (fixtures: FixturePreview[]) => {
    const grouped: { [key: number]: FixturePreview[] } = {}
    fixtures.forEach(fixture => {
      const matchday = fixture.matchday_number
      if (!grouped[matchday]) {
        grouped[matchday] = []
      }
      grouped[matchday].push(fixture)
    })
    return grouped
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {step === 'configure' ? 'Configure Fixture Generation' : 'Preview Fixtures'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {seasonName} ({formatDate(startDate)} - {formatDate(endDate)})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {step === 'configure' ? (
            <div className="space-y-6">
              {/* Match Day */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="inline-block w-4 h-4 mr-1" />
                  Match Day
                </label>
                <select
                  value={options.match_day}
                  onChange={(e) => setOptions({ ...options, match_day: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="monday">Monday</option>
                  <option value="tuesday">Tuesday</option>
                  <option value="wednesday">Wednesday</option>
                  <option value="thursday">Thursday</option>
                  <option value="friday">Friday</option>
                  <option value="saturday">Saturday</option>
                  <option value="sunday">Sunday</option>
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  The day of the week when matches will be scheduled
                </p>
              </div>

              {/* Start Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Clock className="inline-block w-4 h-4 mr-1" />
                  Match Start Time
                </label>
                <input
                  type="time"
                  value={options.match_start_time.substring(0, 5)}
                  onChange={(e) => setOptions({ ...options, match_start_time: e.target.value + ':00' })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Time when the first match of the day starts
                </p>
              </div>

              {/* Courts Available */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <MapPin className="inline-block w-4 h-4 mr-1" />
                  Courts/Fields Available
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={options.courts_available}
                  onChange={(e) => setOptions({ ...options, courts_available: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Number of courts/fields that can host matches simultaneously
                </p>
              </div>

              {/* Games Per Court */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Games Per Court/Day
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={options.games_per_court}
                  onChange={(e) => setOptions({ ...options, games_per_court: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Maximum number of games each court can host per match day
                </p>
              </div>

              {/* Rest Weeks */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rest Weeks Between Matches
                </label>
                <input
                  type="number"
                  min="0"
                  max="4"
                  value={options.rest_weeks_between_matches}
                  onChange={(e) => setOptions({ ...options, rest_weeks_between_matches: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Minimum weeks between matches for each team (0 = teams can play every week)
                </p>
              </div>

              {/* Tournament Format */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tournament Format
                </label>
                <select
                  value={options.tournament_format}
                  onChange={(e) => setOptions({ ...options, tournament_format: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="single_round_robin">Single Round Robin</option>
                  <option value="double_round_robin">Double Round Robin</option>
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {options.tournament_format === 'single_round_robin'
                    ? 'Each team plays every other team once'
                    : 'Each team plays every other team twice (home and away)'}
                </p>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-md p-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Schedule Summary</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>Format: <strong>{options.tournament_format === 'single_round_robin' ? 'Single Round Robin' : 'Double Round Robin'}</strong></li>
                  <li>Matches on: <strong className="capitalize">{options.match_day}s</strong></li>
                  <li>Starting at: <strong>{formatTime(options.match_start_time)}</strong></li>
                  <li>Max games per day: <strong>{options.courts_available * options.games_per_court}</strong> ({options.courts_available} courts x {options.games_per_court} games)</li>
                  <li>Rest period: <strong>{options.rest_weeks_between_matches === 0 ? 'No minimum rest' : `${options.rest_weeks_between_matches} week(s) minimum`}</strong></li>
                </ul>
              </div>
            </div>
          ) : (
            /* Preview Step */
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-3">
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    Generated {preview?.length || 0} fixtures across {previewMatchdays} matchdays
                  </p>
                </div>
              </div>

              {preview && Object.entries(groupFixturesByMatchday(preview)).map(([matchday, matches]) => (
                <div key={matchday} className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
                  <div className="bg-gray-50 dark:bg-gray-700 px-4 py-2 border-b border-gray-200 dark:border-gray-600">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      Matchday {matchday}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(matches[0].match_date)}
                    </p>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {matches.map((match, idx) => (
                      <div key={idx} className="px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-xs text-gray-500 dark:text-gray-400 w-16">
                            {formatTime(match.match_time)}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            Court {match.court_number}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {match.home_team?.name || 'Team A'}
                          </span>
                          <span className="text-xs text-gray-400">vs</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {match.away_team?.name || 'Team B'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          {step === 'preview' && (
            <button
              onClick={() => setStep('configure')}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              Back to Settings
            </button>
          )}
          <div className={step === 'configure' ? 'ml-auto' : ''}>
            {step === 'configure' ? (
              <button
                onClick={handlePreview}
                disabled={loading === 'preview'}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md disabled:opacity-50 flex items-center"
              >
                {loading === 'preview' ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Generating Preview...
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Preview Fixtures
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={loading === 'generate'}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md disabled:opacity-50 flex items-center"
              >
                {loading === 'generate' ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Saving Fixtures...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Save Fixtures ({preview?.length || 0})
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

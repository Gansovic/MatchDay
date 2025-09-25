import { createClient } from '@/lib/supabase/client'
import type { 
  Season, 
  SeasonTeam, 
  Fixture, 
  SeasonStats,
  TournamentFormat,
  SeasonStatus,
  FixtureGenerationStatus
} from '@/lib/types/database.types'

export interface CreateSeasonParams {
  name: string
  league_id: string
  season_year: number
  display_name?: string
  tournament_format: TournamentFormat
  start_date: string
  end_date: string
  registration_deadline?: string
  match_frequency?: number
  preferred_match_time?: string
  min_teams?: number
  max_teams?: number
  rounds?: number
  points_for_win?: number
  points_for_draw?: number
  points_for_loss?: number
  knockout_legs?: number
  third_place_playoff?: boolean
  playoff_teams_count?: number
  playoff_format?: 'knockout' | 'league'
  allow_draws?: boolean
  home_away_balance?: boolean
  venue_conflicts_check?: boolean
  bye_week_handling?: 'rotate' | 'none' | 'end'
  rules?: Record<string, any>
  settings?: Record<string, any>
  metadata?: Record<string, any>
}

export interface UpdateSeasonParams extends Partial<Omit<CreateSeasonParams, 'league_id' | 'season_year'>> {
  status?: SeasonStatus
}

export interface SeasonOverview extends Season {
  league: {
    name: string
    sport_type: string
  }
  registered_teams_count: number
  total_matches_scheduled: number
  total_matches_played: number
  current_matchday: number
  completion_percentage: number
}

export interface GenerateFixturesParams {
  force_regenerate?: boolean
  start_date_override?: string
  match_time_override?: string
  venue_preferences?: Record<string, string>
}

export interface TeamRegistrationParams {
  team_id: string
  preferred_home_venue?: string
  unavailable_dates?: string[]
  preferred_match_times?: string[]
  seeding?: number
  notes?: string
  metadata?: Record<string, any>
}

export class SeasonService {
  private supabase = createClient()

  /**
   * Get all seasons with optional filters
   */
  async getSeasons(params?: {
    league_id?: string
    status?: SeasonStatus
    year?: number
    page?: number
    limit?: number
  }) {
    const { league_id, status, year, page = 1, limit = 20 } = params || {}
    
    let query = this.supabase
      .from('season_overview')
      .select('*')
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (league_id) query = query.eq('league_id', league_id)
    if (status) query = query.eq('status', status)
    if (year) query = query.eq('season_year', year)

    const { data, error, count } = await query

    if (error) throw error

    return {
      data: data as SeasonOverview[],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    }
  }

  /**
   * Get a single season with full details
   */
  async getSeason(seasonId: string) {
    const { data, error } = await this.supabase
      .from('season_overview')
      .select(`
        *,
        league:leagues(
          id, name, sport_type, created_by,
          created_by_user:user_profiles!created_by(display_name, avatar_url)
        ),
        team_registrations:season_teams(
          id, status, registered_at, seeding, notes,
          team:teams(
            id, name, logo_url, captain_id,
            captain:user_profiles!captain_id(display_name)
          ),
          registered_by_user:user_profiles!registered_by(display_name)
        ),
        stats:season_stats(*)
      `)
      .eq('id', seasonId)
      .single()

    if (error) throw error
    return data as SeasonOverview & {
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
      stats: SeasonStats
    }
  }

  /**
   * Create a new season
   */
  async createSeason(params: CreateSeasonParams) {
    const response = await fetch('/api/seasons', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create season')
    }

    return response.json()
  }

  /**
   * Update a season
   */
  async updateSeason(seasonId: string, params: UpdateSeasonParams) {
    const response = await fetch(`/api/seasons/${seasonId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update season')
    }

    return response.json()
  }

  /**
   * Delete a season
   */
  async deleteSeason(seasonId: string) {
    const response = await fetch(`/api/seasons/${seasonId}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete season')
    }

    return response.json()
  }

  /**
   * Generate fixtures for a season
   */
  async generateFixtures(seasonId: string, params?: GenerateFixturesParams) {
    const response = await fetch(`/api/seasons/${seasonId}/fixtures`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params || {})
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to generate fixtures')
    }

    return response.json()
  }

  /**
   * Get fixtures for a season
   */
  async getFixtures(seasonId: string, params?: {
    round?: number
    matchday?: number
    status?: string
    upcoming?: boolean
    group_by?: 'round' | 'matchday'
    limit?: number
  }) {
    const searchParams = new URLSearchParams()
    
    if (params?.round) searchParams.set('round', params.round.toString())
    if (params?.matchday) searchParams.set('matchday', params.matchday.toString())
    if (params?.status) searchParams.set('status', params.status)
    if (params?.upcoming) searchParams.set('upcoming', 'true')
    if (params?.group_by) searchParams.set('group_by', params.group_by)
    if (params?.limit) searchParams.set('limit', params.limit.toString())

    const response = await fetch(`/api/seasons/${seasonId}/fixtures?${searchParams}`)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch fixtures')
    }

    return response.json()
  }

  /**
   * Delete fixtures for a season
   */
  async deleteFixtures(seasonId: string) {
    const response = await fetch(`/api/seasons/${seasonId}/fixtures`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete fixtures')
    }

    return response.json()
  }

  /**
   * Get team registrations for a season
   */
  async getTeamRegistrations(seasonId: string, status?: string) {
    const searchParams = new URLSearchParams()
    if (status) searchParams.set('status', status)

    const response = await fetch(`/api/seasons/${seasonId}/teams?${searchParams}`)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch team registrations')
    }

    return response.json()
  }

  /**
   * Register a team for a season
   */
  async registerTeam(seasonId: string, params: TeamRegistrationParams) {
    const response = await fetch(`/api/seasons/${seasonId}/teams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to register team')
    }

    return response.json()
  }

  /**
   * Update team registration
   */
  async updateTeamRegistration(
    seasonId: string, 
    teamId: string, 
    params: Partial<TeamRegistrationParams & { status: string; withdrawal_reason?: string }>
  ) {
    const response = await fetch(`/api/seasons/${seasonId}/teams/${teamId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update team registration')
    }

    return response.json()
  }

  /**
   * Remove team from season
   */
  async removeTeamFromSeason(seasonId: string, teamId: string) {
    const response = await fetch(`/api/seasons/${seasonId}/teams/${teamId}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to remove team from season')
    }

    return response.json()
  }

  /**
   * Get season statistics
   */
  async getSeasonStats(seasonId: string) {
    const { data, error } = await this.supabase
      .from('season_stats')
      .select('*')
      .eq('season_id', seasonId)
      .single()

    if (error) throw error
    return data as SeasonStats
  }

  /**
   * Helper method to get available leagues for season creation
   */
  async getAvailableLeagues() {
    const { data, error } = await this.supabase
      .from('leagues')
      .select('id, name, sport_type, created_by, status')
      .eq('status', 'active')
      .is('deleted_at', null)
      .order('name')

    if (error) throw error
    return data
  }

  /**
   * Helper method to get teams available for registration
   */
  async getAvailableTeams(leagueId: string, seasonId?: string) {
    let query = this.supabase
      .from('teams')
      .select(`
        id, name, logo_url, captain_id,
        captain:user_profiles!captain_id(display_name)
      `)
      .eq('league_id', leagueId)
      .is('deleted_at', null)
      .eq('status', 'active')

    // Exclude teams already registered for this season
    if (seasonId) {
      const { data: registeredTeams } = await this.supabase
        .from('season_teams')
        .select('team_id')
        .eq('season_id', seasonId)

      if (registeredTeams?.length) {
        const registeredIds = registeredTeams.map(r => r.team_id)
        query = query.not('id', 'in', `(${registeredIds.join(',')})`)
      }
    }

    const { data, error } = await query.order('name')

    if (error) throw error
    return data
  }
}

export const seasonService = new SeasonService()
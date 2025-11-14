import { supabase as supabaseClient } from '@/lib/supabase/client'
import type {
  Season,
  SeasonTeam,
  Fixture,
  SeasonStats,
  TournamentFormat,
  SeasonStatus,
  FixtureGenerationStatus
} from '@matchday/database'

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
  private supabase = supabaseClient

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
      .from('seasons')
      .select('*, league:leagues(name, sport_type)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (league_id) query = query.eq('league_id', league_id)
    if (status) query = query.eq('status', status)
    if (year) query = query.eq('season_year', year)

    const { data, error, count } = await query

    if (error) throw error

    // Enhance data with calculated fields
    const enhancedData = (data || []).map(season => ({
      ...season,
      registered_teams_count: 0, // TODO: Add join or separate query
      total_matches_scheduled: 0,
      total_matches_played: 0,
      current_matchday: season.current_matchday || 1,
      completion_percentage: 0
    }))

    return {
      data: enhancedData as SeasonOverview[],
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
    console.log('[SeasonService] Getting season:', seasonId)

    // First, get basic season data
    const { data, error } = await this.supabase
      .from('seasons')
      .select('*')
      .eq('id', seasonId)
      .single()

    if (error) {
      console.error('[SeasonService] Supabase error:', error)
      throw new Error(error.message || 'Failed to fetch season data')
    }

    if (!data) {
      throw new Error('Season not found')
    }

    console.log('[SeasonService] Basic season data loaded successfully')

    // Get league data
    const { data: league, error: leagueError } = await this.supabase
      .from('leagues')
      .select('id, name, sport_type, created_by')
      .eq('id', data.league_id)
      .single()

    if (leagueError) {
      console.error('[SeasonService] League error:', leagueError)
    }

    // Get teams for this league (teams belong directly to leagues)
    // Since we don't have a season_teams table yet, we query teams by league_id
    let teamRegistrations: any[] = []

    if (data.league_id) {
      // First, fetch teams
      const { data: teams, error: teamsError } = await this.supabase
        .from('teams')
        .select('id, name, logo_url, logo_media_id, captain_id, created_at')
        .eq('league_id', data.league_id)
        .eq('is_archived', false)
        .order('name')

      if (teamsError) {
        console.error('[SeasonService] Teams error:', teamsError)
        console.error('[SeasonService] Full error details:', JSON.stringify(teamsError))
      } else if (teams && teams.length > 0) {
        console.log('[SeasonService] Loaded teams from league:', teams.length)

        // Get unique captain IDs
        const captainIds = [...new Set(teams.map(t => t.captain_id).filter(Boolean))]

        // Fetch captain profiles
        let captainProfiles: any[] = []
        if (captainIds.length > 0) {
          const { data: captains, error: captainsError } = await this.supabase
            .from('user_profiles')
            .select('id, display_name, full_name, avatar_url')
            .in('id', captainIds)

          if (captainsError) {
            console.error('[SeasonService] Captains error:', captainsError)
          } else {
            captainProfiles = captains || []
          }
        }

        // Create a map of captain profiles
        const captainMap = new Map(captainProfiles.map(c => [c.id, c]))

        // Format teams to match expected team_registrations structure
        teamRegistrations = teams.map((team: any) => {
          const captain = team.captain_id ? captainMap.get(team.captain_id) : null

          return {
            id: team.id,
            team_id: team.id,
            season_id: seasonId,
            status: 'accepted', // Default status since no season_teams table
            registered_at: team.created_at,
            team: {
              id: team.id,
              name: team.name,
              logo_url: team.logo_url,
              logo_media_id: team.logo_media_id,
              captain_id: team.captain_id,
              captain: captain ? {
                id: captain.id,
                display_name: captain.display_name || captain.full_name || 'Unknown',
                avatar_url: captain.avatar_url
              } : null
            }
          }
        })
      }
    }

    console.log('[SeasonService] All data loaded successfully')

    // Calculate additional statistics
    const registered_teams_count = teamRegistrations?.length || data.registered_teams_count || 0
    const total_matches_scheduled = 0 // TODO: Calculate from fixtures
    const total_matches_played = 0 // TODO: Calculate from matches
    const current_matchday = data.current_matchday || 1
    const completion_percentage = 0 // TODO: Calculate based on matches played

    return {
      ...data,
      league: league || {
        id: data.league_id,
        name: 'Unknown League',
        sport_type: 'football',
        created_by: '',
        created_by_user: { display_name: 'Unknown', avatar_url: undefined }
      },
      team_registrations: teamRegistrations || [],
      stats: null,
      registered_teams_count,
      total_matches_scheduled,
      total_matches_played,
      current_matchday,
      completion_percentage
    } as any // Simplified typing for now
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
    // Get the current session token
    const { data: { session } } = await this.supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No active session. Please log in again.');
    }

    const response = await fetch(`/api/seasons/${seasonId}/fixtures/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      credentials: 'include', // Include cookies for authentication
      body: JSON.stringify(params || {})
    })

    if (!response.ok) {
      // Try to parse error as JSON, but handle cases where it's not valid JSON
      let errorMessage = 'Failed to generate fixtures';
      try {
        const error = await response.json();
        errorMessage = error.error || error.message || errorMessage;
      } catch (e) {
        // Response wasn't JSON, use status text
        errorMessage = `${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
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
    console.log('[SeasonService] Getting fixtures for season:', seasonId)

    // TODO: Fixtures table not yet implemented in database
    // Return empty array for now until fixtures table is created
    console.log('[SeasonService] Fixtures table not yet available, returning empty array')

    return {
      success: true,
      data: [],
      count: 0
    }

    // Uncomment when fixtures table is created:
    /*
    // Query fixtures directly from Supabase
    let query = this.supabase
      .from('fixtures')
      .select('*')
      .eq('season_id', seasonId)
      .order('match_date', { ascending: true })

    if (params?.round) {
      query = query.eq('round_number', params.round)
    }
    if (params?.matchday) {
      query = query.eq('matchday', params.matchday)
    }
    if (params?.status) {
      query = query.eq('status', params.status)
    }
    if (params?.upcoming) {
      const now = new Date().toISOString()
      query = query.gte('match_date', now)
    }
    if (params?.limit) {
      query = query.limit(params.limit)
    }

    const { data, error } = await query

    if (error) {
      console.error('[SeasonService] Fixtures error:', error)
      throw new Error(error.message || 'Failed to fetch fixtures')
    }

    console.log('[SeasonService] Fixtures loaded:', data?.length || 0)

    return {
      success: true,
      data: data || [],
      count: data?.length || 0
    }
    */
  }

  /**
   * Delete fixtures for a season
   */
  async deleteFixtures(seasonId: string) {
    // Get the current session token
    const { data: { session } } = await this.supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No active session. Please log in again.');
    }

    const response = await fetch(`/api/seasons/${seasonId}/fixtures`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
      credentials: 'include' // Include cookies for authentication
    })

    if (!response.ok) {
      // Try to parse error as JSON, but handle cases where it's not valid JSON
      let errorMessage = 'Failed to delete fixtures';
      try {
        const error = await response.json();
        errorMessage = error.error || error.message || errorMessage;
      } catch (e) {
        // Response wasn't JSON, use status text
        errorMessage = `${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
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
      credentials: 'include', // Include cookies for authentication
      body: JSON.stringify(params)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update team registration')
    }

    return response.json()
  }

  /**
   * Update team registration status (simplified version)
   */
  async updateTeamStatus(seasonId: string, teamId: string, status: 'accepted' | 'declined') {
    return this.updateTeamRegistration(seasonId, teamId, { status })
  }

  /**
   * Remove team from season
   */
  async removeTeamFromSeason(seasonId: string, teamId: string) {
    const response = await fetch(`/api/seasons/${seasonId}/teams/${teamId}`, {
      method: 'DELETE',
      credentials: 'include' // Include cookies for authentication
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
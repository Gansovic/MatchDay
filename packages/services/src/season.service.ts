/**
 * Season Service for MatchDay
 * 
 * Handles season management operations including:
 * - Season creation and management
 * - Team registration for seasons
 * - Match scheduling and fixture generation
 * - Season statistics and standings
 */

import { SupabaseClient } from '@supabase/supabase-js';

export interface Season {
  id: string;
  name: string;
  league_id: string;
  season_year: number;
  display_name?: string;
  status: 'draft' | 'registration' | 'active' | 'completed' | 'cancelled';
  tournament_format: 'league' | 'knockout' | 'hybrid';
  start_date: string;
  end_date: string;
  registration_deadline?: string;
  match_frequency?: number;
  preferred_match_time?: string;
  min_teams?: number;
  max_teams?: number;
  registered_teams_count?: number;
  rounds?: number;
  points_for_win?: number;
  points_for_draw?: number;
  points_for_loss?: number;
  allow_draws?: boolean;
  home_away_balance?: boolean;
  fixtures_status: 'pending' | 'generating' | 'completed' | 'error';
  fixtures_generated_at?: string;
  total_matches_planned?: number;
  // Amateur league scheduling fields
  match_day?: string; // Day of week: 'monday', 'tuesday', etc.
  match_start_time?: string; // Start time: '19:00:00'
  match_end_time?: string; // End time: '21:00:00'
  courts_available?: number; // Number of courts
  games_per_court?: number; // Games per court in time window
  rest_weeks_between_matches?: number; // Weeks between team matches
  // End scheduling
  rules?: any;
  settings?: any;
  metadata?: any;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface SeasonTeam {
  id: string;
  season_id: string;
  team_id: string;
  registration_date: string;
  status: 'registered' | 'confirmed' | 'withdrawn';
  team?: {
    id: string;
    name: string;
    team_color?: string;
    captain_id?: string;
  };
}

export interface Match {
  id: string;
  season_id: string;
  home_team_id: string;
  away_team_id: string;
  match_date?: string;
  match_time?: string;
  matchday_number?: number;
  court_number?: number;
  round_number?: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  home_score?: number;
  away_score?: number;
  venue?: string;
  home_team?: {
    id: string;
    name: string;
    team_color?: string;
  };
  away_team?: {
    id: string;
    name: string;
    team_color?: string;
  };
}

export interface ServiceResponse<T> {
  data: T | null;
  error: any | null;
  success: boolean;
  message?: string;
}

export class SeasonService {
  private static instance: SeasonService;
  private supabase: SupabaseClient;

  private constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  static getInstance(supabaseClient?: SupabaseClient): SeasonService {
    if (!SeasonService.instance) {
      if (!supabaseClient) {
        throw new Error('SupabaseClient required for first initialization');
      }
      SeasonService.instance = new SeasonService(supabaseClient);
    }
    return SeasonService.instance;
  }

  /**
   * Get all seasons for a league
   */
  async getSeasonsByLeague(leagueId: string): Promise<ServiceResponse<Season[]>> {
    try {
      const { data: seasons, error } = await this.supabase
        .from('seasons')
        .select('*')
        .eq('league_id', leagueId)
        .order('season_year', { ascending: false });

      if (error) throw error;

      return {
        data: seasons || [],
        error: null,
        success: true,
        message: 'Seasons retrieved successfully'
      };
    } catch (error) {
      return {
        data: null,
        error,
        success: false,
        message: 'Failed to get seasons'
      };
    }
  }

  /**
   * Get season details with teams
   */
  async getSeasonDetails(seasonId: string): Promise<ServiceResponse<Season & { teams?: SeasonTeam[] }>> {
    try {
      const { data: season, error } = await this.supabase
        .from('seasons')
        .select(`
          *,
          season_teams (
            id,
            team_id,
            registration_date,
            status,
            team:teams (
              id,
              name,
              team_color,
              captain_id
            )
          )
        `)
        .eq('id', seasonId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            data: null,
            error: { code: 'SEASON_NOT_FOUND', message: 'Season not found' },
            success: false
          };
        }
        throw error;
      }

      return {
        data: {
          ...season,
          teams: season.season_teams || []
        },
        error: null,
        success: true,
        message: 'Season details retrieved successfully'
      };
    } catch (error) {
      return {
        data: null,
        error,
        success: false,
        message: 'Failed to get season details'
      };
    }
  }

  /**
   * Create a new season
   */
  async createSeason(seasonData: Partial<Season>): Promise<ServiceResponse<Season>> {
    try {
      const { data: season, error } = await this.supabase
        .from('seasons')
        .insert([{
          name: seasonData.name,
          league_id: seasonData.league_id,
          season_year: seasonData.season_year || new Date().getFullYear(),
          display_name: seasonData.display_name || seasonData.name,
          status: seasonData.status || 'draft',
          tournament_format: seasonData.tournament_format || 'league',
          start_date: seasonData.start_date,
          end_date: seasonData.end_date,
          registration_deadline: seasonData.registration_deadline,
          match_frequency: seasonData.match_frequency || 7,
          preferred_match_time: seasonData.preferred_match_time || '15:00:00',
          min_teams: seasonData.min_teams || 2,
          max_teams: seasonData.max_teams,
          rounds: seasonData.rounds || 1,
          points_for_win: seasonData.points_for_win || 3,
          points_for_draw: seasonData.points_for_draw || 1,
          points_for_loss: seasonData.points_for_loss || 0,
          allow_draws: seasonData.allow_draws !== false,
          home_away_balance: seasonData.home_away_balance !== false,
          rules: seasonData.rules || {},
          settings: seasonData.settings || {},
          metadata: seasonData.metadata || {},
          created_by: seasonData.created_by
        }])
        .select()
        .single();

      if (error) throw error;

      return {
        data: season,
        error: null,
        success: true,
        message: 'Season created successfully'
      };
    } catch (error) {
      return {
        data: null,
        error,
        success: false,
        message: 'Failed to create season'
      };
    }
  }

  /**
   * Update season
   */
  async updateSeason(seasonId: string, updates: Partial<Season>): Promise<ServiceResponse<Season>> {
    try {
      const { data: season, error } = await this.supabase
        .from('seasons')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', seasonId)
        .select()
        .single();

      if (error) throw error;

      return {
        data: season,
        error: null,
        success: true,
        message: 'Season updated successfully'
      };
    } catch (error) {
      return {
        data: null,
        error,
        success: false,
        message: 'Failed to update season'
      };
    }
  }

  /**
   * Register team for season
   */
  async registerTeamForSeason(seasonId: string, teamId: string): Promise<ServiceResponse<SeasonTeam>> {
    try {
      // Check if team is already registered
      const { data: existing, error: checkError } = await this.supabase
        .from('season_teams')
        .select('id')
        .eq('season_id', seasonId)
        .eq('team_id', teamId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') throw checkError;

      if (existing) {
        return {
          data: null,
          error: { code: 'ALREADY_REGISTERED', message: 'Team is already registered for this season' },
          success: false
        };
      }

      // Register the team
      const { data: registration, error } = await this.supabase
        .from('season_teams')
        .insert([{
          season_id: seasonId,
          team_id: teamId,
          registration_date: new Date().toISOString(),
          status: 'registered'
        }])
        .select(`
          *,
          team:teams (
            id,
            name,
            team_color,
            captain_id
          )
        `)
        .single();

      if (error) throw error;

      // Update registered teams count
      await this.updateRegisteredTeamsCount(seasonId);

      return {
        data: registration,
        error: null,
        success: true,
        message: 'Team registered for season successfully'
      };
    } catch (error) {
      return {
        data: null,
        error,
        success: false,
        message: 'Failed to register team for season'
      };
    }
  }

  /**
   * Get all match dates for a specific day of week within season
   * For amateur leagues: Returns all Thursdays (or specified day) within the season
   */
  private getMatchDatesForDay(
    startDate: Date,
    endDate: Date,
    matchDay: string
  ): Date[] {
    const dates: Date[] = [];
    const dayMap: Record<string, number> = {
      sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
      thursday: 4, friday: 5, saturday: 6
    };

    const targetDayNumber = dayMap[matchDay.toLowerCase()];
    if (targetDayNumber === undefined) {
      throw new Error(`Invalid match day: ${matchDay}`);
    }

    let currentDate = new Date(startDate);

    // Find first occurrence of target day
    while (currentDate.getDay() !== targetDayNumber && currentDate <= endDate) {
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Collect all occurrences of target day
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 7); // Move to next week
    }

    return dates;
  }

  /**
   * Assign match dates for amateur league scheduling
   * All games in a matchday happen at the SAME time on different courts
   *
   * Example: Thursday 19:00-21:00, 4 courts, 2 games per court = 8 games capacity
   * - Matchday 1: 8 games on Thursday Week 1 at 19:00, courts 1-4
   * - Matchday 2: 8 games on Thursday Week 2 at 19:00, courts 1-4
   */
  private assignMatchDatesAdvanced(
    fixtures: Array<{
      home_team_id: string;
      away_team_id: string;
      round_number: number;
    }>,
    season: Season
  ): Array<{
    home_team_id: string;
    away_team_id: string;
    round_number: number;
    match_date: string;
    match_time: string;
    court_number: number;
    matchday_number: number;
  }> {
    const startDate = new Date(season.start_date);
    const endDate = new Date(season.end_date);

    // Parse configuration with defaults for amateur leagues
    const matchDay = season.match_day || 'saturday';
    const matchTime = season.match_start_time || '19:00:00';
    const courtsAvailable = season.courts_available || 1;
    const gamesPerCourt = season.games_per_court || 2;
    const restWeeks = season.rest_weeks_between_matches || 0;

    // Calculate total capacity per matchday
    const gamesPerMatchday = courtsAvailable * gamesPerCourt;

    // Get all available match dates (e.g., all Thursdays in the season)
    const availableDates = this.getMatchDatesForDay(startDate, endDate, matchDay);

    // Calculate matchdays needed
    const totalMatches = fixtures.length;
    const matchdaysNeeded = Math.ceil(totalMatches / gamesPerMatchday);

    if (availableDates.length < matchdaysNeeded) {
      throw new Error(
        `Not enough ${matchDay}s in season: Need ${matchdaysNeeded} matchdays but only ${availableDates.length} ${matchDay}s available between ${season.start_date} and ${season.end_date}. ` +
        `Try extending the season duration or reducing games per court.`
      );
    }

    // Track when each team last played (for rest period validation)
    const teamLastMatchday = new Map<string, number>();

    const fixturesWithDates: any[] = [];
    let matchdayNumber = 1;
    let dateIndex = 0;
    let courtNumber = 1;
    let gamesOnCurrentMatchday = 0;

    for (let i = 0; i < fixtures.length; i++) {
      const fixture = fixtures[i];

      // Check if we need to move to next matchday
      let needNewMatchday = gamesOnCurrentMatchday >= gamesPerMatchday;

      // Check rest period if configured
      if (!needNewMatchday && restWeeks > 0) {
        const homeLastMatchday = teamLastMatchday.get(fixture.home_team_id) || 0;
        const awayLastMatchday = teamLastMatchday.get(fixture.away_team_id) || 0;

        const weeksSinceHome = matchdayNumber - homeLastMatchday;
        const weeksSinceAway = matchdayNumber - awayLastMatchday;

        if (weeksSinceHome < restWeeks || weeksSinceAway < restWeeks) {
          needNewMatchday = true;
        }
      }

      // Move to next matchday if needed
      if (needNewMatchday) {
        matchdayNumber++;
        dateIndex++;
        courtNumber = 1;
        gamesOnCurrentMatchday = 0;

        if (dateIndex >= availableDates.length) {
          throw new Error(
            `Not enough ${matchDay}s to schedule all fixtures with rest period of ${restWeeks} weeks. ` +
            `Try extending the season, reducing rest weeks, or increasing courts/games per court.`
          );
        }

        // Re-check rest period for this fixture on new matchday
        if (restWeeks > 0) {
          const homeLastMatchday = teamLastMatchday.get(fixture.home_team_id) || 0;
          const awayLastMatchday = teamLastMatchday.get(fixture.away_team_id) || 0;

          const weeksSinceHome = matchdayNumber - homeLastMatchday;
          const weeksSinceAway = matchdayNumber - awayLastMatchday;

          if (weeksSinceHome < restWeeks || weeksSinceAway < restWeeks) {
            // Skip ahead until both teams have rested enough
            const minMatchdayForHome = homeLastMatchday + restWeeks;
            const minMatchdayForAway = awayLastMatchday + restWeeks;
            const minMatchday = Math.max(minMatchdayForHome, minMatchdayForAway);

            const matchdaysToSkip = minMatchday - matchdayNumber;
            dateIndex += matchdaysToSkip;
            matchdayNumber = minMatchday;

            if (dateIndex >= availableDates.length) {
              throw new Error(
                `Cannot schedule match: Team(s) cannot play their matches with ${restWeeks} weeks rest. ` +
                `Try extending the season or reducing rest weeks.`
              );
            }
          }
        }
      }

      const matchDate = availableDates[dateIndex];

      // Update team last played matchday
      teamLastMatchday.set(fixture.home_team_id, matchdayNumber);
      teamLastMatchday.set(fixture.away_team_id, matchdayNumber);

      // Calculate court number (cycle through available courts)
      courtNumber = (gamesOnCurrentMatchday % courtsAvailable) + 1;

      fixturesWithDates.push({
        ...fixture,
        match_date: matchDate.toISOString().split('T')[0],
        match_time: matchTime,
        court_number: courtNumber,
        matchday_number: matchdayNumber
      });

      gamesOnCurrentMatchday++;
    }

    return fixturesWithDates;
  }

  /**
   * Generate round-robin fixtures for a season
   * @param seasonId The season to generate fixtures for
   * @param preview If true, returns preview without saving to database
   */
  async generateFixtures(seasonId: string, preview: boolean = false): Promise<ServiceResponse<Match[]>> {
    try {
      console.log('🔧 [SeasonService] Starting fixture generation for season:', seasonId);

      // Get season details
      const seasonResponse = await this.getSeasonDetails(seasonId);
      if (!seasonResponse.success || !seasonResponse.data) {
        throw new Error('Season not found');
      }

      const season = seasonResponse.data;
      console.log('🔧 [SeasonService] Season loaded:', season.name);
      console.log('🔧 [SeasonService] Season teams:', season.teams?.length || 0);

      const teams = season.teams?.filter(t => t.status === 'registered' || t.status === 'confirmed') || [];
      console.log('🔧 [SeasonService] Registered teams count:', teams.length);

      if (teams.length < 2) {
        return {
          data: null,
          error: { code: 'INSUFFICIENT_TEAMS', message: 'Need at least 2 teams to generate fixtures' },
          success: false
        };
      }

      // Update fixtures status to generating (skip in preview mode)
      if (!preview) {
        console.log('🔧 [SeasonService] Updating season status to generating...');
        const updateResult = await this.updateSeason(seasonId, {
          fixtures_status: 'generating',
          total_matches_planned: this.calculateTotalMatches(teams.length, season.rounds || 1, season.home_away_balance || false)
        });
        console.log('🔧 [SeasonService] Update season result:', updateResult.success ? 'SUCCESS' : 'FAILED');
        if (!updateResult.success) {
          console.error('🔧 [SeasonService] Update season error:', updateResult.error);
        }
      }

      // Generate round-robin fixtures
      console.log('🔧 [SeasonService] Generating round-robin fixtures...');
      const fixtures = this.generateRoundRobinFixtures(teams, season.rounds || 1, season.home_away_balance || false);
      console.log('🔧 [SeasonService] Generated', fixtures.length, 'fixtures');

      // Assign dates using advanced algorithm (respects venue capacity, days, time slots)
      console.log('🔧 [SeasonService] Assigning match dates...');
      const fixturesWithDates = this.assignMatchDatesAdvanced(fixtures, season);
      console.log('🔧 [SeasonService] Assigned dates to', fixturesWithDates.length, 'fixtures');

      // Preview mode: return without saving
      if (preview) {
        return {
          data: fixturesWithDates as any,
          error: null,
          success: true,
          message: `Preview: ${fixturesWithDates.length} fixtures across ${Math.max(...fixturesWithDates.map(f => f.matchday_number))} matchdays`
        };
      }

      // Clear existing fixtures for this season
      console.log('🔧 [SeasonService] Clearing existing fixtures...');
      await this.supabase
        .from('matches')
        .delete()
        .eq('season_id', seasonId);

      // Insert new fixtures
      console.log('🔧 [SeasonService] Inserting', fixturesWithDates.length, 'new fixtures...');
      const { data: matches, error } = await this.supabase
        .from('matches')
        .insert(fixturesWithDates.map(fixture => ({
          season_id: seasonId,
          home_team_id: fixture.home_team_id,
          away_team_id: fixture.away_team_id,
          match_date: `${fixture.match_date}T${fixture.match_time}Z`,
          match_time: fixture.match_time,
          court_number: fixture.court_number,
          matchday_number: fixture.matchday_number,
          status: 'scheduled'
        })))
        .select(`
          *,
          home_team:teams!matches_home_team_id_fkey (
            id,
            name,
            team_color
          ),
          away_team:teams!matches_away_team_id_fkey (
            id,
            name,
            team_color
          )
        `);

      if (error) {
        console.error('🔧 [SeasonService] Database insert error:', error);
        throw error;
      }

      console.log('🔧 [SeasonService] Successfully inserted', matches?.length || 0, 'matches');

      // Update fixtures status to completed
      await this.updateSeason(seasonId, {
        fixtures_status: 'completed',
        fixtures_generated_at: new Date().toISOString()
      });

      return {
        data: matches || [],
        error: null,
        success: true,
        message: `Successfully generated ${matches?.length || 0} fixtures`
      };
    } catch (error) {
      // Update fixtures status to error (skip in preview mode)
      if (!preview) {
        await this.updateSeason(seasonId, {
          fixtures_status: 'error'
        });
      }

      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to generate fixtures',
        success: false,
        message: error instanceof Error ? error.message : 'Failed to generate fixtures'
      };
    }
  }

  /**
   * Get matches for a season
   */
  async getSeasonMatches(seasonId: string): Promise<ServiceResponse<Match[]>> {
    try {
      const { data: matches, error } = await this.supabase
        .from('matches')
        .select(`
          *,
          home_team:teams!matches_home_team_id_fkey (
            id,
            name,
            team_color
          ),
          away_team:teams!matches_away_team_id_fkey (
            id,
            name,
            team_color
          )
        `)
        .eq('season_id', seasonId)
        .order('match_date', { ascending: true });

      if (error) throw error;

      return {
        data: matches || [],
        error: null,
        success: true,
        message: 'Season matches retrieved successfully'
      };
    } catch (error) {
      return {
        data: null,
        error,
        success: false,
        message: 'Failed to get season matches'
      };
    }
  }

  /**
   * Private helper methods
   */
  private async updateRegisteredTeamsCount(seasonId: string): Promise<void> {
    const { count } = await this.supabase
      .from('season_teams')
      .select('*', { count: 'exact', head: true })
      .eq('season_id', seasonId)
      .in('status', ['registered', 'confirmed']);

    await this.supabase
      .from('seasons')
      .update({ registered_teams_count: count || 0 })
      .eq('id', seasonId);
  }

  private calculateTotalMatches(teamsCount: number, rounds: number, homeAndAway: boolean): number {
    const matchesPerRound = (teamsCount * (teamsCount - 1)) / 2;
    const multiplier = homeAndAway ? 2 : 1;
    return matchesPerRound * rounds * multiplier;
  }

  private generateRoundRobinFixtures(teams: SeasonTeam[], rounds: number, homeAndAway: boolean): Array<{
    home_team_id: string;
    away_team_id: string;
    round_number: number;
  }> {
    const fixtures: Array<{
      home_team_id: string;
      away_team_id: string;
      round_number: number;
    }> = [];

    for (let round = 1; round <= rounds; round++) {
      // Generate all possible pairings
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          fixtures.push({
            home_team_id: teams[i].team_id,
            away_team_id: teams[j].team_id,
            round_number: round
          });

          // Add reverse fixture if home and away
          if (homeAndAway) {
            fixtures.push({
              home_team_id: teams[j].team_id,
              away_team_id: teams[i].team_id,
              round_number: round
            });
          }
        }
      }
    }

    return fixtures;
  }
}
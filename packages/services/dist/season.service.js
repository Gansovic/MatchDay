/**
 * Season Service for MatchDay
 *
 * Handles season management operations including:
 * - Season creation and management
 * - Team registration for seasons
 * - Match scheduling and fixture generation
 * - Season statistics and standings
 */
export class SeasonService {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
    }
    static getInstance(supabaseClient) {
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
    async getSeasonsByLeague(leagueId) {
        try {
            const { data: seasons, error } = await this.supabase
                .from('seasons')
                .select('*')
                .eq('league_id', leagueId)
                .order('season_year', { ascending: false });
            if (error)
                throw error;
            return {
                data: seasons || [],
                error: null,
                success: true,
                message: 'Seasons retrieved successfully'
            };
        }
        catch (error) {
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
    async getSeasonDetails(seasonId) {
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
        }
        catch (error) {
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
    async createSeason(seasonData) {
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
                    metadata: seasonData.metadata || {}
                }])
                .select()
                .single();
            if (error)
                throw error;
            return {
                data: season,
                error: null,
                success: true,
                message: 'Season created successfully'
            };
        }
        catch (error) {
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
    async updateSeason(seasonId, updates) {
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
            if (error)
                throw error;
            return {
                data: season,
                error: null,
                success: true,
                message: 'Season updated successfully'
            };
        }
        catch (error) {
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
    async registerTeamForSeason(seasonId, teamId) {
        try {
            // Check if team is already registered
            const { data: existing, error: checkError } = await this.supabase
                .from('season_teams')
                .select('id')
                .eq('season_id', seasonId)
                .eq('team_id', teamId)
                .single();
            if (checkError && checkError.code !== 'PGRST116')
                throw checkError;
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
            if (error)
                throw error;
            // Update registered teams count
            await this.updateRegisteredTeamsCount(seasonId);
            return {
                data: registration,
                error: null,
                success: true,
                message: 'Team registered for season successfully'
            };
        }
        catch (error) {
            return {
                data: null,
                error,
                success: false,
                message: 'Failed to register team for season'
            };
        }
    }
    /**
     * Generate round-robin fixtures for a season
     */
    async generateFixtures(seasonId) {
        try {
            // Get season details
            const seasonResponse = await this.getSeasonDetails(seasonId);
            if (!seasonResponse.success || !seasonResponse.data) {
                throw new Error('Season not found');
            }
            const season = seasonResponse.data;
            const teams = season.teams?.filter(t => t.status === 'registered' || t.status === 'confirmed') || [];
            if (teams.length < 2) {
                return {
                    data: null,
                    error: { code: 'INSUFFICIENT_TEAMS', message: 'Need at least 2 teams to generate fixtures' },
                    success: false
                };
            }
            // Update fixtures status to generating
            await this.updateSeason(seasonId, {
                fixtures_status: 'generating',
                total_matches_planned: this.calculateTotalMatches(teams.length, season.rounds || 1, season.home_away_balance || false)
            });
            // Generate round-robin fixtures
            const fixtures = this.generateRoundRobinFixtures(teams, season.rounds || 1, season.home_away_balance || false);
            // Calculate match dates based on season start date and frequency
            const fixturesWithDates = this.assignMatchDates(fixtures, season);
            // Clear existing fixtures for this season
            await this.supabase
                .from('matches')
                .delete()
                .eq('season_id', seasonId);
            // Insert new fixtures
            const { data: matches, error } = await this.supabase
                .from('matches')
                .insert(fixturesWithDates.map(fixture => ({
                season_id: seasonId,
                home_team_id: fixture.home_team_id,
                away_team_id: fixture.away_team_id,
                match_date: fixture.match_date,
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
            if (error)
                throw error;
            // Update fixtures status to completed
            await this.updateSeason(seasonId, {
                fixtures_status: 'completed',
                fixtures_generated_at: new Date().toISOString()
            });
            return {
                data: matches || [],
                error: null,
                success: true,
                message: 'Fixtures generated successfully'
            };
        }
        catch (error) {
            // Update fixtures status to error
            await this.updateSeason(seasonId, {
                fixtures_status: 'error',
                fixtures_generation_error: error instanceof Error ? error.message : 'Unknown error'
            });
            return {
                data: null,
                error,
                success: false,
                message: 'Failed to generate fixtures'
            };
        }
    }
    /**
     * Get matches for a season
     */
    async getSeasonMatches(seasonId) {
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
            if (error)
                throw error;
            return {
                data: matches || [],
                error: null,
                success: true,
                message: 'Season matches retrieved successfully'
            };
        }
        catch (error) {
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
    async updateRegisteredTeamsCount(seasonId) {
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
    calculateTotalMatches(teamsCount, rounds, homeAndAway) {
        const matchesPerRound = (teamsCount * (teamsCount - 1)) / 2;
        const multiplier = homeAndAway ? 2 : 1;
        return matchesPerRound * rounds * multiplier;
    }
    generateRoundRobinFixtures(teams, rounds, homeAndAway) {
        const fixtures = [];
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
    assignMatchDates(fixtures, season) {
        const startDate = new Date(season.start_date);
        const matchFrequencyDays = season.match_frequency || 7;
        const preferredTime = season.preferred_match_time || '15:00:00';
        return fixtures.map((fixture, index) => {
            const dayOffset = Math.floor(index / 2) * matchFrequencyDays; // 2 matches per day
            const matchDate = new Date(startDate);
            matchDate.setDate(matchDate.getDate() + dayOffset);
            return {
                ...fixture,
                match_date: `${matchDate.toISOString().split('T')[0]}T${preferredTime}Z`
            };
        });
    }
}
//# sourceMappingURL=season.service.js.map
/**
 * Tournament Fixture Generator Service for MatchDay
 * 
 * Handles automated fixture generation for different tournament formats:
 * - League (Single Round-Robin): Each team plays every other team once
 * - Knockout (Single Elimination): Tournament bracket with elimination rounds  
 * - League + Playoffs: Regular season followed by playoff bracket
 * 
 * Optimized for amateur leagues with single venue and intelligent scheduling
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  Database,
  League,
  Team,
  Match,
  InsertMatch,
  ServiceResponse,
  ServiceError,
  TournamentFormat,
  MatchType,
  MatchStatus
} from '@/lib/types/database.types';

export interface TournamentConfig {
  leagueId: string;
  format: TournamentFormat;
  startDate: Date;
  matchFrequency: number; // Days between matches
  playoffTeamsCount?: number; // For league_with_playoffs
  venue?: string;
}

export interface FixtureGenerationResult {
  totalMatches: number;
  regularSeasonMatches: number;
  playoffMatches: number;
  estimatedEndDate: Date;
  fixtures: {
    regularSeason: Match[];
    playoffs?: Match[];
  };
}

export interface RoundRobinPairing {
  homeTeam: Team;
  awayTeam: Team;
  round: number;
}

export interface KnockoutBracket {
  round: number;
  roundName: string;
  matches: {
    homeTeam: Team | null;
    awayTeam: Team | null;
    position: number;
  }[];
}

export class TournamentFixtureGeneratorService {
  private static instance: TournamentFixtureGeneratorService;
  private supabase: SupabaseClient<Database>;

  private constructor(supabaseClient: SupabaseClient<Database>) {
    this.supabase = supabaseClient;
  }

  static getInstance(supabaseClient?: SupabaseClient<Database>): TournamentFixtureGeneratorService {
    if (!TournamentFixtureGeneratorService.instance) {
      if (!supabaseClient) {
        throw new Error('SupabaseClient required for first initialization');
      }
      TournamentFixtureGeneratorService.instance = new TournamentFixtureGeneratorService(supabaseClient);
    }
    return TournamentFixtureGeneratorService.instance;
  }

  /**
   * Handle service errors consistently
   */
  private handleError(error: unknown, operation: string): ServiceError {
    console.error(`TournamentFixtureGeneratorService.${operation}:`, error);
    const err = error as Record<string, unknown>;
    return {
      code: (err.code as string) || 'UNKNOWN_ERROR',
      message: (err.message as string) || 'An unexpected error occurred',
      details: err.details || error,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate tournament fixtures based on format
   */
  async generateTournamentFixtures(config: TournamentConfig): Promise<ServiceResponse<FixtureGenerationResult>> {
    try {
      // Validate league exists and get teams
      const leagueValidation = await this.validateLeagueAndGetTeams(config.leagueId);
      if (!leagueValidation.success || !leagueValidation.data) {
        return leagueValidation as ServiceResponse<FixtureGenerationResult>;
      }

      const { league, teams } = leagueValidation.data;

      // Check if fixtures already generated
      if (league.fixtures_generated) {
        return {
          data: null,
          error: {
            code: 'FIXTURES_ALREADY_GENERATED',
            message: 'Fixtures have already been generated for this league',
            timestamp: new Date().toISOString()
          },
          success: false
        };
      }

      // Validate minimum teams for tournament format
      const minTeamsValidation = this.validateMinimumTeams(teams, config.format);
      if (!minTeamsValidation.success && minTeamsValidation.error) {
        return {
          data: null,
          error: minTeamsValidation.error,
          success: false
        };
      }

      let fixtures: FixtureGenerationResult;

      // Generate fixtures based on format
      switch (config.format) {
        case TournamentFormat.LEAGUE:
          fixtures = await this.generateLeagueFixtures(teams, config);
          break;
        case TournamentFormat.KNOCKOUT:
          fixtures = await this.generateKnockoutFixtures(teams, config);
          break;
        case TournamentFormat.LEAGUE_WITH_PLAYOFFS:
          fixtures = await this.generateLeagueWithPlayoffFixtures(teams, config);
          break;
        default:
          throw new Error(`Unsupported tournament format: ${config.format}`);
      }

      // Save fixtures to database
      const saveResult = await this.saveFixturesToDatabase(fixtures, config);
      if (!saveResult.success) {
        return {
          data: null,
          error: saveResult.error,
          success: false
        };
      }

      // Mark league as fixtures generated
      await this.markFixturesGenerated(config.leagueId);

      return { data: fixtures, error: null, success: true };

    } catch (error) {
      return {
        data: null,
        error: this.handleError(error, 'generateTournamentFixtures'),
        success: false
      };
    }
  }

  /**
   * Generate single round-robin fixtures (each team plays every other team once)
   */
  private async generateLeagueFixtures(teams: Team[], config: TournamentConfig): Promise<FixtureGenerationResult> {
    const pairings = this.generateRoundRobinPairings(teams);
    const fixtures = this.schedulePairings(pairings, config);

    const estimatedEndDate = new Date(config.startDate);
    estimatedEndDate.setDate(
      estimatedEndDate.getDate() + (fixtures.length * config.matchFrequency)
    );

    return {
      totalMatches: fixtures.length,
      regularSeasonMatches: fixtures.length,
      playoffMatches: 0,
      estimatedEndDate,
      fixtures: {
        regularSeason: fixtures
      }
    };
  }

  /**
   * Generate knockout tournament fixtures (single elimination)
   */
  private async generateKnockoutFixtures(teams: Team[], config: TournamentConfig): Promise<FixtureGenerationResult> {
    const brackets = this.generateKnockoutBracket(teams);
    const fixtures = this.scheduleKnockoutMatches(brackets, config);

    const totalRounds = Math.ceil(Math.log2(teams.length));
    const estimatedEndDate = new Date(config.startDate);
    estimatedEndDate.setDate(
      estimatedEndDate.getDate() + (totalRounds * config.matchFrequency)
    );

    return {
      totalMatches: fixtures.length,
      regularSeasonMatches: 0,
      playoffMatches: fixtures.length,
      estimatedEndDate,
      fixtures: {
        regularSeason: [],
        playoffs: fixtures
      }
    };
  }

  /**
   * Generate league + playoff fixtures (regular season + knockout playoffs)
   */
  private async generateLeagueWithPlayoffFixtures(teams: Team[], config: TournamentConfig): Promise<FixtureGenerationResult> {
    // Generate regular season (round-robin)
    const regularSeasonFixtures = await this.generateLeagueFixtures(teams, config);

    // Generate playoff bracket for top teams
    const playoffTeamsCount = config.playoffTeamsCount || Math.min(4, Math.floor(teams.length / 2));
    const playoffTeams = teams.slice(0, playoffTeamsCount); // In reality, would be based on standings

    const playoffConfig = {
      ...config,
      startDate: regularSeasonFixtures.estimatedEndDate
    };
    
    const playoffFixtures = await this.generateKnockoutFixtures(playoffTeams, playoffConfig);

    const totalMatches = regularSeasonFixtures.totalMatches + playoffFixtures.totalMatches;

    return {
      totalMatches,
      regularSeasonMatches: regularSeasonFixtures.totalMatches,
      playoffMatches: playoffFixtures.totalMatches,
      estimatedEndDate: playoffFixtures.estimatedEndDate,
      fixtures: {
        regularSeason: regularSeasonFixtures.fixtures.regularSeason,
        playoffs: playoffFixtures.fixtures.playoffs
      }
    };
  }

  /**
   * Generate round-robin pairings (each team plays every other team once)
   */
  private generateRoundRobinPairings(teams: Team[]): RoundRobinPairing[] {
    const pairings: RoundRobinPairing[] = [];
    let round = 1;

    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        pairings.push({
          homeTeam: teams[i],
          awayTeam: teams[j],
          round
        });
        
        // Increment round every few matches to spread them across matchdays
        if (pairings.length % Math.floor(teams.length / 2) === 0) {
          round++;
        }
      }
    }

    return pairings;
  }

  /**
   * Generate knockout bracket with proper seeding
   */
  private generateKnockoutBracket(teams: Team[]): KnockoutBracket[] {
    const brackets: KnockoutBracket[] = [];
    let currentTeams = [...teams];
    let round = 1;

    // Handle bye rounds for non-power-of-2 team counts
    const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(teams.length)));
    const byeTeams = nextPowerOf2 - teams.length;

    // Add placeholder entries for byes
    const placeholderTeams = Array(byeTeams).fill(null);
    currentTeams.push(...placeholderTeams);

    while (currentTeams.length > 1) {
      const matches = [];
      const roundName = this.getRoundName(currentTeams.length);

      for (let i = 0; i < currentTeams.length; i += 2) {
        const homeTeam = currentTeams[i];
        const awayTeam = currentTeams[i + 1];
        
        // Skip matches where one team has a bye
        if (homeTeam && awayTeam) {
          matches.push({
            homeTeam,
            awayTeam,
            position: i / 2
          });
        }
      }

      brackets.push({
        round,
        roundName,
        matches
      });

      // Advance to next round (simulate winners)
      currentTeams = matches.map(match => match.homeTeam); // Simplified - just take home team
      round++;
    }

    return brackets;
  }

  /**
   * Schedule pairings with intelligent date distribution
   */
  private schedulePairings(pairings: RoundRobinPairing[], config: TournamentConfig): Match[] {
    const fixtures: Match[] = [];
    let currentDate = new Date(config.startDate);
    let matchDay = 1;

    // Group pairings by round to avoid team conflicts
    const rounds = this.groupPairingsByRound(pairings);

    for (const roundPairings of rounds) {
      for (const pairing of roundPairings) {
        fixtures.push(this.createMatchFromPairing(pairing, currentDate, matchDay, config));
        
        // Advance to next match date
        currentDate = new Date(currentDate);
        currentDate.setDate(currentDate.getDate() + config.matchFrequency);
      }
      matchDay++;
    }

    return fixtures;
  }

  /**
   * Schedule knockout matches with proper round progression
   */
  private scheduleKnockoutMatches(brackets: KnockoutBracket[], config: TournamentConfig): Match[] {
    const fixtures: Match[] = [];
    let currentDate = new Date(config.startDate);

    for (const bracket of brackets) {
      for (const match of bracket.matches) {
        fixtures.push(this.createKnockoutMatch(match, bracket, currentDate, config));
        
        // Same round matches can be on same day or close dates
        currentDate = new Date(currentDate);
        currentDate.setDate(currentDate.getDate() + 1); // Next day for same round
      }
      
      // Move to next round date
      currentDate = new Date(currentDate);
      currentDate.setDate(currentDate.getDate() + config.matchFrequency - 1);
    }

    return fixtures;
  }

  /**
   * Utility methods
   */
  private async validateLeagueAndGetTeams(leagueId: string): Promise<ServiceResponse<{ league: League; teams: Team[] }>> {
    try {
      // Get league details
      const { data: league, error: leagueError } = await this.supabase
        .from('leagues')
        .select('*')
        .eq('id', leagueId)
        .single();

      if (leagueError) {
        if (leagueError.code === 'PGRST116') {
          return {
            data: null,
            error: { code: 'LEAGUE_NOT_FOUND', message: 'League not found', timestamp: new Date().toISOString() },
            success: false
          };
        }
        throw leagueError;
      }

      // Get teams in league
      const { data: teams, error: teamsError } = await this.supabase
        .from('team_leagues')
        .select(`
          teams!inner(*)
        `)
        .eq('league_id', leagueId)
        .eq('is_active', true);

      if (teamsError) throw teamsError;

      const teamList = (teams || []).map(tl => tl.teams as Team);

      return { data: { league, teams: teamList }, error: null, success: true };

    } catch (error) {
      return {
        data: null,
        error: this.handleError(error, 'validateLeagueAndGetTeams'),
        success: false
      };
    }
  }

  private validateMinimumTeams(teams: Team[], format: TournamentFormat): { success: boolean; error?: ServiceError } {
    const teamCount = teams.length;
    
    let minTeams = 2;
    switch (format) {
      case TournamentFormat.LEAGUE:
        minTeams = 3; // Need at least 3 teams for a meaningful league
        break;
      case TournamentFormat.KNOCKOUT:
        minTeams = 2; // Need at least 2 teams for knockout
        break;
      case TournamentFormat.LEAGUE_WITH_PLAYOFFS:
        minTeams = 4; // Need at least 4 teams for league + playoffs
        break;
    }

    if (teamCount < minTeams) {
      return {
        success: false,
        error: {
          code: 'INSUFFICIENT_TEAMS',
          message: `${format} format requires at least ${minTeams} teams. Found ${teamCount} teams.`,
          timestamp: new Date().toISOString()
        }
      };
    }

    return { success: true };
  }

  private groupPairingsByRound(pairings: RoundRobinPairing[]): RoundRobinPairing[][] {
    const rounds: { [round: number]: RoundRobinPairing[] } = {};
    
    pairings.forEach(pairing => {
      if (!rounds[pairing.round]) {
        rounds[pairing.round] = [];
      }
      rounds[pairing.round].push(pairing);
    });

    return Object.values(rounds);
  }

  private createMatchFromPairing(pairing: RoundRobinPairing, date: Date, matchDay: number, config: TournamentConfig): Match {
    return {
      id: '', // Will be generated by database
      league_id: config.leagueId,
      home_team_id: pairing.homeTeam.id,
      away_team_id: pairing.awayTeam.id,
      scheduled_date: date.toISOString(),
      venue: config.venue || null,
      match_day: matchDay,
      status: MatchStatus.SCHEDULED,
      home_score: null,
      away_score: null,
      match_type: MatchType.REGULAR_SEASON,
      round_number: pairing.round,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  private createKnockoutMatch(
    match: { homeTeam: Team | null; awayTeam: Team | null; position: number }, 
    bracket: KnockoutBracket, 
    date: Date, 
    config: TournamentConfig
  ): Match {
    const matchType = this.getMatchTypeFromRound(bracket.roundName);
    
    return {
      id: '', // Will be generated by database
      league_id: config.leagueId,
      home_team_id: match.homeTeam?.id || '',
      away_team_id: match.awayTeam?.id || '',
      scheduled_date: date.toISOString(),
      venue: config.venue || null,
      match_day: null,
      status: MatchStatus.SCHEDULED,
      home_score: null,
      away_score: null,
      match_type: matchType,
      round_number: bracket.round,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  private getRoundName(teamsRemaining: number): string {
    switch (teamsRemaining) {
      case 2: return 'Final';
      case 4: return 'Semifinals';
      case 8: return 'Quarterfinals';
      case 16: return 'Round of 16';
      case 32: return 'Round of 32';
      default: return `Round of ${teamsRemaining}`;
    }
  }

  private getMatchTypeFromRound(roundName: string): MatchType {
    switch (roundName.toLowerCase()) {
      case 'final': return MatchType.FINAL;
      case 'semifinals': return MatchType.SEMIFINAL;
      case 'quarterfinals': return MatchType.QUARTERFINAL;
      default: return MatchType.PLAYOFF;
    }
  }

  private async saveFixturesToDatabase(fixtures: FixtureGenerationResult, config: TournamentConfig): Promise<ServiceResponse<void>> {
    try {
      const allMatches = [
        ...fixtures.fixtures.regularSeason,
        ...(fixtures.fixtures.playoffs || [])
      ];

      const matchInserts: InsertMatch[] = allMatches.map(match => ({
        league_id: match.league_id,
        home_team_id: match.home_team_id,
        away_team_id: match.away_team_id,
        scheduled_date: match.scheduled_date,
        venue: match.venue,
        match_day: match.match_day,
        status: match.status,
        match_type: match.match_type,
        round_number: match.round_number
      }));

      const { error } = await this.supabase
        .from('matches')
        .insert(matchInserts);

      if (error) throw error;

      return { data: undefined, error: null, success: true };

    } catch (error) {
      return {
        data: undefined,
        error: this.handleError(error, 'saveFixturesToDatabase'),
        success: false
      };
    }
  }

  private async markFixturesGenerated(leagueId: string): Promise<void> {
    await this.supabase
      .from('leagues')
      .update({
        fixtures_generated: true,
        fixtures_generated_at: new Date().toISOString()
      })
      .eq('id', leagueId);
  }

  /**
   * Preview fixtures without saving to database
   */
  async previewTournamentFixtures(config: TournamentConfig): Promise<ServiceResponse<FixtureGenerationResult>> {
    try {
      const leagueValidation = await this.validateLeagueAndGetTeams(config.leagueId);
      if (!leagueValidation.success || !leagueValidation.data) {
        return leagueValidation as ServiceResponse<FixtureGenerationResult>;
      }

      const { teams } = leagueValidation.data;
      
      const minTeamsValidation = this.validateMinimumTeams(teams, config.format);
      if (!minTeamsValidation.success && minTeamsValidation.error) {
        return {
          data: null,
          error: minTeamsValidation.error,
          success: false
        };
      }

      let fixtures: FixtureGenerationResult;

      switch (config.format) {
        case TournamentFormat.LEAGUE:
          fixtures = await this.generateLeagueFixtures(teams, config);
          break;
        case TournamentFormat.KNOCKOUT:
          fixtures = await this.generateKnockoutFixtures(teams, config);
          break;
        case TournamentFormat.LEAGUE_WITH_PLAYOFFS:
          fixtures = await this.generateLeagueWithPlayoffFixtures(teams, config);
          break;
        default:
          throw new Error(`Unsupported tournament format: ${config.format}`);
      }

      return { data: fixtures, error: null, success: true };

    } catch (error) {
      return {
        data: null,
        error: this.handleError(error, 'previewTournamentFixtures'),
        success: false
      };
    }
  }

  /**
   * Delete all fixtures for a league (to regenerate)
   */
  async deleteLeagueFixtures(leagueId: string): Promise<ServiceResponse<void>> {
    try {
      // Delete all matches for the league
      const { error } = await this.supabase
        .from('matches')
        .delete()
        .eq('league_id', leagueId);

      if (error) throw error;

      // Reset fixtures generated flag
      await this.supabase
        .from('leagues')
        .update({
          fixtures_generated: false,
          fixtures_generated_at: null
        })
        .eq('id', leagueId);

      return { data: undefined, error: null, success: true };

    } catch (error) {
      return {
        data: undefined,
        error: this.handleError(error, 'deleteLeagueFixtures'),
        success: false
      };
    }
  }
}
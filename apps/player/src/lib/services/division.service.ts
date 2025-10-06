/**
 * Division Service for MatchDay
 * 
 * Handles division-specific operations:
 * - Division discovery and filtering 
 * - Team assignment and management within divisions
 * - Fixture generation and match scheduling
 * - Standings calculation and management
 * - Division-level statistics
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  Database,
  ServiceResponse,
  ServiceError,
  PaginatedServiceResponse,
} from '@matchday/database';

export interface DivisionFilters {
  leagueId?: string;
  skillLevel?: 'beginner' | 'intermediate' | 'advanced' | 'professional' | 'youth' | 'veterans';
  isActive?: boolean;
  registrationOpen?: boolean;
  hasAvailableSpots?: boolean;
}

export interface DivisionDetails {
  id: string;
  name: string;
  description?: string;
  league_id: string;
  skill_level: string;
  min_teams: number;
  max_teams: number;
  current_teams: number;
  max_players_per_team: number;
  min_players_per_team: number;
  is_active: boolean;
  registration_open: boolean;
  registration_deadline?: string;
  season_start?: string;
  season_end?: string;
  match_duration_minutes: number;
  created_at: string;
  updated_at: string;
  
  // Related data
  league?: {
    id: string;
    name: string;
    sport_type: string;
    league_type: string;
    location?: string;
  };
  teams?: TeamInDivision[];
  standings?: DivisionStanding[];
  fixtures?: DivisionFixture[];
  
  // Calculated fields
  teamCount: number;
  playerCount: number;
  availableSpots: number;
  spotsRemaining: number;
  isOpenForTeams: boolean;
  capacityPercentage: number;
  matchesPlayed?: number;
  matchesScheduled?: number;
}

export interface TeamInDivision {
  id: string;
  name: string;
  captain_id?: string;
  max_players: number;
  min_players: number;
  is_recruiting: boolean;
  is_active: boolean;
  currentPlayers: number;
  availableSpots: number;
  members?: TeamMember[];
  standings?: DivisionStanding;
}

export interface TeamMember {
  id: string;
  user_id: string;
  position?: string;
  jersey_number?: number;
  joined_at: string;
  player_name?: string;
  player_email?: string;
}

export interface DivisionStanding {
  position: number;
  points: number;
  matches_played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  last_updated: string;
  team?: {
    id: string;
    name: string;
  };
}

export interface DivisionFixture {
  id: string;
  round_number: number;
  home_team: {
    id: string;
    name: string;
  };
  away_team: {
    id: string;
    name: string;
  };
  match_date?: string;
  venue?: string;
  is_scheduled: boolean;
  created_at: string;
}

export class DivisionService {
  private static instance: DivisionService;
  private supabase: SupabaseClient<Database>;
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  private constructor(supabaseClient: SupabaseClient<Database>) {
    this.supabase = supabaseClient;
  }

  static getInstance(supabaseClient?: SupabaseClient<Database>): DivisionService {
    if (!DivisionService.instance) {
      if (!supabaseClient) {
        throw new Error('SupabaseClient required for first initialization');
      }
      DivisionService.instance = new DivisionService(supabaseClient);
    }
    return DivisionService.instance;
  }

  /**
   * Handle service errors consistently
   */
  private handleError(error: any, operation: string): ServiceError {
    console.error(`DivisionService.${operation}:`, error);
    return {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'An unexpected error occurred',
      details: error.details || error,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Cache management utilities
   */
  private getCacheKey(operation: string, params: any): string {
    return `division_service:${operation}:${JSON.stringify(params)}`;
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > cached.ttl * 1000) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data as T;
  }

  private setCache<T>(key: string, data: T, ttl = 600): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Discover available divisions with filtering
   */
  async discoverDivisions(
    filters: DivisionFilters = {},
    options: {
      includeTeams?: boolean;
      includeStandings?: boolean;
      includeStats?: boolean;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<PaginatedServiceResponse<DivisionDetails>> {
    try {
      const cacheKey = this.getCacheKey('discoverDivisions', { filters, options });
      const cached = this.getFromCache<DivisionDetails[]>(cacheKey);
      
      if (cached && !options.includeTeams) {
        return { 
          data: cached, 
          error: null, 
          success: true,
          pagination: {
            page: Math.floor((options.offset || 0) / (options.limit || 20)) + 1,
            limit: options.limit || 20,
            total: cached.length,
            totalPages: Math.ceil(cached.length / (options.limit || 20)),
            hasNext: false,
            hasPrevious: false
          }
        };
      }

      // Build query with filters
      let query = this.supabase
        .from('divisions')
        .select(`
          *,
          league:leagues!inner (
            id,
            name,
            sport_type,
            league_type,
            location,
            is_active
          )
          ${options.includeTeams ? `,
          teams (
            id,
            name,
            captain_id,
            max_players,
            min_players,
            is_recruiting,
            is_active,
            team_members!inner (
              id,
              is_active
            )
          )` : ''}
          ${options.includeStandings ? `,
          division_standings (
            position,
            points,
            matches_played,
            wins,
            draws,
            losses,
            goals_for,
            goals_against,
            goal_difference,
            last_updated,
            team:teams!division_standings_team_id_fkey (
              id,
              name
            )
          )` : ''}
        `, { count: 'exact' });

      // Apply filters
      if (filters.leagueId) {
        query = query.eq('league_id', filters.leagueId);
      }

      if (filters.skillLevel) {
        query = query.eq('skill_level', filters.skillLevel);
      }

      if (filters.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }

      if (filters.registrationOpen !== undefined) {
        query = query.eq('registration_open', filters.registrationOpen);
      }

      // Only show divisions from active leagues
      query = query.eq('league.is_active', true);

      const { data: divisions, error, count } = await query
        .order('created_at', { ascending: false })
        .range(options.offset || 0, (options.offset || 0) + (options.limit || 20) - 1);

      if (error) throw error;

      // Process divisions
      const processedDivisions: DivisionDetails[] = await Promise.all(
        (divisions || []).map(async (division) => {
          let teamCount = division.current_teams || 0;
          let playerCount = 0;
          let availableSpots = 0;
          let processedTeams: TeamInDivision[] = [];
          let processedStandings: DivisionStanding[] = [];

          // Process teams if included
          if (options.includeTeams && division.teams) {
            processedTeams = division.teams.map((team: any) => {
              const activeMembers = team.team_members?.filter((member: any) => member.is_active) || [];
              const maxPlayers = team.max_players || 22;
              
              return {
                id: team.id,
                name: team.name,
                captain_id: team.captain_id,
                max_players: team.max_players,
                min_players: team.min_players,
                is_recruiting: team.is_recruiting,
                is_active: team.is_active,
                currentPlayers: activeMembers.length,
                availableSpots: Math.max(0, maxPlayers - activeMembers.length)
              };
            });

            teamCount = processedTeams.length;
            playerCount = processedTeams.reduce((total, team) => total + team.currentPlayers, 0);
            availableSpots = processedTeams.reduce((total, team) => total + team.availableSpots, 0);
          }

          // Process standings if included
          if (options.includeStandings && division.division_standings) {
            processedStandings = division.division_standings
              .sort((a: any, b: any) => a.position - b.position)
              .map((standing: any) => ({
                position: standing.position,
                points: standing.points,
                matches_played: standing.matches_played,
                wins: standing.wins,
                draws: standing.draws,
                losses: standing.losses,
                goals_for: standing.goals_for,
                goals_against: standing.goals_against,
                goal_difference: standing.goal_difference,
                last_updated: standing.last_updated,
                team: standing.team
              }));
          }

          // Get match statistics if requested
          let matchesPlayed = 0;
          let matchesScheduled = 0;
          if (options.includeStats) {
            const { data: matches } = await this.supabase
              .from('matches')
              .select('id, status')
              .eq('division_id', division.id);

            const matchStats = matches || [];
            matchesPlayed = matchStats.filter(m => m.status === 'completed').length;
            matchesScheduled = matchStats.filter(m => m.status === 'scheduled').length;
          }

          return {
            ...division,
            teams: options.includeTeams ? processedTeams : undefined,
            standings: options.includeStandings ? processedStandings : undefined,
            teamCount,
            playerCount: options.includeTeams || options.includeStats ? playerCount : 0,
            availableSpots: options.includeTeams || options.includeStats ? availableSpots : 0,
            spotsRemaining: Math.max(0, division.max_teams - teamCount),
            isOpenForTeams: teamCount < division.max_teams && division.registration_open,
            capacityPercentage: Math.round((teamCount / division.max_teams) * 100),
            matchesPlayed: options.includeStats ? matchesPlayed : undefined,
            matchesScheduled: options.includeStats ? matchesScheduled : undefined
          };
        })
      );

      // Filter by available spots if requested
      let filteredDivisions = processedDivisions;
      if (filters.hasAvailableSpots) {
        filteredDivisions = processedDivisions.filter(div => div.spotsRemaining > 0);
      }

      // Cache results if not user-specific
      if (!options.includeTeams) {
        this.setCache(cacheKey, filteredDivisions, 600);
      }

      const pagination = {
        page: Math.floor((options.offset || 0) / (options.limit || 20)) + 1,
        limit: options.limit || 20,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / (options.limit || 20)),
        hasNext: ((options.offset || 0) + (options.limit || 20)) < (count || 0),
        hasPrevious: (options.offset || 0) > 0
      };

      return {
        data: filteredDivisions,
        error: null,
        success: true,
        pagination
      };

    } catch (error) {
      return {
        data: null,
        error: this.handleError(error, 'discoverDivisions'),
        success: false,
        pagination: {
          page: 1,
          limit: options.limit || 20,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrevious: false
        }
      };
    }
  }

  /**
   * Get detailed division information
   */
  async getDivisionDetails(
    divisionId: string,
    options: {
      includeTeams?: boolean;
      includeStandings?: boolean;
      includeFixtures?: boolean;
      includeMatches?: boolean;
    } = {}
  ): Promise<ServiceResponse<DivisionDetails>> {
    try {
      const cacheKey = this.getCacheKey('getDivisionDetails', { divisionId, options });
      const cached = this.getFromCache<DivisionDetails>(cacheKey);
      
      if (cached && !options.includeTeams) {
        return { data: cached, error: null, success: true };
      }

      // Build comprehensive query
      let query = this.supabase
        .from('divisions')
        .select(`
          *,
          league:leagues!inner (
            id,
            name,
            sport_type,
            league_type,
            location,
            season_start,
            season_end,
            is_active
          )
          ${options.includeTeams ? `,
          teams (
            id,
            name,
            captain_id,
            max_players,
            min_players,
            is_recruiting,
            is_active,
            team_bio,
            location,
            founded_year,
            team_members (
              id,
              user_id,
              position,
              jersey_number,
              joined_at,
              is_active,
              users (
                id,
                display_name,
                email
              )
            )
          )` : ''}
          ${options.includeStandings ? `,
          division_standings (
            position,
            points,
            matches_played,
            wins,
            draws,
            losses,
            goals_for,
            goals_against,
            goal_difference,
            last_updated,
            team:teams!division_standings_team_id_fkey (
              id,
              name
            )
          )` : ''}
        `)
        .eq('id', divisionId)
        .single();

      const { data: division, error } = await query;

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            data: null,
            error: { code: 'DIVISION_NOT_FOUND', message: 'Division not found', timestamp: new Date().toISOString() },
            success: false
          };
        }
        throw error;
      }

      // Get additional data if requested
      let fixtures: DivisionFixture[] = [];
      if (options.includeFixtures) {
        const { data: fixturesData } = await this.supabase
          .from('division_fixtures')
          .select(`
            id,
            round_number,
            match_date,
            venue,
            is_scheduled,
            created_at,
            home_team:teams!division_fixtures_home_team_id_fkey (
              id,
              name
            ),
            away_team:teams!division_fixtures_away_team_id_fkey (
              id,
              name
            )
          `)
          .eq('division_id', divisionId)
          .order('round_number')
          .order('created_at');

        fixtures = (fixturesData || []).map((fixture: any) => ({
          id: fixture.id,
          round_number: fixture.round_number,
          home_team: fixture.home_team,
          away_team: fixture.away_team,
          match_date: fixture.match_date,
          venue: fixture.venue,
          is_scheduled: fixture.is_scheduled,
          created_at: fixture.created_at
        }));
      }

      // Process the division data
      const processedDivision = await this.processDivisionData(division, {
        includeTeams: options.includeTeams,
        includeStandings: options.includeStandings,
        includeStats: true
      });

      if (options.includeFixtures) {
        processedDivision.fixtures = fixtures;
      }

      // Cache if not user-specific
      if (!options.includeTeams) {
        this.setCache(cacheKey, processedDivision, 300);
      }

      return { data: processedDivision, error: null, success: true };

    } catch (error) {
      return {
        data: null,
        error: this.handleError(error, 'getDivisionDetails'),
        success: false
      };
    }
  }

  /**
   * Recalculate division standings from matches
   */
  async recalculateStandings(divisionId: string): Promise<ServiceResponse<DivisionStanding[]>> {
    try {
      // Get all teams in the division
      const { data: teams, error: teamsError } = await this.supabase
        .from('teams')
        .select('id, name')
        .eq('division_id', divisionId)
        .eq('is_active', true);

      if (teamsError) throw teamsError;

      if (!teams || teams.length === 0) {
        return {
          data: [],
          error: { code: 'NO_TEAMS_FOUND', message: 'No active teams found in division', timestamp: new Date().toISOString() },
          success: false
        };
      }

      // Get completed matches
      const { data: matches, error: matchesError } = await this.supabase
        .from('matches')
        .select('id, home_team_id, away_team_id, home_score, away_score')
        .eq('division_id', divisionId)
        .eq('status', 'completed')
        .not('home_score', 'is', null)
        .not('away_score', 'is', null);

      if (matchesError) throw matchesError;

      // Calculate standings
      const standingsData = this.calculateStandings(teams, matches || []);

      // Clear existing standings
      await this.supabase
        .from('division_standings')
        .delete()
        .eq('division_id', divisionId);

      // Insert new standings
      const standingsToInsert = standingsData.map(team => ({
        division_id: divisionId,
        team_id: team.team_id,
        position: team.position,
        points: team.points,
        matches_played: team.matches_played,
        wins: team.wins,
        draws: team.draws,
        losses: team.losses,
        goals_for: team.goals_for,
        goals_against: team.goals_against,
        last_updated: new Date().toISOString()
      }));

      const { data: newStandings, error: insertError } = await this.supabase
        .from('division_standings')
        .insert(standingsToInsert)
        .select(`
          *,
          team:teams!division_standings_team_id_fkey (
            id,
            name
          )
        `);

      if (insertError) throw insertError;

      return { data: newStandings || [], error: null, success: true };

    } catch (error) {
      return {
        data: null,
        error: this.handleError(error, 'recalculateStandings'),
        success: false
      };
    }
  }

  /**
   * Private helper methods
   */
  private async processDivisionData(
    division: any,
    options: { includeTeams?: boolean; includeStandings?: boolean; includeStats?: boolean }
  ): Promise<DivisionDetails> {
    let teamCount = division.current_teams || 0;
    let playerCount = 0;
    let availableSpots = 0;
    let processedTeams: TeamInDivision[] = [];
    let processedStandings: DivisionStanding[] = [];

    // Process teams
    if (options.includeTeams && division.teams) {
      processedTeams = division.teams.map((team: any) => {
        const activeMembers = team.team_members?.filter((member: any) => member.is_active) || [];
        const maxPlayers = team.max_players || 22;
        
        return {
          id: team.id,
          name: team.name,
          captain_id: team.captain_id,
          max_players: team.max_players,
          min_players: team.min_players,
          is_recruiting: team.is_recruiting,
          is_active: team.is_active,
          currentPlayers: activeMembers.length,
          availableSpots: Math.max(0, maxPlayers - activeMembers.length),
          members: activeMembers.map((member: any) => ({
            id: member.id,
            user_id: member.user_id,
            position: member.position,
            jersey_number: member.jersey_number,
            joined_at: member.joined_at,
            player_name: member.users?.display_name,
            player_email: member.users?.email
          }))
        };
      });

      teamCount = processedTeams.length;
      playerCount = processedTeams.reduce((total, team) => total + team.currentPlayers, 0);
      availableSpots = processedTeams.reduce((total, team) => total + team.availableSpots, 0);
    }

    // Process standings
    if (options.includeStandings && division.division_standings) {
      processedStandings = division.division_standings
        .sort((a: any, b: any) => a.position - b.position)
        .map((standing: any) => ({
          position: standing.position,
          points: standing.points,
          matches_played: standing.matches_played,
          wins: standing.wins,
          draws: standing.draws,
          losses: standing.losses,
          goals_for: standing.goals_for,
          goals_against: standing.goals_against,
          goal_difference: standing.goal_difference,
          last_updated: standing.last_updated,
          team: standing.team
        }));
    }

    // Get match statistics if needed
    let matchesPlayed = 0;
    let matchesScheduled = 0;
    if (options.includeStats) {
      const { data: matches } = await this.supabase
        .from('matches')
        .select('id, status')
        .eq('division_id', division.id);

      const matchStats = matches || [];
      matchesPlayed = matchStats.filter(m => m.status === 'completed').length;
      matchesScheduled = matchStats.filter(m => m.status === 'scheduled').length;
    }

    return {
      ...division,
      teams: options.includeTeams ? processedTeams : undefined,
      standings: options.includeStandings ? processedStandings : undefined,
      teamCount,
      playerCount,
      availableSpots,
      spotsRemaining: Math.max(0, division.max_teams - teamCount),
      isOpenForTeams: teamCount < division.max_teams && division.registration_open,
      capacityPercentage: Math.round((teamCount / division.max_teams) * 100),
      matchesPlayed: options.includeStats ? matchesPlayed : undefined,
      matchesScheduled: options.includeStats ? matchesScheduled : undefined
    };
  }

  private calculateStandings(teams: any[], matches: any[]): any[] {
    const standingsData: Record<string, any> = {};
    
    // Initialize all teams
    teams.forEach(team => {
      standingsData[team.id] = {
        team_id: team.id,
        points: 0,
        matches_played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goals_for: 0,
        goals_against: 0
      };
    });

    // Process matches
    matches.forEach(match => {
      const homeId = match.home_team_id;
      const awayId = match.away_team_id;
      const homeScore = match.home_score;
      const awayScore = match.away_score;

      if (!standingsData[homeId] || !standingsData[awayId]) return;

      standingsData[homeId].matches_played++;
      standingsData[awayId].matches_played++;
      standingsData[homeId].goals_for += homeScore;
      standingsData[homeId].goals_against += awayScore;
      standingsData[awayId].goals_for += awayScore;
      standingsData[awayId].goals_against += homeScore;

      if (homeScore > awayScore) {
        standingsData[homeId].wins++;
        standingsData[homeId].points += 3;
        standingsData[awayId].losses++;
      } else if (homeScore < awayScore) {
        standingsData[awayId].wins++;
        standingsData[awayId].points += 3;
        standingsData[homeId].losses++;
      } else {
        standingsData[homeId].draws++;
        standingsData[homeId].points += 1;
        standingsData[awayId].draws++;
        standingsData[awayId].points += 1;
      }
    });

    // Sort and assign positions
    const sortedStandings = Object.values(standingsData).sort((a: any, b: any) => {
      const aGoalDiff = a.goals_for - a.goals_against;
      const bGoalDiff = b.goals_for - b.goals_against;
      
      if (b.points !== a.points) return b.points - a.points;
      if (bGoalDiff !== aGoalDiff) return bGoalDiff - aGoalDiff;
      return b.goals_for - a.goals_for;
    });

    sortedStandings.forEach((team: any, index) => {
      team.position = index + 1;
    });

    return sortedStandings;
  }

  /**
   * Clear cache
   */
  clearCache(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    const keys = Array.from(this.cache.keys());
    keys.forEach(key => {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    });
  }
}
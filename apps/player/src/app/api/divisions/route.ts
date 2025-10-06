/**
 * Divisions API Routes
 * 
 * Handles division-related API operations:
 * - GET /api/divisions - Get available divisions with filtering
 * - POST /api/divisions - Create new division (league admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server-client';

export interface DivisionResponse {
  id: string;
  name: string;
  description?: string;
  league_id: string;
  skill_level: 'beginner' | 'intermediate' | 'advanced' | 'professional' | 'youth' | 'veterans';
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
  // Calculated fields
  teams?: any[];
  teamCount?: number;
  playerCount?: number;
  availableSpots?: number;
  matchesPlayed?: number;
  matchesScheduled?: number;
  league?: {
    id: string;
    name: string;
    sport_type: string;
    league_type: string;
    location?: string;
  };
}

/**
 * GET /api/divisions
 * Get available divisions with comprehensive filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const leagueId = searchParams.get('leagueId');
    const skillLevel = searchParams.get('skillLevel');
    const isActive = searchParams.get('isActive');
    const registrationOpen = searchParams.get('registrationOpen');
    const includeStats = searchParams.get('includeStats') === 'true';
    const includeTeams = searchParams.get('includeTeams') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = createAdminSupabaseClient();

    // Build base query with league information
    let query = supabase
      .from('divisions')
      .select(`
        *,
        league:leagues!inner (
          id,
          name,
          sport_type,
          league_type,
          location,
          is_active,
          season_start,
          season_end
        )
        ${includeTeams ? `,
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
      `, { count: 'exact' });

    // Apply filters
    if (leagueId) {
      query = query.eq('league_id', leagueId);
    }

    if (skillLevel) {
      query = query.eq('skill_level', skillLevel);
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    if (registrationOpen !== null) {
      query = query.eq('registration_open', registrationOpen === 'true');
    }

    // Only show divisions from active leagues
    query = query.eq('league.is_active', true);

    const { data: divisions, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      );
    }

    // Process divisions to include statistics if requested
    const processedDivisions: DivisionResponse[] = await Promise.all(
      (divisions || []).map(async (division) => {
        let teamCount = division.current_teams || 0;
        let playerCount = 0;
        let availableSpots = 0;
        let matchesPlayed = 0;
        let matchesScheduled = 0;
        let processedTeams = [];

        if (includeStats || includeTeams) {
          // Get team statistics for this division
          const { data: teams } = await supabase
            .from('teams')
            .select(`
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
            `)
            .eq('division_id', division.id)
            .eq('is_active', true);

          processedTeams = (teams || []).map(team => {
            const activeMembers = team.team_members?.filter(member => member.is_active) || [];
            const maxPlayers = team.max_players || 22;
            
            return {
              id: team.id,
              name: team.name,
              captain_id: team.captain_id,
              max_players: team.max_players,
              min_players: team.min_players,
              is_recruiting: team.is_recruiting,
              currentPlayers: activeMembers.length,
              availableSpots: Math.max(0, maxPlayers - activeMembers.length)
            };
          });

          teamCount = processedTeams.length;
          playerCount = processedTeams.reduce((total, team) => total + team.currentPlayers, 0);
          availableSpots = processedTeams.reduce((total, team) => total + team.availableSpots, 0);

          // Get match statistics
          if (includeStats) {
            const { data: matches } = await supabase
              .from('matches')
              .select('id, status')
              .eq('division_id', division.id);

            const matchStats = matches || [];
            matchesPlayed = matchStats.filter(m => m.status === 'completed').length;
            matchesScheduled = matchStats.filter(m => m.status === 'scheduled').length;
          }
        }

        return {
          ...division,
          teams: includeTeams ? processedTeams : undefined,
          teamCount,
          playerCount: includeStats ? playerCount : undefined,
          availableSpots: includeStats ? availableSpots : undefined,
          matchesPlayed: includeStats ? matchesPlayed : undefined,
          matchesScheduled: includeStats ? matchesScheduled : undefined,
          // Division capacity stats
          spotsRemaining: Math.max(0, division.max_teams - teamCount),
          isOpenForTeams: teamCount < division.max_teams && division.registration_open,
          capacityPercentage: Math.round((teamCount / division.max_teams) * 100)
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: processedDivisions,
      count: processedDivisions.length,
      total: count || 0,
      message: 'Divisions retrieved successfully',
      pagination: {
        limit,
        offset,
        total: count || 0,
        hasMore: (offset + limit) < (count || 0)
      }
    });

  } catch (error) {
    console.error('Error in GET /api/divisions:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/divisions
 * Create a new division (league admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      league_id,
      skill_level = 'intermediate',
      min_teams = 4,
      max_teams = 16,
      max_players_per_team = 22,
      min_players_per_team = 11,
      is_active = true,
      registration_open = true,
      registration_deadline,
      season_start,
      season_end,
      match_duration_minutes = 90
    } = body;

    // Validate required fields
    if (!name || !league_id) {
      return NextResponse.json(
        { success: false, error: 'Validation error', message: 'Name and league_id are required' },
        { status: 400 }
      );
    }

    // Validate skill level
    const validSkillLevels = ['beginner', 'intermediate', 'advanced', 'professional', 'youth', 'veterans'];
    if (!validSkillLevels.includes(skill_level)) {
      return NextResponse.json(
        { success: false, error: 'Validation error', message: 'Invalid skill level' },
        { status: 400 }
      );
    }

    // Validate team limits
    if (min_teams > max_teams) {
      return NextResponse.json(
        { success: false, error: 'Validation error', message: 'min_teams cannot be greater than max_teams' },
        { status: 400 }
      );
    }

    if (min_players_per_team > max_players_per_team) {
      return NextResponse.json(
        { success: false, error: 'Validation error', message: 'min_players_per_team cannot be greater than max_players_per_team' },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();

    // Verify league exists and user has permission
    const { data: league, error: leagueError } = await supabase
      .from('leagues')
      .select('id, name, created_by')
      .eq('id', league_id)
      .single();

    if (leagueError || !league) {
      return NextResponse.json(
        { success: false, error: 'League not found' },
        { status: 404 }
      );
    }

    // Check for duplicate division name in the same league
    const { data: existingDivision } = await supabase
      .from('divisions')
      .select('id')
      .eq('name', name)
      .eq('league_id', league_id)
      .single();

    if (existingDivision) {
      return NextResponse.json(
        { success: false, error: 'Division name already exists in this league' },
        { status: 409 }
      );
    }

    // Create the division
    const { data: division, error } = await supabase
      .from('divisions')
      .insert({
        name,
        description,
        league_id,
        skill_level,
        min_teams,
        max_teams,
        max_players_per_team,
        min_players_per_team,
        is_active,
        registration_open,
        registration_deadline,
        season_start,
        season_end,
        match_duration_minutes
      })
      .select(`
        *,
        league:leagues!inner (
          id,
          name,
          sport_type,
          league_type,
          location
        )
      `)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: 'Database error', message: error.message },
        { status: 500 }
      );
    }

    // Return the created division with additional computed fields
    const divisionResponse: DivisionResponse = {
      ...division,
      teamCount: 0,
      playerCount: 0,
      availableSpots: 0,
      matchesPlayed: 0,
      matchesScheduled: 0,
      spotsRemaining: max_teams,
      isOpenForTeams: registration_open,
      capacityPercentage: 0
    };

    return NextResponse.json({
      success: true,
      data: divisionResponse,
      message: `Division "${name}" created successfully in league "${league.name}"`
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/divisions:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
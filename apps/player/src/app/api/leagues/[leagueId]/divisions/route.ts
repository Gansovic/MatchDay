/**
 * League Divisions API Routes
 * 
 * Handles division management within leagues:
 * - GET /api/leagues/[leagueId]/divisions - Get all divisions in a league
 * - POST /api/leagues/[leagueId]/divisions - Create new division in league
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server-client';

interface RouteParams {
  params: Promise<{ leagueId: string }>;
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

/**
 * GET /api/leagues/[leagueId]/divisions
 * Get all divisions in a specific league
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { leagueId } = await params;
    const { searchParams } = new URL(request.url);
    const includeTeams = searchParams.get('includeTeams') === 'true';
    const includeStats = searchParams.get('includeStats') === 'true';
    const skillLevel = searchParams.get('skillLevel');
    const isActive = searchParams.get('isActive');

    if (!leagueId) {
      return NextResponse.json(
        { success: false, error: 'League ID is required' },
        { status: 400 }
      );
    }

    // Validate leagueId format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(leagueId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid league ID format' },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();

    // First verify the league exists
    const { data: league, error: leagueError } = await supabase
      .from('leagues')
      .select('id, name, sport_type, league_type, location, season_start, season_end, is_active')
      .eq('id', leagueId)
      .single();

    if (leagueError) {
      if (leagueError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'League not found' },
          { status: 404 }
        );
      }
      throw leagueError;
    }

    // Build divisions query
    let divisionSelect = `
      id,
      name,
      description,
      skill_level,
      min_teams,
      max_teams,
      current_teams,
      max_players_per_team,
      min_players_per_team,
      is_active,
      registration_open,
      registration_deadline,
      season_start,
      season_end,
      match_duration_minutes,
      created_at,
      updated_at
    `;

    if (includeTeams) {
      divisionSelect += `,
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
      )`;
    }

    let query = supabase
      .from('divisions')
      .select(divisionSelect)
      .eq('league_id', leagueId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (skillLevel) {
      query = query.eq('skill_level', skillLevel);
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    const { data: divisions, error: divisionsError } = await query;

    if (divisionsError) {
      console.error('Error fetching divisions:', divisionsError);
      return NextResponse.json(
        { success: false, error: 'Database error', message: divisionsError.message },
        { status: 500 }
      );
    }

    // Process divisions to include statistics if requested
    const processedDivisions = await Promise.all(
      (divisions || []).map(async (division) => {
        let processedDivision: any = {
          ...division,
          league: {
            id: league.id,
            name: league.name,
            sport_type: league.sport_type,
            league_type: league.league_type,
            location: league.location
          }
        };

        // Calculate team and player statistics
        let teamCount = division.current_teams || 0;
        let playerCount = 0;
        let availableSpots = 0;
        let processedTeams = [];

        if (includeTeams && division.teams) {
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
              currentPlayers: activeMembers.length,
              availableSpots: Math.max(0, maxPlayers - activeMembers.length)
            };
          });

          teamCount = processedTeams.length;
          playerCount = processedTeams.reduce((total: number, team: any) => total + team.currentPlayers, 0);
          availableSpots = processedTeams.reduce((total: number, team: any) => total + team.availableSpots, 0);
        }

        // Get additional statistics if requested
        if (includeStats) {
          // Get match statistics
          const { data: matches } = await supabase
            .from('matches')
            .select('id, status')
            .eq('division_id', division.id);

          const matchStats = matches || [];
          const matchesPlayed = matchStats.filter(m => m.status === 'completed').length;
          const matchesScheduled = matchStats.filter(m => m.status === 'scheduled').length;

          processedDivision.statistics = {
            matchesPlayed,
            matchesScheduled,
            totalMatches: matchStats.length
          };
        }

        processedDivision.teams = includeTeams ? processedTeams : undefined;
        processedDivision.teamCount = teamCount;
        processedDivision.playerCount = includeTeams || includeStats ? playerCount : undefined;
        processedDivision.availableSpots = includeTeams || includeStats ? availableSpots : undefined;
        
        // Division capacity information
        processedDivision.spotsRemaining = Math.max(0, division.max_teams - teamCount);
        processedDivision.isOpenForTeams = teamCount < division.max_teams && division.registration_open;
        processedDivision.capacityPercentage = Math.round((teamCount / division.max_teams) * 100);

        return processedDivision;
      })
    );

    // Calculate league-wide division summary
    const totalTeams = processedDivisions.reduce((sum, div) => sum + div.teamCount, 0);
    const totalPlayers = processedDivisions.reduce((sum, div) => sum + (div.playerCount || 0), 0);
    const activeDivisions = processedDivisions.filter(div => div.is_active);
    const openForRegistration = processedDivisions.filter(div => div.registration_open && div.is_active);

    const response = {
      league: {
        id: league.id,
        name: league.name,
        sport_type: league.sport_type,
        league_type: league.league_type,
        location: league.location,
        season_start: league.season_start,
        season_end: league.season_end,
        is_active: league.is_active
      },
      divisions: processedDivisions,
      summary: {
        total_divisions: processedDivisions.length,
        active_divisions: activeDivisions.length,
        divisions_open_for_registration: openForRegistration.length,
        total_teams: totalTeams,
        total_players: includeTeams || includeStats ? totalPlayers : undefined,
        skill_levels: [...new Set(processedDivisions.map(div => div.skill_level))],
        average_teams_per_division: processedDivisions.length > 0 ? 
          Math.round(totalTeams / processedDivisions.length * 10) / 10 : 0
      }
    };

    const jsonResponse = NextResponse.json({
      success: true,
      data: response,
      message: `Retrieved ${processedDivisions.length} division(s) for league "${league.name}"`
    });

    // Add CORS headers
    jsonResponse.headers.set('Access-Control-Allow-Origin', '*');
    jsonResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    jsonResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return jsonResponse;

  } catch (error) {
    console.error('Error in GET /api/leagues/[leagueId]/divisions:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/leagues/[leagueId]/divisions
 * Create a new division in the specified league
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { leagueId } = await params;
    const body = await request.json();

    // Validate leagueId format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(leagueId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid league ID format' },
        { status: 400 }
      );
    }

    const {
      name,
      description,
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
      match_duration_minutes = 90,
      create_default_teams = false, // Option to create sample teams
      auto_generate_fixtures = false // Option to auto-generate fixtures if enough teams
    } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Division name is required' },
        { status: 400 }
      );
    }

    // Validate skill level
    const validSkillLevels = ['beginner', 'intermediate', 'advanced', 'professional', 'youth', 'veterans'];
    if (!validSkillLevels.includes(skill_level)) {
      return NextResponse.json(
        { success: false, error: 'Invalid skill level' },
        { status: 400 }
      );
    }

    // Validate team and player limits
    if (min_teams > max_teams) {
      return NextResponse.json(
        { success: false, error: 'min_teams cannot be greater than max_teams' },
        { status: 400 }
      );
    }

    if (min_players_per_team > max_players_per_team) {
      return NextResponse.json(
        { success: false, error: 'min_players_per_team cannot be greater than max_players_per_team' },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();

    // Verify league exists
    const { data: league, error: leagueError } = await supabase
      .from('leagues')
      .select('id, name, created_by, season_start, season_end, is_active')
      .eq('id', leagueId)
      .single();

    if (leagueError) {
      if (leagueError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'League not found' },
          { status: 404 }
        );
      }
      throw leagueError;
    }

    if (!league.is_active) {
      return NextResponse.json(
        { success: false, error: 'Cannot create divisions in inactive leagues' },
        { status: 400 }
      );
    }

    // Check for duplicate division name in the same league
    const { data: existingDivision } = await supabase
      .from('divisions')
      .select('id')
      .eq('name', name)
      .eq('league_id', leagueId)
      .single();

    if (existingDivision) {
      return NextResponse.json(
        { success: false, error: 'Division name already exists in this league' },
        { status: 409 }
      );
    }

    // Use league dates as defaults if not provided
    const divisionSeasonStart = season_start || league.season_start;
    const divisionSeasonEnd = season_end || league.season_end;

    // Create the division
    const { data: division, error: createError } = await supabase
      .from('divisions')
      .insert({
        name,
        description,
        league_id: leagueId,
        skill_level,
        min_teams,
        max_teams,
        max_players_per_team,
        min_players_per_team,
        is_active,
        registration_open,
        registration_deadline,
        season_start: divisionSeasonStart,
        season_end: divisionSeasonEnd,
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

    if (createError) {
      console.error('Error creating division:', createError);
      return NextResponse.json(
        { success: false, error: 'Database error', message: createError.message },
        { status: 500 }
      );
    }

    // Optionally create default teams for demonstration
    let createdTeams = [];
    if (create_default_teams) {
      const defaultTeams = [
        { name: `${name} Team A`, captain_name: 'Captain A' },
        { name: `${name} Team B`, captain_name: 'Captain B' },
        { name: `${name} Team C`, captain_name: 'Captain C' },
        { name: `${name} Team D`, captain_name: 'Captain D' }
      ].slice(0, Math.min(4, max_teams)); // Create up to 4 teams or max_teams, whichever is smaller

      for (const teamData of defaultTeams) {
        const { data: team } = await supabase
          .from('teams')
          .insert({
            name: teamData.name,
            description: `Default team for ${name} division`,
            division_id: division.id,
            league_id: leagueId,
            max_players: max_players_per_team,
            min_players: min_players_per_team,
            is_recruiting: true,
            is_active: true
          })
          .select('id, name')
          .single();

        if (team) {
          // Initialize standings for the team
          await supabase
            .from('division_standings')
            .insert({
              division_id: division.id,
              team_id: team.id
            });

          createdTeams.push(team);
        }
      }
    }

    const response = {
      ...division,
      teamCount: createdTeams.length,
      playerCount: 0,
      availableSpots: createdTeams.length * max_players_per_team,
      spotsRemaining: Math.max(0, max_teams - createdTeams.length),
      isOpenForTeams: registration_open && createdTeams.length < max_teams,
      capacityPercentage: Math.round((createdTeams.length / max_teams) * 100),
      teams: createdTeams
    };

    return NextResponse.json({
      success: true,
      data: response,
      message: `Division "${name}" created successfully in league "${league.name}"${createdTeams.length > 0 ? ` with ${createdTeams.length} default teams` : ''}`
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/leagues/[leagueId]/divisions:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
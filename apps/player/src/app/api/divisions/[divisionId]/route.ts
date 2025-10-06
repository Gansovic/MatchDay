/**
 * Individual Division API Routes
 * 
 * Handles individual division operations:
 * - GET /api/divisions/[divisionId] - Get detailed division information
 * - PUT /api/divisions/[divisionId] - Update division information (league admin only)
 * - DELETE /api/divisions/[divisionId] - Delete division (league admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server-client';

interface RouteParams {
  params: Promise<{ divisionId: string }>;
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

/**
 * GET /api/divisions/[divisionId]
 * Get detailed information for a specific division
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { divisionId } = await params;

    if (!divisionId) {
      return NextResponse.json(
        { success: false, error: 'Division ID is required' },
        { status: 400 }
      );
    }

    // Validate divisionId format (basic UUID validation)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(divisionId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid division ID format' },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();

    // Get division with detailed team, standings, and match information
    const { data: division, error } = await supabase
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
          is_active,
          created_by
        ),
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
        ),
        division_standings (
          team_id,
          position,
          points,
          matches_played,
          wins,
          draws,
          losses,
          goals_for,
          goals_against,
          goal_difference,
          last_updated
        )
      `)
      .eq('id', divisionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Division not found' },
          { status: 404 }
        );
      }
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: 'Database error', message: error.message },
        { status: 500 }
      );
    }

    // Get match statistics for this division
    const { data: matches } = await supabase
      .from('matches')
      .select('id, status, match_date, home_team_id, away_team_id, home_score, away_score, round_number')
      .eq('division_id', divisionId)
      .order('match_date', { ascending: false });

    // Get fixture information
    const { data: fixtures } = await supabase
      .from('division_fixtures')
      .select('*')
      .eq('division_id', divisionId)
      .order('round_number', { ascending: true });

    // Process teams with standings and player information
    const processedTeams = (division.teams || []).map(team => {
      const activeMembers = team.team_members?.filter(member => member.is_active) || [];
      const standings = division.division_standings?.find(s => s.team_id === team.id);
      
      return {
        ...team,
        currentPlayers: activeMembers.length,
        availableSpots: Math.max(0, (team.max_players || 22) - activeMembers.length),
        members: activeMembers.map(member => ({
          id: member.id,
          user_id: member.user_id,
          position: member.position,
          jersey_number: member.jersey_number,
          joined_at: member.joined_at,
          player_name: member.users?.display_name,
          player_email: member.users?.email
        })),
        standings: standings ? {
          position: standings.position,
          points: standings.points,
          matches_played: standings.matches_played,
          wins: standings.wins,
          draws: standings.draws,
          losses: standings.losses,
          goals_for: standings.goals_for,
          goals_against: standings.goals_against,
          goal_difference: standings.goal_difference,
          last_updated: standings.last_updated
        } : null,
        // Remove raw team_members data
        team_members: undefined
      };
    });

    // Calculate division statistics
    const totalPlayers = processedTeams.reduce((sum, team) => sum + team.currentPlayers, 0);
    const totalAvailableSpots = processedTeams.reduce((sum, team) => sum + team.availableSpots, 0);
    const matchStats = {
      total: matches?.length || 0,
      completed: matches?.filter(m => m.status === 'completed').length || 0,
      scheduled: matches?.filter(m => m.status === 'scheduled').length || 0,
      live: matches?.filter(m => m.status === 'live').length || 0,
      cancelled: matches?.filter(m => m.status === 'cancelled').length || 0
    };

    // Sort standings by position
    const sortedStandings = division.division_standings?.sort((a, b) => {
      // Sort by position first (nulls last), then by points desc, then by goal difference desc
      if (a.position === null && b.position !== null) return 1;
      if (a.position !== null && b.position === null) return -1;
      if (a.position !== null && b.position !== null) return a.position - b.position;
      
      // If both positions are null, sort by points desc, then goal difference desc
      if (b.points !== a.points) return b.points - a.points;
      return b.goal_difference - a.goal_difference;
    });

    // Get upcoming matches (next 5)
    const upcomingMatches = matches?.filter(m => 
      m.status === 'scheduled' && new Date(m.match_date) > new Date()
    ).slice(0, 5);

    // Get recent completed matches (last 5)
    const recentMatches = matches?.filter(m => 
      m.status === 'completed'
    ).slice(0, 5);

    const response = {
      ...division,
      teams: processedTeams,
      standings: sortedStandings,
      fixtures: fixtures || [],
      matches: {
        all: matches || [],
        upcoming: upcomingMatches || [],
        recent: recentMatches || [],
        statistics: matchStats
      },
      statistics: {
        teamCount: processedTeams.length,
        playerCount: totalPlayers,
        availableSpots: totalAvailableSpots,
        averagePlayersPerTeam: processedTeams.length > 0 ? 
          Math.round(totalPlayers / processedTeams.length * 10) / 10 : 0,
        capacityUsed: Math.round((processedTeams.length / division.max_teams) * 100),
        registrationStatus: {
          isOpen: division.registration_open && processedTeams.length < division.max_teams,
          spotsRemaining: Math.max(0, division.max_teams - processedTeams.length),
          deadline: division.registration_deadline
        }
      },
      // Remove raw division_standings from response
      division_standings: undefined
    };

    const jsonResponse = NextResponse.json({
      success: true,
      data: response,
      message: 'Division details retrieved successfully'
    });

    // Add CORS headers
    jsonResponse.headers.set('Access-Control-Allow-Origin', '*');
    jsonResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    jsonResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return jsonResponse;

  } catch (error) {
    console.error('Error in GET /api/divisions/[divisionId]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/divisions/[divisionId]
 * Update division information (league admin only)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { divisionId } = await params;
    const body = await request.json();

    // Validate divisionId format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(divisionId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid division ID format' },
        { status: 400 }
      );
    }

    const {
      name,
      description,
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
    } = body;

    const supabase = createAdminSupabaseClient();

    // Verify division exists and get current state
    const { data: currentDivision, error: fetchError } = await supabase
      .from('divisions')
      .select('*, league:leagues!inner(created_by)')
      .eq('id', divisionId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Division not found' },
          { status: 404 }
        );
      }
      throw fetchError;
    }

    // Validate constraints if provided
    if (min_teams !== undefined && max_teams !== undefined && min_teams > max_teams) {
      return NextResponse.json(
        { success: false, error: 'min_teams cannot be greater than max_teams' },
        { status: 400 }
      );
    }

    if (min_players_per_team !== undefined && max_players_per_team !== undefined && 
        min_players_per_team > max_players_per_team) {
      return NextResponse.json(
        { success: false, error: 'min_players_per_team cannot be greater than max_players_per_team' },
        { status: 400 }
      );
    }

    // Check if reducing max_teams below current team count
    if (max_teams !== undefined && max_teams < currentDivision.current_teams) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot reduce max_teams to ${max_teams} as division currently has ${currentDivision.current_teams} teams` 
        },
        { status: 400 }
      );
    }

    // Validate skill level if provided
    if (skill_level !== undefined) {
      const validSkillLevels = ['beginner', 'intermediate', 'advanced', 'professional', 'youth', 'veterans'];
      if (!validSkillLevels.includes(skill_level)) {
        return NextResponse.json(
          { success: false, error: 'Invalid skill level' },
          { status: 400 }
        );
      }
    }

    // Check for duplicate name in same league (if name is being changed)
    if (name !== undefined && name !== currentDivision.name) {
      const { data: existingDivision } = await supabase
        .from('divisions')
        .select('id')
        .eq('name', name)
        .eq('league_id', currentDivision.league_id)
        .neq('id', divisionId)
        .single();

      if (existingDivision) {
        return NextResponse.json(
          { success: false, error: 'Division name already exists in this league' },
          { status: 409 }
        );
      }
    }

    // Prepare update object (only include defined values)
    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (skill_level !== undefined) updateData.skill_level = skill_level;
    if (min_teams !== undefined) updateData.min_teams = min_teams;
    if (max_teams !== undefined) updateData.max_teams = max_teams;
    if (max_players_per_team !== undefined) updateData.max_players_per_team = max_players_per_team;
    if (min_players_per_team !== undefined) updateData.min_players_per_team = min_players_per_team;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (registration_open !== undefined) updateData.registration_open = registration_open;
    if (registration_deadline !== undefined) updateData.registration_deadline = registration_deadline;
    if (season_start !== undefined) updateData.season_start = season_start;
    if (season_end !== undefined) updateData.season_end = season_end;
    if (match_duration_minutes !== undefined) updateData.match_duration_minutes = match_duration_minutes;
    
    updateData.updated_at = new Date().toISOString();

    const { data: division, error } = await supabase
      .from('divisions')
      .update(updateData)
      .eq('id', divisionId)
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

    const jsonResponse = NextResponse.json({
      success: true,
      data: division,
      message: 'Division updated successfully'
    });

    // Add CORS headers
    jsonResponse.headers.set('Access-Control-Allow-Origin', '*');
    jsonResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    jsonResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return jsonResponse;

  } catch (error) {
    console.error('Error in PUT /api/divisions/[divisionId]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/divisions/[divisionId]
 * Delete a division (league admin only)
 * Can only delete if no teams are assigned
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { divisionId } = await params;

    // Validate divisionId format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(divisionId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid division ID format' },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();

    // Check if the division has any teams
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id, name')
      .eq('division_id', divisionId)
      .eq('is_active', true);

    if (teamsError) {
      console.error('Error checking division teams:', teamsError);
      return NextResponse.json(
        { success: false, error: 'Database error', message: teamsError.message },
        { status: 500 }
      );
    }

    if (teams && teams.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot delete division with active teams', 
          message: `Division has ${teams.length} active team(s). Remove all teams before deletion.`,
          details: { activeTeams: teams.map(t => ({ id: t.id, name: t.name })) }
        },
        { status: 409 }
      );
    }

    // Check if division has any matches
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('id')
      .eq('division_id', divisionId);

    if (matchesError) {
      console.error('Error checking division matches:', matchesError);
      return NextResponse.json(
        { success: false, error: 'Database error', message: matchesError.message },
        { status: 500 }
      );
    }

    if (matches && matches.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot delete division with existing matches', 
          message: `Division has ${matches.length} match(es). Delete all matches before removing division.` 
        },
        { status: 409 }
      );
    }

    // Delete related data first (fixtures, standings)
    await supabase.from('division_fixtures').delete().eq('division_id', divisionId);
    await supabase.from('division_standings').delete().eq('division_id', divisionId);

    // Delete the division
    const { error } = await supabase
      .from('divisions')
      .delete()
      .eq('id', divisionId);

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Division not found' },
          { status: 404 }
        );
      }
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: 'Database error', message: error.message },
        { status: 500 }
      );
    }

    const jsonResponse = NextResponse.json({
      success: true,
      message: 'Division deleted successfully'
    });

    // Add CORS headers
    jsonResponse.headers.set('Access-Control-Allow-Origin', '*');
    jsonResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    jsonResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return jsonResponse;

  } catch (error) {
    console.error('Error in DELETE /api/divisions/[divisionId]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
/**
 * Individual League API Routes
 * 
 * Handles individual league operations:
 * - GET /api/leagues/[leagueId] - Get detailed league information
 * - PUT /api/leagues/[leagueId] - Update league information (admin only)
 * - DELETE /api/leagues/[leagueId] - Delete league (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase, createAdminClient } from '@/lib/supabase/client';
import { LeagueService } from '@matchday/services';

interface RouteParams {
  params: Promise<{ leagueId: string }>;
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

/**
 * GET /api/leagues/[leagueId]
 * Get detailed information for a specific league
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { leagueId } = await params;

    if (!leagueId) {
      return NextResponse.json(
        { success: false, error: 'League ID is required' },
        { status: 400 }
      );
    }

    // Check if it's a name or UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const isUuid = uuidRegex.test(leagueId);

    // Get league basic information first
    let query = supabase.from('leagues').select('*');
    
    if (isUuid) {
      query = query.eq('id', leagueId);
    } else {
      query = query.ilike('name', leagueId);
    }
    
    const { data: league, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'League not found' },
          { status: 404 }
        );
      }
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: 'Database error', message: error.message },
        { status: 500 }
      );
    }

    // Get current season for this league
    const { data: currentSeason } = await supabase
      .from('seasons')
      .select('id')
      .eq('league_id', league.id)
      .eq('is_current', true)
      .single();

    let teams = [];
    
    if (currentSeason) {
      // Get teams registered for the current season
      const { data: seasonTeams } = await supabase
        .from('season_teams')
        .select(`
          team:teams (
            id,
            name,
            team_color,
            captain_id,
            max_players,
            team_members (
              id,
              user_id,
              position,
              jersey_number,
              joined_at,
              is_active
            )
          )
        `)
        .eq('season_id', currentSeason.id)
        .in('status', ['registered', 'confirmed']);

      if (seasonTeams) {
        teams = seasonTeams.map(st => st.team).filter(Boolean);
      }
    }

    // Process the league data to include statistics
    const teamCount = teams.length;
    
    // Calculate total active players across all teams
    const playerCount = teams.reduce((total, team) => {
      const activeMembers = team.team_members?.filter(member => member.is_active) || [];
      return total + activeMembers.length;
    }, 0);

    // Calculate available spots across all teams
    const availableSpots = teams.reduce((total, team) => {
      const activeMembers = team.team_members?.filter(member => member.is_active) || [];
      const maxPlayers = team.max_players || 22;
      return total + Math.max(0, maxPlayers - activeMembers.length);
    }, 0);

    // Clean up team member data for response
    const processedTeams = teams.map(team => ({
      ...team,
      currentPlayers: team.team_members?.filter(member => member.is_active).length || 0,
      members: team.team_members?.filter(member => member.is_active).map(member => ({
        id: member.id,
        user_id: member.user_id,
        position: member.position,
        jersey_number: member.jersey_number,
        joined_at: member.joined_at,
        user_name: member.users?.full_name,
        user_email: member.users?.email
      })) || []
    }));

    // Remove the raw team_members data
    processedTeams.forEach(team => delete team.team_members);

    const response = {
      ...league,
      teams: processedTeams,
      teamCount,
      playerCount,
      availableSpots,
      // Add derived stats
      isOpenForTeams: teamCount < (league.max_teams || 16),
      hasActiveTeams: teamCount > 0,
      averagePlayersPerTeam: teamCount > 0 ? Math.round(playerCount / teamCount * 10) / 10 : 0
    };

    const jsonResponse = NextResponse.json({
      success: true,
      data: response,
      message: 'League details retrieved successfully'
    });

    // Add CORS headers
    jsonResponse.headers.set('Access-Control-Allow-Origin', '*');
    jsonResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    jsonResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return jsonResponse;

  } catch (error) {
    console.error('Error in GET /api/leagues/[leagueId]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/leagues/[leagueId]
 * Update league information (admin only)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { leagueId } = await params;
    const body = await request.json();

    // Use admin client with service role permissions to bypass RLS
    const adminClient = createAdminClient();

    // Check if it's a name or UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const isUuid = uuidRegex.test(leagueId);

    const {
      name,
      description,
      logo_url,
      sport_type,
      league_type,
      location,
      season_start,
      season_end,
      max_teams,
      entry_fee,
      is_active,
      is_public,
      season
    } = body;

    // First get the league to find its ID if name was provided
    let actualLeagueId = leagueId;
    if (!isUuid) {
      const { data: leagueData } = await adminClient
        .from('leagues')
        .select('id')
        .ilike('name', leagueId)
        .single();
      
      if (leagueData) {
        actualLeagueId = leagueData.id;
      }
    }

    // Prepare update object (only include defined values)
    const updateData: Record<string, string | number | boolean | Date> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (logo_url !== undefined) updateData.logo_url = logo_url;
    if (sport_type !== undefined) updateData.sport_type = sport_type;
    if (league_type !== undefined) updateData.league_type = league_type;
    if (location !== undefined) updateData.location = location;
    if (season_start !== undefined) updateData.season_start = season_start;
    if (season_end !== undefined) updateData.season_end = season_end;
    if (max_teams !== undefined) updateData.max_teams = max_teams;
    if (entry_fee !== undefined) updateData.entry_fee = entry_fee;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (is_public !== undefined) updateData.is_public = is_public;
    if (season !== undefined) updateData.season = season;
    
    updateData.updated_at = new Date().toISOString();

    const { data: league, error } = await adminClient
      .from('leagues')
      .update(updateData)
      .eq('id', actualLeagueId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'League not found' },
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
      data: league,
      message: 'League updated successfully'
    });

    // Add CORS headers
    jsonResponse.headers.set('Access-Control-Allow-Origin', '*');
    jsonResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    jsonResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return jsonResponse;

  } catch (error) {
    console.error('Error in PUT /api/leagues/[leagueId]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/leagues/[leagueId]
 * Partially update league information (admin only)
 * Uses the same logic as PUT but follows REST conventions
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return PUT(request, { params });
}

/**
 * DELETE /api/leagues/[leagueId]
 * Delete a league and all associated data (admin only)
 * Deletes: player_stats → matches → season_join_requests → season_teams → seasons → league
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { leagueId } = await params;

    if (!leagueId) {
      return NextResponse.json(
        { success: false, error: 'League ID is required' },
        { status: 400 }
      );
    }

    // Use admin client with service role permissions to bypass RLS
    const adminClient = createAdminClient();

    // Check if it's a name or UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const isUuid = uuidRegex.test(leagueId);

    // First get the league to find its ID if name was provided
    let actualLeagueId = leagueId;
    if (!isUuid) {
      const { data: leagueData } = await adminClient
        .from('leagues')
        .select('id')
        .ilike('name', leagueId)
        .single();

      if (leagueData) {
        actualLeagueId = leagueData.id;
      } else {
        return NextResponse.json(
          { success: false, error: 'League not found' },
          { status: 404 }
        );
      }
    }

    // Get all seasons for this league
    const { data: seasons, error: seasonsError } = await adminClient
      .from('seasons')
      .select('id')
      .eq('league_id', actualLeagueId);

    if (seasonsError) {
      console.error('Error fetching seasons:', seasonsError);
      return NextResponse.json(
        { success: false, error: 'Database error', message: seasonsError.message },
        { status: 500 }
      );
    }

    if (seasons && seasons.length > 0) {
      const seasonIds = seasons.map(s => s.id);

      // Get all matches for these seasons
      const { data: matches } = await adminClient
        .from('matches')
        .select('id')
        .in('season_id', seasonIds);

      if (matches && matches.length > 0) {
        const matchIds = matches.map(m => m.id);

        // Step 1: Delete player_stats for these matches
        const { error: playerStatsError } = await adminClient
          .from('player_stats')
          .delete()
          .in('match_id', matchIds);

        if (playerStatsError) {
          console.error('Error deleting player_stats:', playerStatsError);
          return NextResponse.json(
            { success: false, error: 'Failed to delete player statistics', message: playerStatsError.message },
            { status: 500 }
          );
        }

        // Step 2: Delete matches
        const { error: matchesError } = await adminClient
          .from('matches')
          .delete()
          .in('id', matchIds);

        if (matchesError) {
          console.error('Error deleting matches:', matchesError);
          return NextResponse.json(
            { success: false, error: 'Failed to delete matches', message: matchesError.message },
            { status: 500 }
          );
        }
      }

      // Step 3: Delete season_join_requests
      const { error: seasonJoinRequestsError } = await adminClient
        .from('season_join_requests')
        .delete()
        .in('season_id', seasonIds);

      if (seasonJoinRequestsError) {
        console.error('Error deleting season_join_requests:', seasonJoinRequestsError);
        return NextResponse.json(
          { success: false, error: 'Failed to delete season join requests', message: seasonJoinRequestsError.message },
          { status: 500 }
        );
      }

      // Step 4: Delete season_teams (team registrations)
      const { error: seasonTeamsError } = await adminClient
        .from('season_teams')
        .delete()
        .in('season_id', seasonIds);

      if (seasonTeamsError) {
        console.error('Error deleting season_teams:', seasonTeamsError);
        return NextResponse.json(
          { success: false, error: 'Failed to delete team registrations', message: seasonTeamsError.message },
          { status: 500 }
        );
      }

      // Step 5: Delete seasons
      const { error: deleteSeasonsError } = await adminClient
        .from('seasons')
        .delete()
        .in('id', seasonIds);

      if (deleteSeasonsError) {
        console.error('Error deleting seasons:', deleteSeasonsError);
        return NextResponse.json(
          { success: false, error: 'Failed to delete seasons', message: deleteSeasonsError.message },
          { status: 500 }
        );
      }
    }

    // Step 6: Delete the league
    const { error: leagueError } = await adminClient
      .from('leagues')
      .delete()
      .eq('id', actualLeagueId);

    if (leagueError) {
      if (leagueError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'League not found' },
          { status: 404 }
        );
      }
      console.error('Error deleting league:', leagueError);
      return NextResponse.json(
        { success: false, error: 'Failed to delete league', message: leagueError.message },
        { status: 500 }
      );
    }

    console.log(`[League Deletion] Successfully deleted league ${actualLeagueId} and all associated data`);

    const jsonResponse = NextResponse.json({
      success: true,
      message: 'League and all associated data deleted successfully'
    });

    // Add CORS headers
    jsonResponse.headers.set('Access-Control-Allow-Origin', '*');
    jsonResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    jsonResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return jsonResponse;

  } catch (error) {
    console.error('Error in DELETE /api/leagues/[leagueId]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
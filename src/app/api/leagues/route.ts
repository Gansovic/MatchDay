/**
 * Leagues API Routes
 * 
 * Handles league-related API operations:
 * - GET /api/leagues - Get available leagues with team and player counts
 * - POST /api/leagues - Create new league (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server-client';

/**
 * GET /api/leagues
 * Get available leagues with comprehensive data
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get('includeStats') === 'true';
    const sportType = searchParams.get('sportType');
    const leagueType = searchParams.get('leagueType');
    const isActive = searchParams.get('isActive');
    const isPublic = searchParams.get('isPublic');

    const supabase = createAdminSupabaseClient();

    // Build query with optional filters
    let query = supabase
      .from('leagues')
      .select(`
        *,
        teams (
          id,
          name,
          team_color,
          captain_id,
          max_players,
          min_players,
          is_recruiting,
          team_members (
            id,
            is_active
          )
        )
      `)
      .order('created_at', { ascending: false });

    // Apply filters if provided
    if (sportType) {
      query = query.eq('sport_type', sportType);
    }
    if (leagueType) {
      query = query.eq('league_type', leagueType);
    }
    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }
    if (isPublic !== null) {
      query = query.eq('is_public', isPublic === 'true');
    }

    const { data: leagues, error } = await query;

    console.log('[Leagues API] Query result:', {
      leagues: leagues?.length || 0,
      leagueNames: leagues?.map(l => l.name) || [],
      error: error?.message || null,
      filters: { sportType, leagueType, isActive, isPublic }
    });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      );
    }

    // Process leagues to include statistics
    const processedLeagues = leagues?.map(league => {
      const teams = league.teams || [];
      const teamCount = teams.length;
      
      // Calculate total players across all teams in this league
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

      // Remove team_members from the response to keep it clean
      const cleanTeams = teams.map(team => ({
        id: team.id,
        name: team.name,
        team_color: team.team_color,
        captain_id: team.captain_id,
        max_players: team.max_players,
        min_players: team.min_players,
        is_recruiting: team.is_recruiting
      }));

      return {
        ...league,
        teams: includeStats ? cleanTeams : undefined,
        teamCount,
        playerCount,
        availableSpots
      };
    }) || [];

    return NextResponse.json({
      success: true,
      data: processedLeagues,
      count: processedLeagues.length,
      message: 'Leagues retrieved successfully'
    });

  } catch (error) {
    console.error('Error in GET /api/leagues:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/leagues
 * Create a new league (admin functionality)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      sport_type = 'football',
      league_type = 'recreational',
      location,
      season_start,
      season_end,
      max_teams = 16,
      entry_fee = 0,
      is_active = true,
      is_public = true,
      season
    } = body;

    // Validate required fields
    if (!name || !sport_type || !league_type) {
      return NextResponse.json(
        { success: false, error: 'Validation error', message: 'Name, sport_type, and league_type are required' },
        { status: 400 }
      );
    }

    // Use admin client for league creation
    const supabase = createAdminSupabaseClient();

    const { data: league, error } = await supabase
      .from('leagues')
      .insert({
        name,
        description,
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
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: 'Database error', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...league,
        teamCount: 0,
        playerCount: 0,
        availableSpots: 0
      },
      message: 'League created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/leagues:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
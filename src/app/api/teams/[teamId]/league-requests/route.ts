/**
 * Team League Request API Routes
 * 
 * Handles team requests to join leagues:
 * - POST: Create a new league join request for a team
 * - GET: Get all league requests for a team
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/client';

interface RouteContext {
  params: {
    teamId: string;
  };
}

/**
 * POST /api/teams/[teamId]/league-requests
 * Create a new league join request for a team
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { teamId } = await params;
    const supabase = createServerClient();
    const adminSupabase = createAdminClient();
    
    // Get authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { league_id, message } = body;

    if (!league_id) {
      return NextResponse.json(
        { error: 'League ID is required' },
        { status: 400 }
      );
    }

    // Verify user is the captain of the team
    const { data: team, error: teamError } = await adminSupabase
      .from('teams')
      .select('captain_id, name, league_id')
      .eq('id', teamId)
      .single();

    if (teamError || !team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    if (team.captain_id !== user.id) {
      return NextResponse.json(
        { error: 'Only team captains can request to join leagues' },
        { status: 403 }
      );
    }

    // Check if team is already in a league
    if (team.league_id) {
      return NextResponse.json(
        { error: 'Team is already part of a league' },
        { status: 400 }
      );
    }

    // Verify league exists and is active
    const { data: league, error: leagueError } = await adminSupabase
      .from('leagues')
      .select('id, name, is_active, is_public, max_teams')
      .eq('id', league_id)
      .single();

    if (leagueError || !league) {
      return NextResponse.json(
        { error: 'League not found' },
        { status: 404 }
      );
    }

    if (!league.is_active || !league.is_public) {
      return NextResponse.json(
        { error: 'League is not available for joining' },
        { status: 400 }
      );
    }

    // Check if league has space (if max_teams is set)
    if (league.max_teams) {
      const { count: currentTeams } = await adminSupabase
        .from('teams')
        .select('*', { count: 'exact', head: true })
        .eq('league_id', league_id);

      if (currentTeams && currentTeams >= league.max_teams) {
        return NextResponse.json(
          { error: 'League is at maximum capacity' },
          { status: 400 }
        );
      }
    }

    // Check if there's already a pending request
    const { data: existingRequest } = await adminSupabase
      .from('team_league_requests')
      .select('id, status')
      .eq('team_id', teamId)
      .eq('league_id', league_id)
      .eq('status', 'pending')
      .single();

    if (existingRequest) {
      return NextResponse.json(
        { error: 'A pending request already exists for this league' },
        { status: 400 }
      );
    }

    // Debug logging
    console.log('Creating request with:', {
      team_id: teamId,
      league_id: league_id,
      requested_by: user.id,
      user_email: user.email
    });

    // Create the league join request
    const { data: request_data, error: insertError } = await adminSupabase
      .from('team_league_requests')
      .insert({
        team_id: teamId,
        league_id: league_id,
        requested_by: user.id,
        message: message?.trim() || null,
        status: 'pending'
      })
      .select(`
        *,
        teams:team_id (
          id,
          name,
          team_color,
          captain_id
        ),
        leagues:league_id (
          id,
          name,
          description,
          location
        )
      `)
      .single();

    if (insertError) {
      console.error('Error creating league request:', insertError);
      return NextResponse.json(
        { error: 'Failed to create league request' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: request_data,
      message: 'League join request submitted successfully'
    });

  } catch (error) {
    console.error('Error in POST /api/teams/[teamId]/league-requests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/teams/[teamId]/league-requests
 * Get all league requests for a team
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { teamId } = await params;
    const supabase = createServerClient();
    
    // Get authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // Verify user has access to this team (captain or member)
    const { data: teamAccess } = await supabase
      .from('teams')
      .select('captain_id')
      .eq('id', teamId)
      .single();

    if (!teamAccess) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    const isCaption = teamAccess.captain_id === user.id;
    
    // Also check if user is a team member
    const { data: membership } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .single();

    if (!isCaption && !membership) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get all requests for this team
    const { data: requests, error } = await supabase
      .from('team_league_requests')
      .select(`
        *,
        leagues:league_id (
          id,
          name,
          description,
          location,
          sport_type,
          league_type,
          entry_fee
        ),
        requested_by_user:requested_by (
          email
        ),
        reviewed_by_user:reviewed_by (
          email
        )
      `)
      .eq('team_id', teamId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching league requests:', error);
      return NextResponse.json(
        { error: 'Failed to fetch league requests' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: requests || [],
      message: 'League requests retrieved successfully'
    });

  } catch (error) {
    console.error('Error in GET /api/teams/[teamId]/league-requests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
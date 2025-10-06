import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

// GET /api/seasons/[seasonId]/join-requests - Get join requests for a season
export async function GET(
  request: NextRequest,
  { params }: { params: { seasonId: string } }
) {
  try {
    // Using imported supabase client

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { seasonId } = params;

    // Validate seasonId format
    if (!seasonId || seasonId.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Invalid season ID' },
        { status: 400 }
      );
    }

    // Verify season exists and user has permission to view requests
    const { data: season, error: seasonError } = await supabase
      .from('seasons')
      .select(`
        id,
        name,
        league:leagues (
          id,
          name,
          admin_user_id
        )
      `)
      .eq('id', seasonId)
      .single();

    if (seasonError || !season) {
      return NextResponse.json(
        { success: false, error: 'Season not found' },
        { status: 404 }
      );
    }

    // Check if user is league admin (only league admins can view all requests)
    if (season.league?.admin_user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Only league admins can view season join requests' },
        { status: 403 }
      );
    }

    // Parse query parameters for filtering
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Build the query
    let query = supabase
      .from('season_join_requests')
      .select(`
        *,
        team:teams (
          id,
          name,
          team_color,
          captain_id
        ),
        user:users!user_id (
          id,
          email
        ),
        responded_by_user:users!responded_by (
          id,
          email
        )
      `)
      .eq('season_id', seasonId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply status filter if provided
    if (status && ['pending', 'approved', 'rejected', 'withdrawn'].includes(status)) {
      query = query.eq('status', status);
    }

    const { data: requests, error } = await query;

    if (error) {
      console.error('Error fetching season join requests:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('season_join_requests')
      .select('id', { count: 'exact' })
      .eq('season_id', seasonId);

    if (status && ['pending', 'approved', 'rejected', 'withdrawn'].includes(status)) {
      countQuery = countQuery.eq('status', status);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Error counting season join requests:', countError);
    }

    return NextResponse.json({
      success: true,
      data: requests || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    });
  } catch (error) {
    console.error('Error in GET /api/seasons/[seasonId]/join-requests:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/seasons/[seasonId]/join-requests - Create a new join request
export async function POST(
  request: NextRequest,
  { params }: { params: { seasonId: string } }
) {
  try {
    // Using imported supabase client

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { seasonId } = params;

    // Validate request body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { team_id, message } = body;

    // Validate input
    if (!team_id) {
      return NextResponse.json(
        { success: false, error: 'Team ID is required' },
        { status: 400 }
      );
    }

    if (!seasonId || seasonId.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Invalid season ID' },
        { status: 400 }
      );
    }

    if (message && message.length > 1000) {
      return NextResponse.json(
        { success: false, error: 'Message too long (max 1000 characters)' },
        { status: 400 }
      );
    }

    // Verify season exists and is accepting registrations
    const { data: season, error: seasonError } = await supabase
      .from('seasons')
      .select(`
        id,
        name,
        status,
        registration_start,
        registration_end,
        max_teams,
        league:leagues (
          id,
          name
        )
      `)
      .eq('id', seasonId)
      .single();

    if (seasonError || !season) {
      return NextResponse.json(
        { success: false, error: 'Season not found' },
        { status: 404 }
      );
    }

    // Check if season allows registrations - only draft and registration status seasons
    if (season.status !== 'draft' && season.status !== 'registration') {
      return NextResponse.json(
        {
          success: false,
          error: `Season is currently ${season.status} and not accepting new registrations. Only draft and registration status seasons accept join requests.`
        },
        { status: 400 }
      );
    }

    // Check registration period
    const now = new Date();
    if (season.registration_start && new Date(season.registration_start) > now) {
      return NextResponse.json(
        { success: false, error: 'Registration period has not started yet' },
        { status: 400 }
      );
    }

    if (season.registration_end && new Date(season.registration_end) < now) {
      return NextResponse.json(
        { success: false, error: 'Registration period has ended' },
        { status: 400 }
      );
    }

    // Verify user is captain of the team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('id, name, captain_id')
      .eq('id', team_id)
      .single();

    if (teamError || !team) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      );
    }

    if (team.captain_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Only team captains can submit join requests' },
        { status: 403 }
      );
    }

    // Check if team is already in the season
    const { data: existingRegistration } = await supabase
      .from('season_teams')
      .select('id, status')
      .eq('season_id', seasonId)
      .eq('team_id', team_id)
      .single();

    if (existingRegistration) {
      return NextResponse.json(
        { success: false, error: `Team is already ${existingRegistration.status} for this season` },
        { status: 400 }
      );
    }

    // Check for existing requests
    const { data: existingRequest } = await supabase
      .from('season_join_requests')
      .select('id, status')
      .eq('season_id', seasonId)
      .eq('team_id', team_id)
      .in('status', ['pending', 'approved'])
      .single();

    if (existingRequest) {
      const statusText = existingRequest.status === 'pending' ? 'pending' : 'already approved';
      return NextResponse.json(
        { success: false, error: `A ${statusText} request already exists for this team` },
        { status: 400 }
      );
    }

    // Check if season has reached max teams
    if (season.max_teams) {
      const { count: currentTeams, error: countError } = await supabase
        .from('season_teams')
        .select('id', { count: 'exact' })
        .eq('season_id', seasonId)
        .eq('status', 'registered');

      if (countError) {
        console.error('Error counting teams in season:', countError);
      } else if (currentTeams && currentTeams >= season.max_teams) {
        return NextResponse.json(
          { success: false, error: 'Season has reached maximum number of teams' },
          { status: 400 }
        );
      }
    }

    // Create the join request
    const { data: newRequest, error: insertError } = await supabase
      .from('season_join_requests')
      .insert({
        season_id: seasonId,
        team_id,
        user_id: user.id,
        message: message || null,
        status: 'pending'
      })
      .select(`
        *,
        team:teams (
          id,
          name,
          team_color
        ),
        season:seasons (
          id,
          name,
          display_name
        )
      `)
      .single();

    if (insertError) {
      console.error('Error creating join request:', insertError);
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: newRequest,
      message: 'Join request created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/seasons/[seasonId]/join-requests:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}


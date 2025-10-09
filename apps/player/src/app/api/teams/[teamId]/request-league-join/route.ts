import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server-client';

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    const { seasonId, message, requestedBy } = await request.json();

    if (!teamId || !seasonId || !requestedBy) {
      return NextResponse.json(
        {
          success: false,
          error: 'Team ID, Season ID, and requestedBy are required'
        },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();

    // Check if team exists
    const { data: team, error: teamError } = await (supabase as any)
      .from('teams')
      .select('id, name')
      .eq('id', teamId)
      .single();

    if (teamError || !team) {
      return NextResponse.json(
        {
          success: false,
          error: 'Team not found'
        },
        { status: 404 }
      );
    }

    // Check if season exists and is active
    const { data: season, error: seasonError } = await (supabase as any)
      .from('seasons')
      .select(`
        id,
        name,
        league_id,
        status,
        registration_deadline,
        max_teams,
        min_teams,
        leagues (id, name, is_active, is_public)
      `)
      .eq('id', seasonId)
      .single();

    if (seasonError || !season) {
      return NextResponse.json(
        {
          success: false,
          error: 'Season not found'
        },
        { status: 404 }
      );
    }

    // Verify league is public and active
    if (!season.leagues.is_public || !season.leagues.is_active) {
      return NextResponse.json(
        {
          success: false,
          error: 'League is not accepting registrations'
        },
        { status: 400 }
      );
    }

    // Check if season is accepting registrations
    if (season.status !== 'draft' && season.status !== 'registration') {
      return NextResponse.json(
        {
          success: false,
          error: 'Season is not accepting new team registrations'
        },
        { status: 400 }
      );
    }

    // Check registration deadline
    if (season.registration_deadline && new Date(season.registration_deadline) < new Date()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Registration deadline has passed'
        },
        { status: 400 }
      );
    }

    // Check max teams limit
    if (season.max_teams) {
      const { count: teamCount } = await (supabase as any)
        .from('season_teams')
        .select('*', { count: 'exact', head: true })
        .eq('season_id', seasonId)
        .in('status', ['registered', 'confirmed']);

      if (teamCount && teamCount >= season.max_teams) {
        return NextResponse.json(
          {
            success: false,
            error: 'Season has reached maximum team capacity'
          },
          { status: 400 }
        );
      }
    }

    // Check if team is already in this season
    const { data: existingTeam } = await (supabase as any)
      .from('season_teams')
      .select('id')
      .eq('season_id', seasonId)
      .eq('team_id', teamId)
      .single();

    if (existingTeam) {
      return NextResponse.json(
        {
          success: false,
          error: `Team "${team.name}" is already registered for this season`
        },
        { status: 400 }
      );
    }

    // Check if team already has a pending request for this season
    const { data: existingRequest, error: checkError } = await (supabase as any)
      .from('season_join_requests')
      .select('id, status')
      .eq('team_id', teamId)
      .eq('season_id', seasonId)
      .eq('status', 'pending')
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing requests:', checkError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to check existing requests'
        },
        { status: 500 }
      );
    }

    if (existingRequest) {
      return NextResponse.json(
        {
          success: false,
          error: `Team "${team.name}" already has a pending request for this season`
        },
        { status: 400 }
      );
    }

    // Create the join request
    const requestData = {
      team_id: teamId,
      season_id: seasonId,
      user_id: requestedBy,
      message: message || null,
      status: 'pending'
    };

    const { data: newRequest, error: createError} = await (supabase as any)
      .from('season_join_requests')
      .insert(requestData)
      .select(`
        *,
        team:teams (id, name),
        season:seasons (id, name, league_id, leagues (id, name))
      `)
      .single();

    if (createError) {
      console.error('Failed to create join request:', createError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create join request'
        },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      success: true,
      data: {
        request: newRequest,
        message: `Join request submitted successfully! Team "${team.name}" is now waiting for approval to join "${season.name}".`
      },
      error: null
    });

    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return response;
  } catch (error) {
    console.error('Error creating join request:', error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: 'Failed to create join request'
      },
      { status: 500 }
    );
  }
}
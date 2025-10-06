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
    const { leagueId, message, requestedBy } = await request.json();
    
    if (!teamId || !leagueId || !requestedBy) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Team ID, League ID, and requestedBy are required' 
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

    // Check if league exists, is active, and requires manual approval
    const { data: league, error: leagueError } = await (supabase as any)
      .from('leagues')
      .select('id, name, auto_approve_teams, is_active, is_public, registration_deadline, max_teams')
      .eq('id', leagueId)
      .eq('is_active', true)
      .single();

    if (leagueError || !league) {
      return NextResponse.json(
        { 
          success: false,
          error: 'League not found or inactive' 
        },
        { status: 404 }
      );
    }

    // If league has auto-approval, redirect to regular join endpoint
    if (league.auto_approve_teams) {
      return NextResponse.json(
        { 
          success: false,
          error: 'This league has auto-approval enabled. Use the regular join endpoint instead.',
          redirect_to_auto_join: true
        },
        { status: 400 }
      );
    }

    // Verify league is public and accepting registrations
    if (!league.is_public) {
      return NextResponse.json(
        { 
          success: false,
          error: 'League is not accepting public registrations' 
        },
        { status: 400 }
      );
    }

    // Check registration deadline
    if (league.registration_deadline && new Date(league.registration_deadline) < new Date()) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Registration deadline has passed' 
        },
        { status: 400 }
      );
    }

    // Check max teams limit
    if (league.max_teams) {
      const { count: teamCount } = await (supabase as any)
        .from('teams')
        .select('*', { count: 'exact', head: true })
        .eq('league_id', leagueId);

      if (teamCount && teamCount >= league.max_teams) {
        return NextResponse.json(
          { 
            success: false,
            error: 'League has reached maximum team capacity' 
          },
          { status: 400 }
        );
      }
    }

    // Check if team already has a pending or approved request for this league
    const { data: existingRequest, error: checkError } = await (supabase as any)
      .from('team_join_requests')
      .select('id, status')
      .eq('team_id', teamId)
      .eq('league_id', leagueId)
      .in('status', ['pending', 'approved'])
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
          error: `Team "${team.name}" already has a ${existingRequest.status} request for this league` 
        },
        { status: 400 }
      );
    }

    // Create the join request
    const requestData = {
      team_id: teamId,
      league_id: leagueId,
      requested_by: requestedBy,
      message: message || null,
      status: 'pending',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    };

    const { data: newRequest, error: createError } = await (supabase as any)
      .from('team_join_requests')
      .insert(requestData)
      .select(`
        *,
        teams:team_id (id, name),
        leagues:league_id (id, name)
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
        message: `Join request submitted successfully! Team "${team.name}" is now waiting for approval to join "${league.name}".`
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
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leagueId } = await params;

    if (!leagueId) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: 'League ID is required'
        },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(leagueId)) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: 'Invalid league ID format. Expected UUID.'
        },
        { status: 400 }
      );
    }

    try {
      // Fetch pending season join requests for this league
      const { data: pendingRequests, error: requestsError } = await supabase
        .from('season_join_requests')
        .select(`
          id,
          created_at,
          message,
          status,
          user_id,
          team_id,
          season_id,
          teams:team_id (
            id,
            name,
            team_color
          ),
          users:user_id (
            id,
            email,
            full_name
          ),
          seasons:season_id (
            id,
            name,
            display_name,
            league_id
          )
        `)
        .eq('status', 'pending')
        .eq('seasons.league_id', leagueId)
        .order('created_at', { ascending: false });

      if (requestsError) {
        throw new Error(`Failed to fetch pending requests: ${requestsError.message}`);
      }

      const requests = (pendingRequests || []).map((request: any) => ({
        id: request.id,
        created_at: request.created_at,
        message: request.message,
        status: request.status,
        user_id: request.user_id,
        team_id: request.team_id,
        season_id: request.season_id,
        team: {
          id: request.teams?.id,
          name: request.teams?.name || 'Unknown Team',
          team_color: request.teams?.team_color
        },
        user: {
          id: request.users?.id,
          email: request.users?.email,
          full_name: request.users?.full_name || 'Unknown User'
        },
        season: {
          id: request.seasons?.id,
          name: request.seasons?.name,
          display_name: request.seasons?.display_name,
          league_id: request.seasons?.league_id
        }
      }));

      const response = NextResponse.json({
        success: true,
        data: {
          requests,
          count: requests.length
        },
        error: null
      });

      // Add CORS headers
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      return response;

    } catch (error) {
      console.error('Database query error:', error);
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: 'Failed to fetch pending requests'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API request error:', error);
    return NextResponse.json({
      success: false,
      data: null,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
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
    const { searchParams } = new URL(request.url);
    const seasonId = searchParams.get('season_id');

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

    if (seasonId && !uuidRegex.test(seasonId)) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: 'Invalid season ID format. Expected UUID.'
        },
        { status: 400 }
      );
    }

    try {
      // Build the Supabase query for teams
      let query = supabase
        .from('teams')
        .select(`
          id,
          name,
          team_color,
          captain_id,
          max_players,
          is_active,
          is_recruiting,
          created_at,
          updated_at,
          season_teams!inner(
            season_id,
            seasons!inner(
              league_id,
              name,
              display_name
            )
          ),
          team_members(
            id,
            user_id,
            is_active,
            position,
            jersey_number,
            users(
              id,
              email,
              full_name
            )
          )
        `)
        .eq('season_teams.seasons.league_id', leagueId);

      // Filter by season if provided
      if (seasonId) {
        query = query.eq('season_teams.season_id', seasonId);
      }

      query = query.order('name', { ascending: true });

      const { data: teamsResult, error: teamsError } = await query;

      if (teamsError) {
        throw new Error(`Failed to fetch teams: ${teamsError.message}`);
      }

      const teams = (teamsResult || []).map((team: any) => ({
        id: team.id,
        name: team.name,
        team_color: team.team_color,
        captain_id: team.captain_id,
        max_players: team.max_players,
        is_active: team.is_active,
        is_recruiting: team.is_recruiting,
        created_at: team.created_at,
        updated_at: team.updated_at,
        // Season and league info
        season_id: team.season_teams?.[0]?.season_id,
        league_id: team.season_teams?.[0]?.seasons?.league_id,
        season_name: team.season_teams?.[0]?.seasons?.name,
        season_display_name: team.season_teams?.[0]?.seasons?.display_name,
        // Team members
        team_members: team.team_members?.filter((member: any) => member.is_active).map((member: any) => ({
          id: member.id,
          user_id: member.user_id,
          is_active: member.is_active,
          position: member.position,
          jersey_number: member.jersey_number,
          user: {
            id: member.users?.id,
            email: member.users?.email,
            full_name: member.users?.full_name
          }
        })) || []
      }));

      const response = NextResponse.json({
        success: true,
        data: teams,
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
          error: 'Failed to fetch league teams'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API request error:', error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}
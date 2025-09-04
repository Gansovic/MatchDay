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
    const { seasonId } = await request.json();
    
    if (!teamId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Team ID is required' 
        },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();

    // If no seasonId provided, find the team's current season registration
    let targetSeasonId = seasonId;
    
    if (!targetSeasonId) {
      // Find the most recent season registration for this team
      const { data: registration, error: findError } = await (supabase as any)
        .from('season_teams')
        .select('season_id, seasons!inner(id, name, display_name, league_id)')
        .eq('team_id', teamId)
        .in('status', ['registered', 'confirmed'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (findError || !registration) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Team is not registered in any season' 
          },
          { status: 400 }
        );
      }

      targetSeasonId = registration.season_id;
    }

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

    // Get the season details
    const { data: season, error: seasonError } = await (supabase as any)
      .from('seasons')
      .select('id, name, display_name, league_id, leagues!inner(id, name)')
      .eq('id', targetSeasonId)
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

    // Check if team is registered for this season
    const { data: existingRegistration, error: checkError } = await (supabase as any)
      .from('season_teams')
      .select('id, status')
      .eq('season_id', targetSeasonId)
      .eq('team_id', teamId)
      .single();

    if (checkError || !existingRegistration) {
      return NextResponse.json(
        { 
          success: false,
          error: `Team "${team.name}" is not registered for the ${season.display_name} season` 
        },
        { status: 400 }
      );
    }

    // Remove team from season
    const { error: deleteError } = await (supabase as any)
      .from('season_teams')
      .delete()
      .eq('season_id', targetSeasonId)
      .eq('team_id', teamId);

    if (deleteError) {
      console.error('Error removing team from season:', deleteError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to remove team from season' 
        },
        { status: 500 }
      );
    }

    // Also remove from season standings if exists
    const { error: standingsError } = await (supabase as any)
      .from('season_standings')
      .delete()
      .eq('season_id', targetSeasonId)
      .eq('team_id', teamId);

    // Don't fail if standings removal fails (might not exist yet)
    if (standingsError) {
      console.warn('Could not remove team from standings:', standingsError);
    }

    const response = NextResponse.json({
      success: true,
      data: {
        team: team,
        season: season,
        league: season.leagues,
        message: `Team "${team.name}" successfully left the ${season.display_name} season of ${season.leagues.name}`
      },
      error: null
    });
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  } catch (error) {
    console.error('Error in leave-season:', error);
    return NextResponse.json(
      { 
        success: false,
        data: null,
        error: 'Failed to leave season' 
      },
      { status: 500 }
    );
  }
}
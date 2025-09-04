import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server-client';
import { SeasonService } from '@/lib/services/season.service';

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
    const { leagueId } = await request.json();
    
    if (!teamId || !leagueId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Team ID and League ID are required' 
        },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();
    const seasonService = SeasonService.getInstance(supabase);
    
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

    // Check if league exists and is active
    const { data: league, error: leagueError } = await (supabase as any)
      .from('leagues')
      .select('id, name, max_teams, is_active, is_public')
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

    // Find the current active season for this league
    const { data: activeSeason, error: seasonError } = await (supabase as any)
      .from('seasons')
      .select('id, name, display_name, max_teams, status')
      .eq('league_id', leagueId)
      .or('is_current.eq.true,status.eq.active')
      .order('is_current', { ascending: false })
      .order('start_date', { ascending: false })
      .limit(1)
      .single();

    if (seasonError || !activeSeason) {
      return NextResponse.json(
        { 
          success: false,
          error: 'No active season found for this league. Please wait for a new season to start.' 
        },
        { status: 400 }
      );
    }

    // Check if team is already registered for this season
    const { data: existingRegistration, error: checkError } = await (supabase as any)
      .from('season_teams')
      .select('id, status')
      .eq('season_id', activeSeason.id)
      .eq('team_id', teamId)
      .single();

    // If no error or PGRST116 (not found), continue
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking registration:', checkError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to check team registration status' 
        },
        { status: 500 }
      );
    }

    if (existingRegistration) {
      return NextResponse.json(
        { 
          success: false,
          error: `Team "${team.name}" is already registered for the ${activeSeason.display_name} season` 
        },
        { status: 400 }
      );
    }

    // Check if season has available spots
    if (activeSeason.max_teams) {
      const { data: registeredTeams, error: countError } = await (supabase as any)
        .from('season_teams')
        .select('id')
        .eq('season_id', activeSeason.id)
        .in('status', ['registered', 'confirmed']);

      if (!countError) {
        const currentTeams = registeredTeams?.length || 0;
        if (currentTeams >= activeSeason.max_teams) {
          return NextResponse.json(
            { 
              success: false,
              error: `The ${activeSeason.display_name} season is full (${currentTeams}/${activeSeason.max_teams} teams)` 
            },
            { status: 400 }
          );
        }
      }
    }

    // Register team for the season using SeasonService
    const registrationResult = await seasonService.registerTeamForSeason(activeSeason.id, teamId);

    if (!registrationResult.success) {
      // Handle specific error cases
      if (registrationResult.error?.code === 'ALREADY_REGISTERED') {
        return NextResponse.json(
          { 
            success: false,
            error: `Team "${team.name}" is already registered for this season` 
          },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { 
          success: false,
          error: registrationResult.error?.message || 'Failed to register team for season' 
        },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      success: true,
      data: {
        team: team,
        league: league,
        season: activeSeason,
        registration: registrationResult.data,
        message: `Team "${team.name}" successfully joined "${league.name}" for the ${activeSeason.display_name} season`
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
        error: 'Failed to join league' 
      },
      { status: 500 }
    );
  }
}
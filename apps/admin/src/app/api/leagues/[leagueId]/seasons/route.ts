import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ leagueId: string }> }
) {
  try {
    console.log('[Seasons API] Starting GET request');
    
    const { leagueId } = await params;
    console.log('[Seasons API] Parameters resolved:', { leagueId });
    
    if (!leagueId) {
      console.log('[Seasons API] Missing league ID');
      return NextResponse.json(
        { 
          success: false,
          data: null,
          error: 'League ID is required' 
        },
        { status: 400 }
      );
    }

    // Validate UUID format (more lenient to accept all valid UUID formats)
    console.log('[Seasons API] Validating UUID format...');
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(leagueId)) {
      console.log('[Seasons API] Invalid UUID format:', leagueId);
      return NextResponse.json(
        { 
          success: false,
          data: null,
          error: 'Invalid league ID format. Expected UUID.' 
        },
        { status: 400 }
      );
    }
    
    console.log('[Seasons API] UUID validation passed');

    // Query seasons from Supabase production database
    console.log('[Seasons API] Querying seasons from Supabase for league:', leagueId);
    const supabase = createAdminClient();
    
    // Get seasons with team registration counts
    const { data: seasons, error: seasonsError } = await supabase
      .from('seasons')
      .select(`
        id, name, display_name, league_id, season_year, 
        start_date, end_date, is_current, is_active, status, 
        description, tournament_format, registration_deadline, 
        match_frequency, preferred_match_time, min_teams, max_teams,
        rounds, total_matches_planned, points_for_win, points_for_draw, 
        points_for_loss, allow_draws, home_away_balance, fixtures_status,
        fixtures_generated_at, rules, settings, metadata,
        created_at, updated_at, created_by, updated_by
      `)
      .eq('league_id', leagueId)
      .order('season_year', { ascending: false });
      
    if (seasonsError) {
      console.error('[Seasons API] Supabase query error:', seasonsError);
      throw new Error(`Failed to fetch seasons: ${seasonsError.message}`);
    }
    
    console.log('[Seasons API] Supabase query successful. Seasons count:', seasons?.length || 0);
    
    // Enhance seasons with team registration data
    const seasonsWithTeams = await Promise.all(
      (seasons || []).map(async (season: any) => {
        try {
          const { data: teamRegs, error: teamError } = await supabase
            .from('season_teams')
            .select(`
              team_id,
              status,
              registration_date,
              created_at,
              team:teams (
                id,
                name,
                team_color,
                currentPlayers:team_members(count)
              )
            `)
            .eq('season_id', season.id)
            .in('status', ['registered', 'confirmed']);

          if (teamError) {
            console.warn('[Seasons API] Team query failed for season:', season.id, teamError);
          }

          return {
            ...season,
            teams: teamRegs || [],
            registered_teams_count: teamRegs?.length || 0
          };
        } catch (error) {
          console.warn('[Seasons API] Failed to get teams for season:', season.id, error);
          return {
            ...season,
            teams: [],
            registered_teams_count: 0
          };
        }
      })
    );

    const response = NextResponse.json({
      success: true,
      data: seasonsWithTeams,
      error: null,
      message: 'Seasons retrieved successfully'
    });
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    console.log('[Seasons API] Request completed successfully');
    return response;
    
  } catch (error) {
    console.error('[Seasons API] Error occurred:', error);
    console.error('[Seasons API] Error details:', {
      leagueId: (await params).leagueId || 'unknown',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorType: typeof error,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Return proper error response
    const response = NextResponse.json({
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Internal server error',
      message: 'Failed to fetch seasons'
    }, { status: 500 });
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ leagueId: string }> }
) {
  try {
    const { leagueId } = await params;
    const body = await request.json();
    
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

    // Validate UUID format (more lenient to accept all valid UUID formats)
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

    const { name, start_date, end_date } = body;
    if (!name || !start_date || !end_date) {
      return NextResponse.json(
        { 
          success: false,
          data: null,
          error: 'Name, start_date, and end_date are required' 
        },
        { status: 400 }
      );
    }

    // Validate dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    if (startDate >= endDate) {
      return NextResponse.json(
        { success: false, error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Check if league exists  
    const supabase = createAdminClient();
    const { data: league, error: leagueError } = await supabase
      .from('leagues')
      .select('id, name')
      .eq('id', leagueId)
      .single();

    if (leagueError) {
      if (leagueError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'League not found' },
          { status: 404 }
        );
      }
      throw leagueError;
    }

    // Create the season
    const seasonData = {
      ...body,
      league_id: leagueId,
      season_year: body.season_year || new Date(start_date).getFullYear()
    };

    const { data: newSeason, error: createError } = await supabase
      .from('seasons')
      .insert(seasonData)
      .select()
      .single();

    if (createError) {
      if (createError.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { success: false, error: 'A season with this year already exists for this league' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { 
          success: false,
          data: null,
          error: createError.message || 'Failed to create season' 
        },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      success: true,
      data: newSeason,
      error: null,
      message: 'Season created successfully'
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
        error: 'Failed to create season' 
      },
      { status: 500 }
    );
  }
}
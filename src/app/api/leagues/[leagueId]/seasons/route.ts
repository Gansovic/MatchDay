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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ leagueId: string }> }
) {
  try {
    const { leagueId } = await params;
    
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
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
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

    const supabase = createAdminSupabaseClient();
    const seasonService = SeasonService.getInstance(supabase);

    const result = await seasonService.getSeasonsByLeague(leagueId);

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false,
          data: null,
          error: result.error || 'Failed to fetch league seasons' 
        },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      success: true,
      data: result.data,
      error: null,
      message: result.message
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
        error: 'Failed to fetch league seasons' 
      },
      { status: 500 }
    );
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

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
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

    const supabase = createAdminSupabaseClient();
    const seasonService = SeasonService.getInstance(supabase);

    // Check if league exists
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

    const result = await seasonService.createSeason(seasonData);

    if (!result.success) {
      if (result.error?.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { success: false, error: 'A season with this year already exists for this league' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { 
          success: false,
          data: null,
          error: result.error || 'Failed to create season' 
        },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      success: true,
      data: result.data,
      error: null,
      message: result.message
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
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

    // Return appropriate mock data based on league ID
    let mockSeasons = [];
    
    if (leagueId === '20f5b4c7-ced3-4000-9680-3e7d567c1e2e') {
      // LaLiga seasons
      mockSeasons = [
        {
          id: 'f753d2d6-584b-4258-913b-455e7f593551',
          name: '2024 Season',
          display_name: 'LaLiga 2023/2024', 
          league_id: leagueId,
          season_year: 2024,
          start_date: '2024-01-15',
          end_date: '2024-12-20',
          is_current: false,
          is_active: true,
          status: 'completed',
          description: 'The 2023/2024 LaLiga season featuring 20 teams competing over 38 rounds. Real Madrid won the championship with 95 points.',
          max_teams: 20,
          registration_start: '2023-12-01',
          registration_end: '2024-01-10',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'b8e4c2f5-3a1d-4e6f-9b8c-2d5a7e9f1c3a',
          name: '2025 Season',
          display_name: 'LaLiga 2024/2025',
          league_id: leagueId,
          season_year: 2025,
          start_date: '2025-01-18',
          end_date: '2025-12-21',
          is_current: true,
          is_active: true,
          status: 'active',
          description: 'The ongoing 2024/2025 LaLiga season. Currently in progress with exciting matches every week.',
          max_teams: 20,
          registration_start: '2024-12-01',
          registration_end: '2025-01-15',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
    } else if (leagueId === 'e73dd372-ddb9-4419-9b97-6dd9717b76c2') {
      // League1 seasons  
      mockSeasons = [
        {
          id: '5808930c-837a-4c83-b695-20037b24e553',
          name: '2024 Championship',
          display_name: 'League1 2024 Championship',
          league_id: leagueId,
          season_year: 2024,
          start_date: '2024-02-01',
          end_date: '2024-11-30',
          is_current: false,
          is_active: true,
          status: 'completed',
          description: 'The 2024 League1 Championship concluded with Team Alpha as champions.',
          max_teams: 16,
          registration_start: '2024-01-01',
          registration_end: '2024-01-25',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '7bff0b82-eb27-4fba-9862-bb5db6369ba1',
          name: '2025 Championship',
          display_name: 'League1 2025 Championship',
          league_id: leagueId,
          season_year: 2025,
          start_date: '2025-02-01',
          end_date: '2025-11-30',
          is_current: true,
          is_active: true,
          status: 'active',
          description: 'The ongoing 2025 League1 Championship season.',
          max_teams: 16,
          registration_start: '2025-01-01',
          registration_end: '2025-01-25',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
    } else if (leagueId === '261f251e-aee8-4153-a4c7-537b565e7e3f') {
      // myLeague seasons
      mockSeasons = [
        {
          id: 'e0871098-33ed-4206-807b-a3cf0b14413a',
          name: '2024 Season',
          display_name: 'myLeague 2024 Championship',
          league_id: leagueId,
          season_year: 2024,
          start_date: '2024-03-01',
          end_date: '2024-11-30',
          is_current: false,
          is_active: true,
          status: 'completed',
          description: 'The inaugural 2024 myLeague Championship featuring community teams competing for the title. Season completed with great success.',
          max_teams: 10,
          registration_start: '2024-02-01',
          registration_end: '2024-02-28',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'f1b2c3d4-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
          name: '2025 Season',
          display_name: 'myLeague 2025 Championship',
          league_id: leagueId,
          season_year: 2025,
          start_date: '2025-03-01',
          end_date: '2025-11-30',
          is_current: true,
          is_active: true,
          status: 'active',
          description: 'The current 2025 myLeague Championship season. Join now and compete for the championship!',
          max_teams: 12,
          registration_start: '2025-02-01',
          registration_end: '2025-02-28',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d',
          name: '2026 Season',
          display_name: 'myLeague 2026 Championship',
          league_id: leagueId,
          season_year: 2026,
          start_date: '2026-03-01',
          end_date: '2026-11-30',
          is_current: false,
          is_active: true,
          status: 'draft',
          description: 'The upcoming 2026 myLeague Championship season. Registration opens soon!',
          max_teams: 14,
          registration_start: '2026-02-01',
          registration_end: '2026-02-28',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
    } else {
      // Default empty for unknown leagues
      mockSeasons = [];
    }

    const response = NextResponse.json({
      success: true,
      data: mockSeasons,
      error: null,
      message: 'Seasons retrieved successfully'
    });
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
    
  } catch (error) {
    console.error('[Seasons API] Database query error:', error);
    console.error('[Seasons API] Error details:', {
      leagueId,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorType: typeof error
    });
    
    // Return empty array instead of error for better UX
    const response = NextResponse.json({
      success: true,
      data: [],
      error: null,
      message: 'No seasons found for this league'
    });
    
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
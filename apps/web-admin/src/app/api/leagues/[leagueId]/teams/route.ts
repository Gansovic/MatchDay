import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

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
    
    // Get current season for this league
    const { data: currentSeason, error: seasonError } = await supabase
      .from('seasons')
      .select('id')
      .eq('league_id', leagueId)
      .eq('is_current', true)
      .single();

    if (seasonError && seasonError.code !== 'PGRST116') {
      console.error('Season query error:', seasonError);
      return NextResponse.json(
        { 
          success: false,
          data: null,
          error: 'Failed to fetch current season' 
        },
        { status: 500 }
      );
    }

    let teams = [];

    if (currentSeason) {
      // Get teams registered for the current season
      const { data: seasonTeams, error: teamsError } = await supabase
        .from('season_teams')
        .select(`
          registration_date,
          status,
          team:teams (
            id,
            name,
            team_color,
            captain_id,
            is_recruiting,
            created_at,
            updated_at
          )
        `)
        .eq('season_id', currentSeason.id)
        .in('status', ['registered', 'confirmed'])
        .order('registration_date', { ascending: true });

      if (teamsError) {
        console.error('Teams query error:', teamsError);
        return NextResponse.json(
          { 
            success: false,
            data: null,
            error: 'Failed to fetch teams' 
          },
          { status: 500 }
        );
      }

      // Extract and format teams
      teams = (seasonTeams || [])
        .map(st => st.team ? {
          ...st.team,
          league_id: leagueId, // For backward compatibility
          registration_date: st.registration_date,
          registration_status: st.status
        } : null)
        .filter(Boolean);
    }

    const response = NextResponse.json({
      success: true,
      data: teams,
      error: null,
      season_id: currentSeason?.id || null
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
}
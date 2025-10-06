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
      // Build the Supabase query
      let query = supabase
        .from('matches')
        .select(`
          id,
          season_id,
          home_team_id,
          away_team_id,
          match_date,
          venue,
          status,
          home_score,
          away_score,
          created_at,
          updated_at,
          home_team:home_team_id(id, name),
          away_team:away_team_id(id, name),
          seasons!inner(
            league_id,
            name,
            display_name
          )
        `)
        .eq('seasons.league_id', leagueId);

      // Filter by season if provided
      if (seasonId) {
        query = query.eq('season_id', seasonId);
      }
      
      query = query.order('match_date', { ascending: false });

      const { data: matchesResult, error: matchesError } = await query;

      if (matchesError) {
        throw new Error(`Failed to fetch matches: ${matchesError.message}`);
      }

      const matches = (matchesResult || []).map((match: any) => ({
        id: match.id,
        season_id: match.season_id,
        home_team_id: match.home_team_id,
        home_team_name: match.home_team?.name || 'Unknown Team',
        away_team_id: match.away_team_id,
        away_team_name: match.away_team?.name || 'Unknown Team',
        home_score: match.home_score,
        away_score: match.away_score,
        status: match.status,
        match_date: match.match_date,
        // Add date field for dashboard compatibility
        date: match.match_date,
        venue: match.venue,
        created_at: match.created_at,
        updated_at: match.updated_at,
        // Add team objects for dashboard compatibility
        home_team: {
          id: match.home_team_id,
          name: match.home_team?.name || 'Unknown Team'
        },
        away_team: {
          id: match.away_team_id,
          name: match.away_team?.name || 'Unknown Team'
        },
        // Season and league info derived through season relationship
        league_id: match.seasons?.league_id,
        season_name: match.seasons?.name,
        season_display_name: match.seasons?.display_name
      }));

      const response = NextResponse.json({
        success: true,
        data: matches,
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
          error: 'Failed to fetch league matches' 
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
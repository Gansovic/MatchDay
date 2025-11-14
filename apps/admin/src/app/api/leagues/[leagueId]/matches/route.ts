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
      // If seasonId is provided, we need to get matches through the fixtures table
      let query;

      if (seasonId) {
        // Query through fixtures to get season-specific matches
        query = supabase
          .from('fixtures')
          .select(`
            match_id,
            matches:match_id(
              id,
              league_id,
              home_team_id,
              away_team_id,
              scheduled_date,
              venue,
              status,
              home_score,
              away_score,
              match_day,
              created_at,
              updated_at,
              home_team:home_team_id(id, name),
              away_team:away_team_id(id, name)
            )
          `)
          .eq('season_id', seasonId)
          .not('match_id', 'is', null);
      } else {
        // Query matches directly by league_id
        query = supabase
          .from('matches')
          .select(`
            id,
            league_id,
            home_team_id,
            away_team_id,
            scheduled_date,
            venue,
            status,
            home_score,
            away_score,
            match_day,
            created_at,
            updated_at,
            home_team:home_team_id(id, name),
            away_team:away_team_id(id, name)
          `)
          .eq('league_id', leagueId);
      }

      query = query.order('scheduled_date', { ascending: false });

      const { data: matchesResult, error: matchesError } = await query;

      if (matchesError) {
        throw new Error(`Failed to fetch matches: ${matchesError.message}`);
      }

      // Handle different response formats based on whether we queried through fixtures or directly
      const matches = (matchesResult || [])
        .map((item: any) => {
          // If we queried through fixtures, the match data is nested
          const match = seasonId ? item.matches : item;
          if (!match) return null;

          return {
            id: match.id,
            league_id: match.league_id,
            home_team_id: match.home_team_id,
            home_team_name: match.home_team?.name || 'Unknown Team',
            away_team_id: match.away_team_id,
            away_team_name: match.away_team?.name || 'Unknown Team',
            home_score: match.home_score,
            away_score: match.away_score,
            status: match.status,
            scheduled_date: match.scheduled_date,
            match_day: match.match_day,
            // Add date field for dashboard compatibility
            date: match.scheduled_date,
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
            }
          };
        })
        .filter(Boolean); // Remove any null entries

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
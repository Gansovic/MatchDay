import { NextRequest, NextResponse } from 'next/server';
import DirectDatabaseService from '@/lib/database/direct-db.service';

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

    const dbService = DirectDatabaseService.getInstance();
    const client = await dbService['pool'].connect();
    
    try {
      let query = `
        SELECT 
          m.id,
          m.league_id,
          m.season_id,
          m.home_team_id,
          m.away_team_id,
          m.match_date,
          m.venue,
          m.status,
          m.home_score,
          m.away_score,
          m.created_at,
          m.updated_at,
          ht.name as home_team_name,
          at.name as away_team_name
        FROM matches m
        JOIN teams ht ON m.home_team_id = ht.id
        JOIN teams at ON m.away_team_id = at.id
        WHERE m.league_id = $1
      `;
      
      const queryParams = [leagueId];
      
      // Filter by season if provided
      if (seasonId) {
        query += ' AND m.season_id = $2';
        queryParams.push(seasonId);
      }
      
      query += ' ORDER BY m.match_date DESC';

      const matchesResult = await client.query(query, queryParams);

      const matches = matchesResult.rows.map(match => ({
        id: match.id,
        league_id: match.league_id,
        season_id: match.season_id,
        home_team_id: match.home_team_id,
        home_team_name: match.home_team_name || 'Unknown Team',
        away_team_id: match.away_team_id,
        away_team_name: match.away_team_name || 'Unknown Team',
        home_score: match.home_score,
        away_score: match.away_score,
        status: match.status,
        match_date: match.match_date,
        venue: match.venue,
        created_at: match.created_at,
        updated_at: match.updated_at
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
      
    } finally {
      client.release();
    }
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
}
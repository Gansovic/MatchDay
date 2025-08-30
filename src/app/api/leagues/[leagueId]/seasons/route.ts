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

    const dbService = DirectDatabaseService.getInstance();
    const client = await dbService['pool'].connect();
    
    try {
      // Get seasons for this league
      const seasonsResult = await client.query(`
        SELECT 
          s.*,
          COUNT(DISTINCT m.id) as total_matches,
          COUNT(DISTINCT CASE WHEN m.status = 'completed' THEN m.id END) as completed_matches,
          COUNT(DISTINCT CASE WHEN m.status = 'scheduled' THEN m.id END) as scheduled_matches,
          COUNT(DISTINCT t.id) as registered_teams
        FROM seasons s
        LEFT JOIN matches m ON s.id = m.season_id
        LEFT JOIN teams t ON s.league_id = t.league_id
        WHERE s.league_id = $1 AND s.is_active = true
        GROUP BY s.id
        ORDER BY s.is_current DESC, s.start_date DESC
      `, [leagueId]);

      const seasons = seasonsResult.rows.map(season => ({
        id: season.id,
        name: season.name,
        display_name: season.display_name,
        start_date: season.start_date,
        end_date: season.end_date,
        is_current: season.is_current,
        is_active: season.is_active,
        league_id: season.league_id,
        description: season.description,
        max_teams: season.max_teams,
        registration_start: season.registration_start,
        registration_end: season.registration_end,
        created_at: season.created_at,
        updated_at: season.updated_at,
        stats: {
          total_matches: parseInt(season.total_matches) || 0,
          completed_matches: parseInt(season.completed_matches) || 0,
          scheduled_matches: parseInt(season.scheduled_matches) || 0,
          registered_teams: parseInt(season.registered_teams) || 0
        }
      }));

      const response = NextResponse.json({
        success: true,
        data: seasons,
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
    
    const { 
      name, 
      display_name, 
      start_date, 
      end_date, 
      is_current = false,
      description, 
      max_teams,
      registration_start,
      registration_end 
    } = body;

    if (!leagueId || !name || !start_date || !end_date) {
      return NextResponse.json(
        { 
          success: false,
          data: null,
          error: 'League ID, name, start_date, and end_date are required' 
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

    const dbService = DirectDatabaseService.getInstance();
    const client = await dbService['pool'].connect();
    
    try {
      // Start transaction
      await client.query('BEGIN');

      // If this is set as current season, unset other current seasons for this league
      if (is_current) {
        await client.query(`
          UPDATE seasons 
          SET is_current = false, updated_at = CURRENT_TIMESTAMP
          WHERE league_id = $1 AND is_current = true
        `, [leagueId]);
      }

      // Create new season
      const seasonResult = await client.query(`
        INSERT INTO seasons (
          league_id, name, display_name, start_date, end_date, 
          is_current, description, max_teams, registration_start, registration_end
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `, [
        leagueId, name, display_name, start_date, end_date,
        is_current, description, max_teams, registration_start, registration_end
      ]);

      // Commit transaction
      await client.query('COMMIT');

      const newSeason = {
        ...seasonResult.rows[0],
        stats: {
          total_matches: 0,
          completed_matches: 0,
          scheduled_matches: 0,
          registered_teams: 0
        }
      };

      const response = NextResponse.json({
        success: true,
        data: newSeason,
        error: null
      });
      
      // Add CORS headers
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      return response;
      
    } catch (dbError) {
      await client.query('ROLLBACK');
      throw dbError;
    } finally {
      client.release();
    }
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
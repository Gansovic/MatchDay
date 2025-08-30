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
  { params }: { params: Promise<{ seasonId: string }> }
) {
  try {
    const { seasonId } = await params;
    
    if (!seasonId) {
      return NextResponse.json(
        { 
          success: false,
          data: null,
          error: 'Season ID is required' 
        },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(seasonId)) {
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
      // Get season details with league info and stats
      const seasonResult = await client.query(`
        SELECT 
          s.*,
          l.name as league_name,
          l.sport_type,
          COUNT(DISTINCT m.id) as total_matches,
          COUNT(DISTINCT CASE WHEN m.status = 'completed' THEN m.id END) as completed_matches,
          COUNT(DISTINCT CASE WHEN m.status = 'scheduled' THEN m.id END) as scheduled_matches,
          COUNT(DISTINCT t.id) as registered_teams
        FROM seasons s
        JOIN leagues l ON s.league_id = l.id
        LEFT JOIN matches m ON s.id = m.season_id
        LEFT JOIN teams t ON s.league_id = t.league_id
        WHERE s.id = $1 AND s.is_active = true
        GROUP BY s.id, l.name, l.sport_type
      `, [seasonId]);

      if (seasonResult.rows.length === 0) {
        return NextResponse.json(
          { 
            success: false,
            data: null,
            error: 'Season not found' 
          },
          { status: 404 }
        );
      }

      const season = seasonResult.rows[0];
      const seasonData = {
        id: season.id,
        name: season.name,
        display_name: season.display_name,
        start_date: season.start_date,
        end_date: season.end_date,
        is_current: season.is_current,
        is_active: season.is_active,
        league_id: season.league_id,
        league_name: season.league_name,
        sport_type: season.sport_type,
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
      };

      const response = NextResponse.json({
        success: true,
        data: seasonData,
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
        error: 'Failed to fetch season details' 
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ seasonId: string }> }
) {
  try {
    const { seasonId } = await params;
    const body = await request.json();
    
    if (!seasonId) {
      return NextResponse.json(
        { 
          success: false,
          data: null,
          error: 'Season ID is required' 
        },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(seasonId)) {
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
      // Start transaction
      await client.query('BEGIN');

      // Get current season data
      const currentSeason = await client.query(
        'SELECT league_id, is_current FROM seasons WHERE id = $1',
        [seasonId]
      );

      if (currentSeason.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { 
            success: false,
            data: null,
            error: 'Season not found' 
          },
          { status: 404 }
        );
      }

      const leagueId = currentSeason.rows[0].league_id;

      // If setting as current season, unset other current seasons for this league
      if (body.is_current && !currentSeason.rows[0].is_current) {
        await client.query(`
          UPDATE seasons 
          SET is_current = false, updated_at = CURRENT_TIMESTAMP
          WHERE league_id = $1 AND is_current = true AND id != $2
        `, [leagueId, seasonId]);
      }

      // Build update query dynamically
      const updateFields = [];
      const updateValues = [];
      let paramCount = 1;

      const allowedFields = [
        'name', 'display_name', 'start_date', 'end_date', 'is_current',
        'description', 'max_teams', 'registration_start', 'registration_end'
      ];

      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          updateFields.push(`${field} = $${paramCount + 1}`);
          updateValues.push(body[field]);
          paramCount++;
        }
      }

      if (updateFields.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { 
            success: false,
            data: null,
            error: 'No valid fields to update' 
          },
          { status: 400 }
        );
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

      const updateQuery = `
        UPDATE seasons 
        SET ${updateFields.join(', ')}
        WHERE id = $1
        RETURNING *
      `;

      const updateResult = await client.query(updateQuery, [seasonId, ...updateValues]);

      // Commit transaction
      await client.query('COMMIT');

      const response = NextResponse.json({
        success: true,
        data: updateResult.rows[0],
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
        error: 'Failed to update season' 
      },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import DirectDatabaseService from '@/lib/database/direct-db.service';

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
    
    if (!teamId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Team ID is required' 
        },
        { status: 400 }
      );
    }

    const dbService = DirectDatabaseService.getInstance();
    const client = await dbService['pool'].connect();
    
    try {
      // Start transaction
      await client.query('BEGIN');

      // Check if team exists and is in a league
      const teamResult = await client.query(`
        SELECT t.id, t.name, t.league_id, l.name as league_name
        FROM teams t
        LEFT JOIN leagues l ON t.league_id = l.id
        WHERE t.id = $1
      `, [teamId]);

      if (teamResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { 
            success: false,
            error: 'Team not found' 
          },
          { status: 404 }
        );
      }

      const team = teamResult.rows[0];

      if (!team.league_id) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { 
            success: false,
            error: 'Team is not in any league' 
          },
          { status: 400 }
        );
      }

      const leagueName = team.league_name;

      // Update team to leave league
      const updateResult = await client.query(`
        UPDATE teams 
        SET league_id = NULL, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `, [teamId]);

      // Commit transaction
      await client.query('COMMIT');

      const response = NextResponse.json({
        success: true,
        data: {
          team: updateResult.rows[0],
          message: `Team "${team.name}" successfully left "${leagueName}"`
        },
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
        error: 'Failed to leave league' 
      },
      { status: 500 }
    );
  }
}
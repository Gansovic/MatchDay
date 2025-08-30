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
    const { leagueId } = await request.json();
    
    if (!teamId || !leagueId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Team ID and League ID are required' 
        },
        { status: 400 }
      );
    }

    const dbService = DirectDatabaseService.getInstance();
    const client = await dbService['pool'].connect();
    
    try {
      // Start transaction
      await client.query('BEGIN');

      // Check if team exists and is not already in a league
      const teamResult = await client.query(`
        SELECT id, name, league_id, captain_id
        FROM teams 
        WHERE id = $1
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

      if (team.league_id) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { 
            success: false,
            error: 'Team is already in a league' 
          },
          { status: 400 }
        );
      }

      // Check if league exists and is active
      const leagueResult = await client.query(`
        SELECT id, name, max_teams, is_active, is_public
        FROM leagues 
        WHERE id = $1 AND is_active = true
      `, [leagueId]);

      if (leagueResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { 
            success: false,
            error: 'League not found or inactive' 
          },
          { status: 404 }
        );
      }

      const league = leagueResult.rows[0];

      // Check if league has available spots
      if (league.max_teams) {
        const teamCountResult = await client.query(`
          SELECT COUNT(*) as current_teams
          FROM teams
          WHERE league_id = $1
        `, [leagueId]);

        const currentTeams = parseInt(teamCountResult.rows[0].current_teams);
        
        if (currentTeams >= league.max_teams) {
          await client.query('ROLLBACK');
          return NextResponse.json(
            { 
              success: false,
              error: 'League is full' 
            },
            { status: 400 }
          );
        }
      }

      // Update team to join league
      const updateResult = await client.query(`
        UPDATE teams 
        SET league_id = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `, [leagueId, teamId]);

      // Commit transaction
      await client.query('COMMIT');

      const response = NextResponse.json({
        success: true,
        data: {
          team: updateResult.rows[0],
          league: league,
          message: `Team "${team.name}" successfully joined "${league.name}"`
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
        error: 'Failed to join league' 
      },
      { status: 500 }
    );
  }
}
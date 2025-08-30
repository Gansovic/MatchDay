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
      // Get league details
      const leagueResult = await client.query(`
        SELECT 
          l.*,
          COUNT(DISTINCT t.id) as team_count,
          COUNT(DISTINCT tm.id) FILTER (WHERE tm.is_active = true) as player_count
        FROM leagues l
        LEFT JOIN teams t ON l.id = t.league_id
        LEFT JOIN team_members tm ON t.id = tm.team_id AND tm.is_active = true
        WHERE l.id = $1 AND l.is_active = true
        GROUP BY l.id
      `, [leagueId]);

      if (leagueResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'League not found' },
          { status: 404 }
        );
      }

      const league = leagueResult.rows[0];

      // Get teams in the league
      const teamsResult = await client.query(`
        SELECT 
          t.*,
          COUNT(tm.id) FILTER (WHERE tm.is_active = true) as current_players,
          u.email as captain_email
        FROM teams t
        LEFT JOIN team_members tm ON t.id = tm.team_id AND tm.is_active = true
        LEFT JOIN users u ON t.captain_id = u.id
        WHERE t.league_id = $1
        GROUP BY t.id, u.email
        ORDER BY t.name
      `, [leagueId]);

      // Calculate available spots
      const availableSpots = teamsResult.rows.reduce((total, team) => {
        const maxPlayers = team.max_players || 11;
        const currentPlayers = parseInt(team.current_players) || 0;
        return total + Math.max(0, maxPlayers - currentPlayers);
      }, 0);

      const leagueDetails = {
        ...league,
        teams: teamsResult.rows.map(team => ({
          id: team.id,
          name: team.name,
          team_color: team.team_color,
          captain_id: team.captain_id,
          captain_email: team.captain_email,
          max_players: team.max_players,
          min_players: team.min_players,
          is_recruiting: team.is_recruiting,
          current_players: parseInt(team.current_players) || 0,
          created_at: team.created_at
        })),
        teamCount: parseInt(league.team_count) || 0,
        playerCount: parseInt(league.player_count) || 0,
        availableSpots
      };

      const response = NextResponse.json({
        success: true,
        data: leagueDetails,
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
        error: 'Failed to fetch league details' 
      },
      { status: 500 }
    );
  }
}
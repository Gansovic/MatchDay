/**
 * User Teams API Route
 * 
 * GET /api/user/teams - Get team memberships for the authenticated user
 */

import { NextRequest, NextResponse } from 'next/server';
import DirectDatabaseService from '@/lib/database/direct-db.service';
import jwt from 'jsonwebtoken';

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export async function GET(request: NextRequest) {
  try {
    // Development mode: Use a default user if no proper auth
    let userId: string = 'eec00b4f-7e94-4d76-8f2a-7364b49d1c86'; // Default to player@matchday.com
    
    if (process.env.NODE_ENV === 'production') {
      // Only enforce JWT in production
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Authentication required' },
          { status: 401 }
        );
      }

      const token = authHeader.replace('Bearer ', '');
      
      // Verify JWT token manually and extract user info
      try {
        const jwtSecret = process.env.SUPABASE_JWT_SECRET || 'jUZj2O0d4B9nxxsU6p7xN3x81z9UGdY/lqbfIlUKb/Q=';
        const decoded = jwt.verify(token, jwtSecret) as any;
        userId = decoded.sub;
      } catch (jwtError) {
        return NextResponse.json(
          { error: 'Invalid token', message: 'JWT verification failed' },
          { status: 401 }
        );
      }
    } else {
      console.log('🧪 Development mode: Using default user for user teams API');
    }

    const dbService = DirectDatabaseService.getInstance();
    const client = await dbService['pool'].connect();
    
    try {
      // Get user's team memberships with team details and league info
      const result = await client.query(`
        SELECT 
          tm.id as membership_id,
          tm.user_id,
          tm.team_id,
          tm.position,
          tm.jersey_number,
          tm.joined_at,
          tm.is_active,
          t.id as team_id,
          t.name as team_name,
          t.captain_id,
          t.league_id,
          t.max_players,
          t.team_color,
          t.created_at as team_created_at,
          l.id as league_id,
          l.name as league_name,
          l.description as league_description
        FROM team_members tm
        JOIN teams t ON tm.team_id = t.id
        LEFT JOIN leagues l ON t.league_id = l.id
        WHERE tm.user_id = $1 AND tm.is_active = true
        ORDER BY tm.joined_at DESC
      `, [userId]);

      // Get player stats for this user across all teams
      const statsResult = await client.query(`
        SELECT 
          team_id,
          goals,
          assists,
          minutes_played
        FROM player_stats 
        WHERE user_id = $1
      `, [userId]);

      // Process the data to match expected format
      const teams = result.rows.map(row => {
        // Calculate stats for this team
        const teamStats = statsResult.rows.filter(stat => stat.team_id === row.team_id);
        const aggregatedStats = teamStats.length > 0 ? {
          goals: teamStats.reduce((sum, s) => sum + (s.goals || 0), 0),
          assists: teamStats.reduce((sum, s) => sum + (s.assists || 0), 0),
          matches: teamStats.length
        } : undefined;

        return {
          team: {
            id: row.team_id,
            name: row.team_name,
            league: row.league_id ? {
              id: row.league_id,
              name: row.league_name,
              description: row.league_description
            } : null,
            captain_id: row.captain_id,
            memberCount: 0, // Will be calculated if needed
            availableSpots: 0 // Will be calculated if needed
          },
          role: row.captain_id === userId ? 'captain' : 'member',
          position: row.position,
          jerseyNumber: row.jersey_number,
          joinedAt: row.joined_at,
          stats: aggregatedStats
        };
      });
      
      const response = NextResponse.json({
        teams,
        count: result.rowCount
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
    console.error('User teams API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user teams' },
      { status: 500 }
    );
  }
}
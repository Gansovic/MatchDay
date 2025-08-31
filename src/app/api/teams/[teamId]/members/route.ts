/**
 * Team Members API Route
 * 
 * GET /api/teams/[teamId]/members - Get team members for a specific team
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    
    if (!teamId) {
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      );
    }

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
      console.log('🧪 Development mode: Using default user for team members API');
    }

    const dbService = DirectDatabaseService.getInstance();
    const client = await dbService['pool'].connect();
    
    try {
      // First verify the team exists and get captain info
      const teamResult = await client.query(`
        SELECT id, name, captain_id
        FROM teams 
        WHERE id = $1
      `, [teamId]);

      if (teamResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Team not found' },
          { status: 404 }
        );
      }

      const team = teamResult.rows[0];

      // Get team members with user details
      const membersResult = await client.query(`
        SELECT 
          tm.id,
          tm.user_id,
          tm.team_id,
          tm.position,
          tm.jersey_number,
          tm.joined_at,
          tm.is_active,
          u.email,
          u.full_name
        FROM team_members tm
        JOIN users u ON tm.user_id = u.id
        WHERE tm.team_id = $1 AND tm.is_active = true
        ORDER BY tm.joined_at ASC
      `, [teamId]);

      // Get player stats for all team members
      const statsResult = await client.query(`
        SELECT 
          user_id,
          COUNT(*) as matches_played,
          SUM(goals) as goals,
          SUM(assists) as assists,
          SUM(yellow_cards) as yellow_cards,
          SUM(red_cards) as red_cards,
          SUM(minutes_played) as minutes_played
        FROM player_stats 
        WHERE user_id = ANY($1::uuid[])
        GROUP BY user_id
      `, [membersResult.rows.map(row => row.user_id)]);

      // Create stats lookup map
      const statsMap = new Map();
      statsResult.rows.forEach(stat => {
        statsMap.set(stat.user_id, {
          matches_played: parseInt(stat.matches_played) || 0,
          goals: parseInt(stat.goals) || 0,
          assists: parseInt(stat.assists) || 0,
          yellow_cards: parseInt(stat.yellow_cards) || 0,
          red_cards: parseInt(stat.red_cards) || 0,
          minutes_played: parseInt(stat.minutes_played) || 0
        });
      });

      // Format the response to match the TeamMember interface
      const members = membersResult.rows.map(row => ({
        id: row.id,
        user_id: row.user_id,
        team_id: row.team_id,
        email: row.email,
        full_name: row.full_name,
        position: row.position,
        jersey_number: row.jersey_number,
        joined_at: row.joined_at,
        is_active: row.is_active,
        is_captain: row.user_id === team.captain_id,
        stats: statsMap.get(row.user_id) || {
          matches_played: 0,
          goals: 0,
          assists: 0,
          yellow_cards: 0,
          red_cards: 0,
          minutes_played: 0
        }
      }));

      const response = NextResponse.json({
        data: members,
        count: members.length,
        team: {
          id: team.id,
          name: team.name,
          captain_id: team.captain_id
        }
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
    console.error('Team members API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    );
  }
}
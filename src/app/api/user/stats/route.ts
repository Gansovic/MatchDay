/**
 * User Stats API Route
 * 
 * GET /api/user/stats - Get dashboard statistics for the authenticated user
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
      console.log('🧪 Development mode: Using default user for user stats API');
    }

    const dbService = DirectDatabaseService.getInstance();
    const client = await dbService['pool'].connect();
    
    try {
      // Get user's team memberships count
      const teamMembershipsResult = await client.query(`
        SELECT COUNT(*) as teams_count
        FROM team_members 
        WHERE user_id = $1 AND is_active = true
      `, [userId]);

      // Get user's player stats
      const playerStatsResult = await client.query(`
        SELECT 
          goals,
          assists,
          minutes_played
        FROM player_stats 
        WHERE user_id = $1
      `, [userId]);

      // Get unique leagues the user participates in
      const leaguesResult = await client.query(`
        SELECT COUNT(DISTINCT t.league_id) as leagues_count
        FROM team_members tm
        JOIN teams t ON tm.team_id = t.id
        WHERE tm.user_id = $1 AND tm.is_active = true AND t.league_id IS NOT NULL
      `, [userId]);

      // Calculate aggregated stats
      const playerStats = playerStatsResult.rows;
      const totalMatches = playerStats.length;
      const totalGoals = playerStats.reduce((sum, s) => sum + (s.goals || 0), 0);
      const totalAssists = playerStats.reduce((sum, s) => sum + (s.assists || 0), 0);
      
      // For now, calculate win rate as 0 until we have match results data
      const winRate = 0; // TODO: Calculate from match results when available
      
      // Upcoming matches placeholder
      const upcomingMatches = 0; // TODO: Calculate from scheduled matches
      
      const dashboardStats = {
        matchesPlayed: totalMatches,
        teamsJoined: parseInt(teamMembershipsResult.rows[0]?.teams_count || '0'),
        upcomingMatches,
        winRate,
        goalsScored: totalGoals,
        assists: totalAssists,
        leaguesParticipated: parseInt(leaguesResult.rows[0]?.leagues_count || '0')
      };

      // Calculate performance analysis
      let performance = null;
      if (playerStats.length > 0) {
        performance = {
          overallRating: totalMatches > 0 ? Math.min(95, 70 + (totalGoals + totalAssists) * 2) : 70,
          strengths: [
            totalGoals > 3 ? 'Goal Scoring' : null,
            totalAssists > 2 ? 'Playmaking' : null,
            totalMatches > 5 ? 'Consistency' : null
          ].filter((s): s is string => s !== null),
          totalGoals,
          totalAssists,
          totalMatches
        };
      }

      const response = NextResponse.json({
        stats: dashboardStats,
        performance
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
    console.error('User stats API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user stats' },
      { status: 500 }
    );
  }
}
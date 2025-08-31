/**
 * Team Details API Route
 * 
 * GET /api/teams/[teamId] - Get comprehensive team information including stats
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
      console.log('🧪 Development mode: Using default user for team details API');
    }

    const dbService = DirectDatabaseService.getInstance();
    const client = await dbService['pool'].connect();
    
    try {
      // Get team details with league info
      const teamResult = await client.query(`
        SELECT 
          t.id,
          t.name,
          t.team_color,
          t.team_bio,
          t.founded_year,
          t.location,
          t.max_players,
          t.min_players,
          t.captain_id,
          t.created_at,
          l.id as league_id,
          l.name as league_name,
          l.description as league_description
        FROM teams t
        LEFT JOIN leagues l ON t.league_id = l.id
        WHERE t.id = $1
      `, [teamId]);

      if (teamResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Team not found' },
          { status: 404 }
        );
      }

      const team = teamResult.rows[0];

      // Get team member count
      const memberCountResult = await client.query(`
        SELECT COUNT(*) as count
        FROM team_members 
        WHERE team_id = $1 AND is_active = true
      `, [teamId]);

      const memberCount = parseInt(memberCountResult.rows[0].count) || 0;

      // Get aggregated team statistics from player_stats
      const statsResult = await client.query(`
        SELECT 
          COUNT(ps.id) as total_matches,
          SUM(ps.goals) as total_goals,
          SUM(ps.assists) as total_assists,
          SUM(ps.minutes_played) as total_minutes
        FROM player_stats ps
        JOIN team_members tm ON ps.user_id = tm.user_id
        WHERE tm.team_id = $1 AND tm.is_active = true
      `, [teamId]);

      const stats = statsResult.rows[0];

      // Get team match history
      const matchesResult = await client.query(`
        SELECT 
          m.id,
          m.match_date,
          m.venue,
          m.status,
          m.home_score,
          m.away_score,
          ht.name as home_team_name,
          at.name as away_team_name,
          (m.home_team_id = $1) as is_home
        FROM matches m
        JOIN teams ht ON m.home_team_id = ht.id
        JOIN teams at ON m.away_team_id = at.id
        WHERE (m.home_team_id = $1 OR m.away_team_id = $1)
        ORDER BY m.match_date DESC
      `, [teamId]);

      // Calculate win/loss/draw record
      let wins = 0, draws = 0, losses = 0;
      const recentMatches = [];
      const upcomingMatches = [];
      
      matchesResult.rows.forEach(match => {
        if (match.status === 'completed' && match.home_score !== null && match.away_score !== null) {
          const ourScore = match.is_home ? match.home_score : match.away_score;
          const opponentScore = match.is_home ? match.away_score : match.home_score;
          
          if (ourScore > opponentScore) wins++;
          else if (ourScore < opponentScore) losses++;
          else draws++;
          
          recentMatches.push({
            id: match.id,
            opponent: match.is_home ? match.away_team_name : match.home_team_name,
            date: match.match_date,
            venue: match.venue,
            result: ourScore > opponentScore ? 'win' : ourScore < opponentScore ? 'loss' : 'draw',
            score: {
              home: match.home_score,
              away: match.away_score
            },
            isHome: match.is_home
          });
        } else if (match.status === 'scheduled') {
          upcomingMatches.push({
            id: match.id,
            opponent: match.is_home ? match.away_team_name : match.home_team_name,
            date: match.match_date,
            venue: match.venue,
            isHome: match.is_home
          });
        }
      });

      // Calculate points (3 for win, 1 for draw, 0 for loss)
      const points = (wins * 3) + draws;
      const totalGoals = parseInt(stats.total_goals) || 0;
      const totalMatches = parseInt(stats.total_matches) || 0;

      // Check if user is member or captain
      const userMembershipResult = await client.query(`
        SELECT tm.*, (tm.user_id = t.captain_id) as is_captain
        FROM team_members tm
        JOIN teams t ON tm.team_id = t.id
        WHERE tm.team_id = $1 AND tm.user_id = $2 AND tm.is_active = true
      `, [teamId, userId]);

      const userMembership = userMembershipResult.rows[0];
      const isMember = !!userMembership;
      const isUserCaptain = userMembership?.is_captain || false;

      const teamData = {
        id: team.id,
        name: team.name,
        league: {
          id: team.league_id,
          name: team.league_name || 'Independent'
        },
        color: team.team_color || '#3B82F6',
        description: team.team_bio || '',
        founded: team.founded_year ? team.founded_year.toString() : new Date(team.created_at).getFullYear().toString(),
        location: team.location || 'TBD',
        memberCount: memberCount,
        maxMembers: team.max_players || 22,
        captain_id: team.captain_id,
        isMember,
        isUserCaptain,
        userPosition: userMembership?.position,
        stats: {
          wins,
          draws, 
          losses,
          goals: totalGoals,
          goalsAgainst: 0, // TODO: Calculate from match results
          position: 1, // TODO: Calculate from league standings
          totalTeams: 16, // TODO: Get from league
          points: points,
          totalMatches: wins + draws + losses,
          totalAssists: parseInt(stats.total_assists) || 0
        },
        recentMatches: recentMatches.slice(0, 5),
        upcomingMatches: upcomingMatches.slice(0, 5)
      };
      
      const response = NextResponse.json({
        data: teamData,
        message: 'Team details retrieved successfully'
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
    console.error('Team details API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team details' },
      { status: 500 }
    );
  }
}
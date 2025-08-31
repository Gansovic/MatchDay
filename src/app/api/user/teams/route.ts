/**
 * User Teams API Route
 * 
 * GET /api/user/teams - Get team memberships for the authenticated user
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server-client';
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

    // Use Supabase to get user's team memberships
    const supabase = createServerSupabaseClient();
    
    // Get user's team memberships with team details and league info
    const { data: teamMemberships, error: teamsError } = await supabase
      .from('team_members')
      .select(`
        id,
        user_id,
        team_id,
        position,
        jersey_number,
        joined_at,
        is_active,
        teams (
          id,
          name,
          captain_id,
          league_id,
          max_players,
          team_color,
          created_at,
          leagues (
            id,
            name,
            description
          )
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('joined_at', { ascending: false });

    if (teamsError) {
      throw new Error(`Teams query error: ${teamsError.message}`);
    }

    // Get player stats for this user (if table exists)
    const { data: playerStats } = await supabase
      .from('player_stats')
      .select('team_id, goals, assists, minutes_played')
      .eq('user_id', userId);

      // Process the data to match expected format
      const teams = (teamMemberships || []).map(membership => {
        const team = membership.teams;
        if (!team) return null;
        
        // Calculate stats for this team
        const teamStats = (playerStats || []).filter(stat => stat.team_id === membership.team_id);
        const aggregatedStats = teamStats.length > 0 ? {
          goals: teamStats.reduce((sum, s) => sum + (s.goals || 0), 0),
          assists: teamStats.reduce((sum, s) => sum + (s.assists || 0), 0),
          matches: teamStats.length
        } : undefined;

        return {
          team: {
            id: team.id,
            name: team.name,
            league: team.leagues ? {
              id: team.leagues.id,
              name: team.leagues.name,
              description: team.leagues.description
            } : null,
            captain_id: team.captain_id,
            memberCount: 0, // Will be calculated if needed
            availableSpots: 0 // Will be calculated if needed
          },
          role: team.captain_id === userId ? 'captain' : 'member',
          position: membership.position,
          jerseyNumber: membership.jersey_number,
          joinedAt: membership.joined_at,
          stats: aggregatedStats
        };
      }).filter(Boolean);
      
      const response = NextResponse.json({
        teams,
        count: teams.length
      });
      
      // Add CORS headers
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      return response;
  } catch (error) {
    console.error('User teams API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user teams' },
      { status: 500 }
    );
  }
}
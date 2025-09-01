/**
 * User Teams API Route
 * 
 * GET /api/user/teams - Get team memberships for the authenticated user
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server-client';
import { validateApiAuth } from '@/lib/auth/api-auth';

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export async function GET(request: NextRequest) {
  try {
    // Validate authentication with consistent error handling
    const authResult = await validateApiAuth(request);
    if (!authResult.success) {
      return authResult.response!;
    }
    
    const { user } = authResult;
    console.log('✅ User Teams - Authenticated user:', user.id);

    // Use Supabase to get user's team memberships
    const supabase = await createServerSupabaseClient();
    
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
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('joined_at', { ascending: false });

    if (teamsError) {
      throw new Error(`Teams query error: ${teamsError.message}`);
    }

    // Get player stats for this user (if table exists)
    const { data: playerStats } = await supabase
      .from('player_stats')
      .select('team_id, goals, assists, minutes_played')
      .eq('user_id', user.id);

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
          role: team.captain_id === user.id ? 'captain' : 'member',
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
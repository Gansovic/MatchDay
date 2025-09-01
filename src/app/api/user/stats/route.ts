/**
 * User Stats API Route
 * 
 * GET /api/user/stats - Get dashboard statistics for the authenticated user
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
    console.log('✅ User Stats - Authenticated user:', user.id);

    // Use Supabase to get user statistics
    const supabase = await createServerSupabaseClient();
    
    // Get user's team memberships count
    const { count: teamsCount } = await supabase
      .from('team_members')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_active', true);

    // Get user's player stats (may not exist yet)
    const { data: playerStatsData } = await supabase
      .from('player_stats')
      .select('goals, assists, minutes_played')
      .eq('user_id', user.id);

    // Get unique leagues the user participates in
    const { data: userTeamsWithLeagues } = await supabase
      .from('team_members')
      .select(`
        teams (
          league_id
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .not('teams.league_id', 'is', null);

    // Calculate aggregated stats
    const playerStats = playerStatsData || [];
    const totalMatches = playerStats.length;
    const totalGoals = playerStats.reduce((sum, s) => sum + (s.goals || 0), 0);
    const totalAssists = playerStats.reduce((sum, s) => sum + (s.assists || 0), 0);
    
    // Count unique leagues
    const uniqueLeagues = new Set(
      (userTeamsWithLeagues || [])
        .map(tm => tm.teams?.league_id)
        .filter(Boolean)
    );
    
    // For now, calculate win rate as 0 until we have match results data
    const winRate = 0; // TODO: Calculate from match results when available
    
    // Upcoming matches placeholder
    const upcomingMatches = 0; // TODO: Calculate from scheduled matches
    
    const dashboardStats = {
      matchesPlayed: totalMatches,
      teamsJoined: teamsCount || 0,
      upcomingMatches,
      winRate,
      goalsScored: totalGoals,
      assists: totalAssists,
      leaguesParticipated: uniqueLeagues.size
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
  } catch (error) {
    console.error('User stats API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user stats' },
      { status: 500 }
    );
  }
}
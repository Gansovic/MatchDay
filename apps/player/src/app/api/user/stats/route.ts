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
    
    // Try to get aggregated stats from the user_dashboard_stats view
    console.log('🔍 DEBUG: Attempting to query user_dashboard_stats view...');
    const { data: dashboardData, error: dashboardError } = await supabase
      .from('user_dashboard_stats')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    console.log('🔍 DEBUG: Dashboard query result:', {
      data: dashboardData,
      error: dashboardError,
      hasData: !!dashboardData,
      hasError: !!dashboardError,
      errorMessage: dashboardError?.message,
      errorCode: dashboardError?.code
    });

    // If view exists and returns data, use it BUT recalculate win rate from actual matches
    // Skip the view if there's an error and go straight to fallback
    if (!dashboardError && dashboardData && typeof dashboardData === 'object' && !Array.isArray(dashboardData)) {
      console.log('📊 Dashboard view data:', dashboardData);

      // IMPORTANT: Recalculate win rate from actual completed matches, not from team_stats
      // team_stats is filtered by current year which may not include all historical matches
      let actualWinRate = 0;
      let actualTotalWins = 0;
      let actualTotalGames = 0;

      try {
        // Get team IDs for the user
        const { data: userTeamMemberships } = await supabase
          .from('team_members')
          .select('team_id')
          .eq('user_id', user.id)
          .eq('is_active', true);

        const teamIds = (userTeamMemberships || []).map(tm => tm.team_id);

        if (teamIds.length > 0) {
          const { data: completedMatches } = await supabase
            .from('matches')
            .select('id, home_team_id, away_team_id, home_score, away_score')
            .or(`home_team_id.in.(${teamIds.join(',')}),away_team_id.in.(${teamIds.join(',')})`)
            .eq('status', 'completed')
            .not('home_score', 'is', null)
            .not('away_score', 'is', null);

          console.log('📊 Completed matches found:', completedMatches?.length || 0);

          if (completedMatches && completedMatches.length > 0) {
            completedMatches.forEach(match => {
              const isHome = teamIds.includes(match.home_team_id);
              actualTotalGames++;
              const userScore = isHome ? match.home_score : match.away_score;
              const oppScore = isHome ? match.away_score : match.home_score;
              if (userScore! > oppScore!) actualTotalWins++;
            });
          }
        }

        actualWinRate = actualTotalGames > 0
          ? Math.round((actualTotalWins / actualTotalGames) * 100)
          : 0;

        console.log('📊 Actual win rate calculation:', { actualTotalWins, actualTotalGames, actualWinRate });
      } catch (winRateError) {
        console.error('Error calculating win rate from matches:', winRateError);
        // Continue with 0 win rate if calculation fails
      }

      const dashboardStats = {
        matchesPlayed: actualTotalGames || (dashboardData as any).matches_played || 0,
        teamsJoined: (dashboardData as any).teams_joined || 0,
        upcomingMatches: (dashboardData as any).upcoming_matches || 0,
        winRate: actualWinRate, // Use actual win rate from completed matches
        goalsScored: (dashboardData as any).goals_scored || 0,
        assists: (dashboardData as any).assists || 0,
        leaguesParticipated: (dashboardData as any).leagues_participated || 0,
        avgTeamWinRate: actualWinRate // Use actual win rate here too
      };

      // Get detailed team stats for the user using the database function
      const { data: teamStats, error: teamStatsError } = await supabase
        .rpc('get_user_team_stats', { p_user_id: user.id });

      if (teamStatsError) {
        console.error('Error fetching team stats:', teamStatsError);
      }

      // Get player team stats with individual contributions
      const { data: playerTeamStats, error: playerTeamError } = await supabase
        .from('player_team_stats')
        .select('*')
        .eq('player_id', user.id);

      if (playerTeamError) {
        console.error('Error fetching player team stats:', playerTeamError);
      }

      // Calculate performance metrics with multi-team context
      const performance = dashboardData.matches_played > 0 ? {
        overallRating: Math.min(95, 70 + (dashboardData.goals_scored + dashboardData.assists) * 2),
        strengths: [
          dashboardData.goals_scored > 3 ? 'Goal Scoring' : null,
          dashboardData.assists > 2 ? 'Playmaking' : null,
          dashboardData.matches_played > 5 ? 'Consistency' : null,
          actualWinRate > 50 ? 'Winning Mentality' : null,
          dashboardData.teams_joined > 1 ? 'Team Versatility' : null
        ].filter((s): s is string => s !== null),
        totalGoals: dashboardData.goals_scored,
        totalAssists: dashboardData.assists,
        totalMatches: dashboardData.matches_played,
        avgTeamWinRate: dashboardData.avg_team_win_rate
      } : null;

      const response = NextResponse.json({
        stats: dashboardStats,
        teamStats: teamStats || [],
        playerTeamStats: playerTeamStats || [],
        performance,
        multiTeamContext: {
          hasMultipleTeams: dashboardData.teams_joined > 1,
          totalTeams: dashboardData.teams_joined,
          bestPerformingTeam: teamStats && teamStats.length > 0 
            ? teamStats.reduce((best, current) => 
                current.win_rate > best.win_rate ? current : best
              ) 
            : null
        }
      });
      
      // Add CORS headers
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      return response;
    }

    // Fallback to manual calculation if view doesn't exist
    console.log('📊 User Stats - Fallback to manual calculation');
    console.log('🔍 DEBUG: View query failed, using fallback. Error was:', dashboardError?.message);
    
    // Define interface for team membership data
    interface TeamMembership {
      team_id: string;
      teams: {
        id: string;
        name: string;
        league_id: string | null;
        team_stats: {
          wins: number;
          games_played: number;
          season_year: number;
        }[];
      };
    }

    // Get user's team memberships with stats
    console.log('🔍 DEBUG: Querying team memberships for user:', user.id);
    const { data: teamMemberships, error: teamMembershipsError } = await supabase
      .from('team_members')
      .select(`
        team_id,
        teams!inner (
          id,
          name,
          league_id,
          team_stats!left (
            wins,
            games_played,
            season_year
          )
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true);
    
    console.log('🔍 DEBUG: Team memberships result:', {
      data: teamMemberships,
      error: teamMembershipsError,
      count: teamMemberships?.length || 0
    });

    // Get user's player stats
    console.log('🔍 DEBUG: Querying player stats for user:', user.id);
    const { data: playerStatsData, error: playerStatsError } = await supabase
      .from('player_stats')
      .select('goals, assists, minutes_played')
      .eq('user_id', user.id);
    
    console.log('🔍 DEBUG: Player stats result:', {
      data: playerStatsData,
      error: playerStatsError,
      count: playerStatsData?.length || 0
    });

    // Calculate aggregated stats
    const playerStats = playerStatsData || [];
    const totalMatches = playerStats.length;
    const totalGoals = playerStats.reduce((sum, s) => sum + (s.goals || 0), 0);
    const totalAssists = playerStats.reduce((sum, s) => sum + (s.assists || 0), 0);
    
    // Calculate team statistics
    const teamsCount = teamMemberships?.length || 0;
    const uniqueLeagues = new Set(
      (teamMemberships || [])
        .map(tm => tm.teams?.league_id)
        .filter(Boolean)
    );
    
    // Calculate win rate from actual completed matches
    let totalWins = 0;
    let totalGames = 0;

    // Get all matches for user's teams
    const teamIds = (teamMemberships as TeamMembership[] || []).map(tm => tm.team_id).filter(Boolean);

    if (teamIds.length > 0) {
      console.log('🔍 DEBUG: Fetching matches for teams:', teamIds);

      const { data: matches, error: matchesError } = await supabase
        .from('matches')
        .select('id, home_team_id, away_team_id, home_score, away_score, status')
        .or(`home_team_id.in.(${teamIds.join(',')}),away_team_id.in.(${teamIds.join(',')})`)
        .eq('status', 'completed')
        .not('home_score', 'is', null)
        .not('away_score', 'is', null);

      console.log('🔍 DEBUG: Matches result:', {
        count: matches?.length || 0,
        error: matchesError,
        matches: matches
      });

      // Calculate wins from completed matches
      if (matches && matches.length > 0) {
        matches.forEach(match => {
          const isHomeTeam = teamIds.includes(match.home_team_id);
          const isAwayTeam = teamIds.includes(match.away_team_id);

          if (isHomeTeam || isAwayTeam) {
            totalGames++;

            const userScore = isHomeTeam ? match.home_score : match.away_score;
            const opponentScore = isHomeTeam ? match.away_score : match.home_score;

            if (userScore! > opponentScore!) {
              totalWins++;
            }
          }
        });
      }
    }

    console.log('🔍 DEBUG: Win rate calculation:', { totalWins, totalGames });
    const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;

    // Get upcoming matches count (teamIds already declared above)
    let upcomingMatches = 0;
    
    if (teamIds.length > 0) {
      const { count } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .or(`home_team_id.in.(${teamIds.join(',')}),away_team_id.in.(${teamIds.join(',')})`)
        .eq('status', 'scheduled')
        .gt('match_date', new Date().toISOString());
      
      upcomingMatches = count || 0;
    }
    
    const dashboardStats = {
      matchesPlayed: totalGames || totalMatches, // Use team match count if available, fallback to player stats
      teamsJoined: teamsCount,
      upcomingMatches,
      winRate,
      goalsScored: totalGoals,
      assists: totalAssists,
      leaguesParticipated: uniqueLeagues.size,
      totalTeamWins: totalWins,
      totalTeamGames: totalGames
    };

    console.log('🔍 DEBUG: Final calculated dashboard stats:', dashboardStats);
    console.log('🔍 DEBUG: Win rate breakdown - Wins:', totalWins, 'Games:', totalGames, 'Percentage:', winRate);

    // Calculate performance analysis with team context
    let performance = null;
    if (playerStats.length > 0 || totalGames > 0) {
      performance = {
        overallRating: totalMatches > 0 ? Math.min(95, 70 + (totalGoals + totalAssists) * 2) : 70,
        strengths: [
          totalGoals > 3 ? 'Goal Scoring' : null,
          totalAssists > 2 ? 'Playmaking' : null,
          totalMatches > 5 ? 'Consistency' : null,
          winRate > 50 ? 'Winning Mentality' : null
        ].filter((s): s is string => s !== null),
        totalGoals,
        totalAssists,
        totalMatches,
        teamWinRate: winRate
      };
    }

    // Get detailed team stats for fallback scenario as well
    const { data: fallbackTeamStats } = await supabase
      .rpc('get_user_team_stats', { p_user_id: user?.id });

    // Type-safe team stats array
    const teamStatsArray = Array.isArray(fallbackTeamStats) ? fallbackTeamStats : [];

    const response = NextResponse.json({
      stats: dashboardStats,
      teamStats: teamStatsArray,
      performance,
      teamContext: {
        totalWins,
        totalGames,
        winRate
      },
      multiTeamContext: {
        hasMultipleTeams: teamsCount > 1,
        totalTeams: teamsCount,
        bestPerformingTeam: teamStatsArray.length > 0
          ? teamStatsArray.reduce((best: any, current: any) =>
              current.win_rate > best.win_rate ? current : best
            )
          : null
      }
    });
      
      // Add CORS headers
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      return response;
  } catch (error) {
    console.error('❌ User stats API error:', error);
    console.error('❌ Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      {
        error: 'Failed to fetch user stats',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
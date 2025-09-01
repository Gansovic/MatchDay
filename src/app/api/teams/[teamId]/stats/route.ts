/**
 * Team Stats API Route
 * 
 * GET /api/teams/[teamId]/stats - Get comprehensive team statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { TeamService } from '@/lib/services/team.service';
import { StatsService } from '@/lib/services/stats.service';
import { createServerSupabaseClient, createUserSupabaseClient } from '@/lib/supabase/server-client';

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

    // Get authenticated user from Supabase client
    console.log('🔍 Team Stats - Authenticating user');
    const supabaseUserClient = createUserSupabaseClient(request);
    const { data: { user }, error: userError } = await supabaseUserClient.auth.getUser();
    
    if (userError || !user) {
      console.log('❌ Team Stats - Authentication failed:', userError?.message || 'No user found');
      return NextResponse.json(
        { error: 'Authentication required', message: 'Please log in to view team statistics' },
        { status: 401 }
      );
    }
    
    const userId = user.id;
    console.log('✅ Team Stats - Authenticated user:', userId);

    // Use server client for database operations
    const supabaseServerClient = await createServerSupabaseClient();
    
    // Get team details first to verify access
    console.log('🔍 Team Stats - Getting team details for:', teamId);
    const teamService = TeamService.getInstance(supabaseServerClient);
    const teamResult = await teamService.getTeamDetails(teamId);
    
    if (!teamResult.success || !teamResult.data) {
      console.error('❌ Team Stats - Team not found:', teamResult.error);
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    const team = teamResult.data;
    console.log('✅ Team Stats - Found team:', team.name);

    // Get current season year
    const currentYear = new Date().getFullYear();

    // Get team statistics from team_stats table
    console.log('🔍 Team Stats - Fetching team statistics');
    const { data: teamStats, error: statsError } = await supabaseServerClient
      .from('team_stats')
      .select('*')
      .eq('team_id', teamId)
      .eq('season_year', currentYear)
      .single();

    if (statsError && statsError.code !== 'PGRST116') {
      console.error('❌ Team Stats - Error fetching statistics:', statsError);
      return NextResponse.json(
        { error: 'Failed to fetch team statistics' },
        { status: 500 }
      );
    }

    // Get league standings if team is in a league
    let leaguePosition = null;
    let totalTeamsInLeague = null;
    
    if (team.league_id) {
      console.log('🔍 Team Stats - Fetching league standings');
      const { data: leagueStandings, error: standingsError } = await supabaseServerClient
        .from('team_stats')
        .select('team_id, points, goals_for, goals_against')
        .eq('league_id', team.league_id)
        .eq('season_year', currentYear)
        .order('points', { ascending: false })
        .order('goals_for', { ascending: false });

      if (!standingsError && leagueStandings) {
        totalTeamsInLeague = leagueStandings.length;
        const teamIndex = leagueStandings.findIndex(standing => standing.team_id === teamId);
        leaguePosition = teamIndex >= 0 ? teamIndex + 1 : null;
      }
    }

    // Get recent match history
    console.log('🔍 Team Stats - Fetching recent matches');
    const { data: recentMatches, error: matchesError } = await supabaseServerClient
      .from('matches')
      .select(`
        id,
        scheduled_date,
        status,
        home_score,
        away_score,
        home_team_id,
        away_team_id,
        venue,
        home_team:teams!matches_home_team_id_fkey(name),
        away_team:teams!matches_away_team_id_fkey(name)
      `)
      .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
      .eq('status', 'completed')
      .order('scheduled_date', { ascending: false })
      .limit(5);

    // Get upcoming matches
    const { data: upcomingMatches, error: upcomingError } = await supabaseServerClient
      .from('matches')
      .select(`
        id,
        scheduled_date,
        status,
        home_team_id,
        away_team_id,
        venue,
        home_team:teams!matches_home_team_id_fkey(name),
        away_team:teams!matches_away_team_id_fkey(name)
      `)
      .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
      .in('status', ['scheduled', 'upcoming'])
      .order('scheduled_date', { ascending: true })
      .limit(5);

    // Calculate form (last 5 matches)
    let form: ('W' | 'D' | 'L')[] = [];
    if (recentMatches && !matchesError) {
      form = recentMatches.slice(0, 5).map(match => {
        const isHome = match.home_team_id === teamId;
        const teamScore = isHome ? match.home_score : match.away_score;
        const opponentScore = isHome ? match.away_score : match.home_score;
        
        if (teamScore > opponentScore) return 'W';
        if (teamScore < opponentScore) return 'L';
        return 'D';
      }).reverse(); // Show oldest to newest
    }

    // Prepare comprehensive statistics
    const statistics = {
      // Basic team stats
      wins: teamStats?.wins || 0,
      draws: teamStats?.draws || 0,
      losses: teamStats?.losses || 0,
      totalMatches: (teamStats?.wins || 0) + (teamStats?.draws || 0) + (teamStats?.losses || 0),
      
      // Goal statistics
      goalsFor: teamStats?.goals_for || 0,
      goalsAgainst: teamStats?.goals_against || 0,
      goalDifference: (teamStats?.goals_for || 0) - (teamStats?.goals_against || 0),
      
      // Performance metrics
      points: teamStats?.points || 0,
      winPercentage: teamStats?.wins && teamStats?.games_played 
        ? Math.round((teamStats.wins / teamStats.games_played) * 100) 
        : 0,
      
      // League position
      leaguePosition,
      totalTeamsInLeague,
      
      // Form and trends
      form,
      averageGoalsPerGame: teamStats?.games_played 
        ? Math.round(((teamStats?.goals_for || 0) / teamStats.games_played) * 100) / 100
        : 0,
      averageConcededPerGame: teamStats?.games_played 
        ? Math.round(((teamStats?.goals_against || 0) / teamStats.games_played) * 100) / 100
        : 0,
      
      // Recent performance
      recentMatches: recentMatches?.map(match => ({
        id: match.id,
        date: match.scheduled_date,
        opponent: match.home_team_id === teamId ? match.away_team?.name : match.home_team?.name,
        isHome: match.home_team_id === teamId,
        score: {
          team: match.home_team_id === teamId ? match.home_score : match.away_score,
          opponent: match.home_team_id === teamId ? match.away_score : match.home_score
        },
        result: (() => {
          const teamScore = match.home_team_id === teamId ? match.home_score : match.away_score;
          const opponentScore = match.home_team_id === teamId ? match.away_score : match.home_score;
          if (teamScore > opponentScore) return 'win';
          if (teamScore < opponentScore) return 'loss';
          return 'draw';
        })(),
        venue: match.venue
      })) || [],
      
      // Upcoming fixtures
      upcomingMatches: upcomingMatches?.map(match => ({
        id: match.id,
        date: match.scheduled_date,
        opponent: match.home_team_id === teamId ? match.away_team?.name : match.home_team?.name,
        isHome: match.home_team_id === teamId,
        venue: match.venue
      })) || []
    };

    console.log('✅ Team Stats - Successfully compiled statistics for', team.name);

    const response = NextResponse.json({
      data: statistics,
      team: {
        id: team.id,
        name: team.name,
        league: team.league?.name || null
      }
    });
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  } catch (error) {
    console.error('Team stats API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team statistics' },
      { status: 500 }
    );
  }
}
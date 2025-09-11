/**
 * Team Matches API Route
 * 
 * GET /api/teams/[teamId]/matches - Get team matches history and fixtures
 */

import { NextRequest, NextResponse } from 'next/server';
import { TeamService } from '@/lib/services/team.service';
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
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const type = searchParams.get('type') || 'all'; // 'recent', 'upcoming', or 'all'
    
    if (!teamId) {
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      );
    }

    // Get authenticated user from Supabase client
    console.log('🔍 Team Matches - Authenticating user');
    const supabaseUserClient = createUserSupabaseClient(request);
    const { data: { user }, error: userError } = await supabaseUserClient.auth.getUser();
    
    if (userError || !user) {
      console.log('❌ Team Matches - Authentication failed:', userError?.message || 'No user found');
      return NextResponse.json(
        { error: 'Authentication required', message: 'Please log in to view team matches' },
        { status: 401 }
      );
    }
    
    const userId = user.id;
    console.log('✅ Team Matches - Authenticated user:', userId);

    // Use server client for database operations
    const supabaseServerClient = await createServerSupabaseClient();
    
    // Verify team exists and user has access
    console.log('🔍 Team Matches - Verifying team access for:', teamId);
    const teamService = TeamService.getInstance(supabaseServerClient);
    const teamResult = await teamService.getTeamDetails(teamId);
    
    if (!teamResult.success || !teamResult.data) {
      console.error('❌ Team Matches - Team not found:', teamResult.error);
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    const team = teamResult.data;
    console.log('✅ Team Matches - Found team:', team.name);

    // Base query for matches
    const baseQuery = supabaseServerClient
      .from('matches')
      .select(`
        id,
        match_date,
        status,
        home_score,
        away_score,
        home_team_id,
        away_team_id,
        venue,
        league_id,
        home_team:teams!matches_home_team_id_fkey(id, name, logo_url, team_color),
        away_team:teams!matches_away_team_id_fkey(id, name, logo_url, team_color),
        league:leagues!left(id, name)
      `)
      .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`);

    // Get matches based on type
    let recentMatches = [];
    let upcomingMatches = [];

    if (type === 'recent' || type === 'all') {
      console.log('🔍 Team Matches - Fetching recent matches');
      const { data: recent, error: recentError } = await baseQuery
        .eq('status', 'completed')
        .order('match_date', { ascending: false })
        .limit(type === 'recent' ? limit : Math.floor(limit / 2));

      if (recentError) {
        console.error('❌ Team Matches - Error fetching recent matches:', recentError);
      } else {
        recentMatches = recent || [];
        console.log(`✅ Team Matches - Found ${recentMatches.length} recent matches`);
      }
    }

    if (type === 'upcoming' || type === 'all') {
      console.log('🔍 Team Matches - Fetching upcoming matches');
      const { data: upcoming, error: upcomingError } = await supabaseServerClient
        .from('matches')
        .select(`
          id,
          match_date,
          status,
          home_score,
          away_score,
          home_team_id,
          away_team_id,
          venue,
          league_id,
          home_team:teams!matches_home_team_id_fkey(id, name, logo_url, team_color),
          away_team:teams!matches_away_team_id_fkey(id, name, logo_url, team_color),
          league:leagues!left(id, name)
        `)
        .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
        .in('status', ['scheduled'])
        .order('match_date', { ascending: true })
        .limit(type === 'upcoming' ? limit : Math.floor(limit / 2));

      if (upcomingError) {
        console.error('❌ Team Matches - Error fetching upcoming matches:', upcomingError);
      } else {
        upcomingMatches = upcoming || [];
        console.log(`✅ Team Matches - Found ${upcomingMatches.length} upcoming matches`);
        console.log('🔍 Team Matches - Upcoming matches raw data:', upcoming);
      }
    }

    // Transform matches data
    const formatMatch = (match: any) => {
      const isHome = match.home_team_id === teamId;
      const opponent = isHome ? match.away_team : match.home_team;
      const teamScore = isHome ? match.home_score : match.away_score;
      const opponentScore = isHome ? match.away_score : match.home_score;

      // Calculate result for completed matches
      let result = null;
      if (match.status === 'completed' && teamScore !== null && opponentScore !== null) {
        if (teamScore > opponentScore) result = 'win';
        else if (teamScore < opponentScore) result = 'loss';
        else result = 'draw';
      }

      return {
        id: match.id,
        date: match.match_date,
        status: match.status,
        isHome,
        opponent: {
          id: opponent.id,
          name: opponent.name,
          logo_url: opponent.logo_url,
          color: opponent.team_color
        },
        scores: match.status === 'completed' ? {
          team: teamScore,
          opponent: opponentScore
        } : null,
        result,
        venue: match.venue,
        matchDay: null, // match_day column not available
        league: match.league ? {
          id: match.league.id,
          name: match.league.name
        } : null
      };
    };

    // Format the matches
    const formattedRecentMatches = recentMatches.map(formatMatch);
    const formattedUpcomingMatches = upcomingMatches.map(formatMatch);

    // Calculate match statistics
    const totalMatches = formattedRecentMatches.length;
    const wins = formattedRecentMatches.filter(m => m.result === 'win').length;
    const draws = formattedRecentMatches.filter(m => m.result === 'draw').length;
    const losses = formattedRecentMatches.filter(m => m.result === 'loss').length;
    const winPercentage = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

    // Get home vs away statistics
    const homeMatches = formattedRecentMatches.filter(m => m.isHome);
    const awayMatches = formattedRecentMatches.filter(m => !m.isHome);
    const homeWins = homeMatches.filter(m => m.result === 'win').length;
    const awayWins = awayMatches.filter(m => m.result === 'win').length;

    // Calculate recent form (last 5 matches)
    const recentForm = formattedRecentMatches
      .slice(0, 5)
      .map(match => {
        if (match.result === 'win') return 'W';
        if (match.result === 'loss') return 'L';
        return 'D';
      })
      .reverse(); // Show oldest to newest

    const matchData = {
      recent: formattedRecentMatches,
      upcoming: formattedUpcomingMatches,
      statistics: {
        total: totalMatches,
        wins,
        draws,
        losses,
        winPercentage,
        homeRecord: {
          played: homeMatches.length,
          wins: homeWins,
          percentage: homeMatches.length > 0 ? Math.round((homeWins / homeMatches.length) * 100) : 0
        },
        awayRecord: {
          played: awayMatches.length,
          wins: awayWins,
          percentage: awayMatches.length > 0 ? Math.round((awayWins / awayMatches.length) * 100) : 0
        },
        form: recentForm
      }
    };

    console.log('✅ Team Matches - Successfully compiled match data for', team.name);

    const response = NextResponse.json({
      data: matchData,
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
    console.error('Team matches API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team matches' },
      { status: 500 }
    );
  }
}
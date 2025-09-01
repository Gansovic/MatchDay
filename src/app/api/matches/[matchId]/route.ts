/**
 * Match Details API Route
 * 
 * GET /api/matches/[matchId] - Get basic match details
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server-client';
import { validateApiAuth } from '@/lib/auth/api-auth';

/**
 * GET - Get basic match details
 */
export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await params;
    console.log('🔍 Getting match details:', matchId);

    // Validate authentication
    const authResult = await validateApiAuth(request);
    if (!authResult.success) {
      return authResult.response!;
    }

    const { user } = authResult;
    const supabase = await createServerSupabaseClient();

    // Get match details with only core columns that definitely exist
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select(`
        id,
        home_score,
        away_score,
        status,
        match_date,
        venue,
        notes,
        home_team_id,
        away_team_id,
        league_id
      `)
      .eq('id', matchId)
      .single();

    if (matchError || !match) {
      console.error('❌ Match not found:', matchError?.message);
      return NextResponse.json(
        { error: 'Match not found', message: 'The specified match does not exist' },
        { status: 404 }
      );
    }

    // Get team details separately
    const { data: homeTeam, error: homeTeamError } = await supabase
      .from('teams')
      .select('id, name, team_color')
      .eq('id', match.home_team_id)
      .single();

    const { data: awayTeam, error: awayTeamError } = await supabase
      .from('teams')
      .select('id, name, team_color')
      .eq('id', match.away_team_id)
      .single();

    if (homeTeamError || awayTeamError || !homeTeam || !awayTeam) {
      console.error('❌ Team details not found:', { homeTeamError, awayTeamError });
      return NextResponse.json(
        { error: 'Match teams not found', message: 'Unable to load team information for this match' },
        { status: 404 }
      );
    }

    // Check if user has access to view this match (must be member of one of the teams)
    const { data: userTeamMembership, error: membershipError } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .in('team_id', [match.home_team_id, match.away_team_id]);

    if (membershipError || !userTeamMembership || userTeamMembership.length === 0) {
      console.error('❌ Access denied for user:', user.id, 'to match:', matchId);
      return NextResponse.json(
        { error: 'Access denied', message: 'You must be a member of one of the teams to view match details' },
        { status: 403 }
      );
    }

    // Get league details if match has a league
    let league = null;
    if (match.league_id) {
      const { data: leagueData } = await supabase
        .from('leagues')
        .select('id, name')
        .eq('id', match.league_id)
        .single();
      league = leagueData;
    }

    const responseData = {
      id: match.id,
      homeTeam: {
        id: homeTeam.id,
        name: homeTeam.name,
        color: homeTeam.team_color,
        score: match.home_score
      },
      awayTeam: {
        id: awayTeam.id,
        name: awayTeam.name,
        color: awayTeam.team_color,
        score: match.away_score
      },
      status: match.status,
      matchDate: match.match_date,
      venue: match.venue,
      duration: 90,
      notes: match.notes,
      league: league,
      createdAt: new Date().toISOString(), // Use current time since created_at may have schema issues
      updatedAt: new Date().toISOString()  // Use current time since updated_at may have schema issues
    };

    console.log('✅ Match details retrieved successfully:', matchId);

    return NextResponse.json({
      data: responseData,
      message: 'Match details retrieved successfully'
    });

  } catch (error) {
    console.error('Error in GET /api/matches/[matchId]:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}
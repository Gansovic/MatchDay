/**
 * Match Score Management API Route
 * 
 * GET /api/matches/[matchId]/score - Get current match score
 * PUT /api/matches/[matchId]/score - Update match score and status
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server-client';
import { validateApiAuth } from '@/lib/auth/api-auth';

interface UpdateScoreRequest {
  homeScore: number;
  awayScore: number;
  status?: 'scheduled' | 'live' | 'completed' | 'cancelled';
  matchDuration?: number;
  notes?: string;
}

/**
 * GET - Get current match score and details
 */
export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await params;
    console.log('⚽ Getting match score:', matchId);

    // Validate authentication
    const authResult = await validateApiAuth(request);
    if (!authResult.success) {
      return authResult.response!;
    }

    const { user } = authResult;
    const supabase = await createServerSupabaseClient();

    // Get match details with teams
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select(`
        id,
        home_score,
        away_score,
        status,
        match_date,
        scheduled_date,
        venue,
        match_duration,
        notes,
        created_at,
        updated_at,
        home_team:teams!matches_home_team_id_fkey(id, name, team_color),
        away_team:teams!matches_away_team_id_fkey(id, name, team_color),
        league:leagues(id, name)
      `)
      .eq('id', matchId)
      .single();

    if (matchError || !match) {
      return NextResponse.json(
        { error: 'Match not found', message: 'The specified match does not exist' },
        { status: 404 }
      );
    }

    // Check if user has access to view this match (must be member of one of the teams)
    const { data: userTeamMembership, error: membershipError } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .in('team_id', [match.home_team.id, match.away_team.id]);

    if (membershipError || !userTeamMembership || userTeamMembership.length === 0) {
      return NextResponse.json(
        { error: 'Access denied', message: 'You must be a member of one of the teams to view match details' },
        { status: 403 }
      );
    }

    const responseData = {
      id: match.id,
      homeTeam: {
        id: match.home_team.id,
        name: match.home_team.name,
        color: match.home_team.team_color,
        score: match.home_score
      },
      awayTeam: {
        id: match.away_team.id,
        name: match.away_team.name,
        color: match.away_team.team_color,
        score: match.away_score
      },
      status: match.status,
      matchDate: match.match_date,
      scheduledDate: match.scheduled_date,
      venue: match.venue,
      duration: match.match_duration,
      notes: match.notes,
      league: match.league,
      createdAt: match.created_at,
      updatedAt: match.updated_at
    };

    return NextResponse.json({
      data: responseData,
      message: 'Match details retrieved successfully'
    });

  } catch (error) {
    console.error('Error in GET /api/matches/[matchId]/score:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update match score and status
 */
export async function PUT(
  request: NextRequest, 
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await params;
    console.log('🎯 Updating match score:', matchId);

    // Parse request body
    let requestData: UpdateScoreRequest;
    try {
      requestData = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid request body', message: 'Request body must be valid JSON' },
        { status: 400 }
      );
    }

    // Validate authentication
    const authResult = await validateApiAuth(request);
    if (!authResult.success) {
      return authResult.response!;
    }

    const { user } = authResult;
    const supabase = await createServerSupabaseClient();

    // Validate scores
    if (typeof requestData.homeScore !== 'number' || requestData.homeScore < 0) {
      return NextResponse.json(
        { error: 'Invalid home score', message: 'Home score must be a non-negative number' },
        { status: 400 }
      );
    }

    if (typeof requestData.awayScore !== 'number' || requestData.awayScore < 0) {
      return NextResponse.json(
        { error: 'Invalid away score', message: 'Away score must be a non-negative number' },
        { status: 400 }
      );
    }

    // Get match details to verify access
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select(`
        id,
        status,
        home_team_id,
        away_team_id,
        home_team:teams!matches_home_team_id_fkey(id, name, captain_id),
        away_team:teams!matches_away_team_id_fkey(id, name, captain_id)
      `)
      .eq('id', matchId)
      .single();

    if (matchError || !match) {
      return NextResponse.json(
        { error: 'Match not found', message: 'The specified match does not exist' },
        { status: 404 }
      );
    }

    // Check if user is captain of either team
    const isHomeCaptain = match.home_team.captain_id === user.id;
    const isAwayCaptain = match.away_team.captain_id === user.id;

    if (!isHomeCaptain && !isAwayCaptain) {
      return NextResponse.json(
        { error: 'Permission denied', message: 'Only team captains can update match scores' },
        { status: 403 }
      );
    }

    // Validate status transition
    const validStatuses = ['scheduled', 'live', 'completed', 'cancelled'];
    if (requestData.status && !validStatuses.includes(requestData.status)) {
      return NextResponse.json(
        { error: 'Invalid status', message: 'Invalid match status' },
        { status: 400 }
      );
    }

    // Update the match
    const updateData: any = {
      home_score: requestData.homeScore,
      away_score: requestData.awayScore,
      updated_at: new Date().toISOString()
    };

    if (requestData.status) {
      updateData.status = requestData.status;
    }

    if (requestData.matchDuration !== undefined) {
      if (requestData.matchDuration < 0 || requestData.matchDuration > 120) {
        return NextResponse.json(
          { error: 'Invalid duration', message: 'Match duration must be between 0 and 120 minutes' },
          { status: 400 }
        );
      }
      updateData.match_duration = requestData.matchDuration;
    }

    if (requestData.notes !== undefined) {
      updateData.notes = requestData.notes;
    }

    const { data: updatedMatch, error: updateError } = await supabase
      .from('matches')
      .update(updateData)
      .eq('id', matchId)
      .select(`
        id,
        home_score,
        away_score,
        status,
        match_date,
        venue,
        match_duration,
        notes,
        updated_at,
        home_team:teams!matches_home_team_id_fkey(id, name, team_color),
        away_team:teams!matches_away_team_id_fkey(id, name, team_color)
      `)
      .single();

    if (updateError) {
      console.error('Error updating match:', updateError);
      return NextResponse.json(
        { error: 'Database error', message: 'Failed to update match' },
        { status: 500 }
      );
    }

    console.log('✅ Match score updated successfully:', matchId);

    const responseData = {
      id: updatedMatch.id,
      homeTeam: {
        id: updatedMatch.home_team.id,
        name: updatedMatch.home_team.name,
        color: updatedMatch.home_team.team_color,
        score: updatedMatch.home_score
      },
      awayTeam: {
        id: updatedMatch.away_team.id,
        name: updatedMatch.away_team.name,
        color: updatedMatch.away_team.team_color,
        score: updatedMatch.away_score
      },
      status: updatedMatch.status,
      matchDate: updatedMatch.match_date,
      venue: updatedMatch.venue,
      duration: updatedMatch.match_duration,
      notes: updatedMatch.notes,
      updatedAt: updatedMatch.updated_at
    };

    return NextResponse.json({
      data: responseData,
      message: 'Match score updated successfully'
    });

  } catch (error) {
    console.error('Error in PUT /api/matches/[matchId]/score:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}
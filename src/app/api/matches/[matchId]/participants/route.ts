/**
 * Match Participants API Route
 * 
 * GET /api/matches/[matchId]/participants - Get participants for a match
 * POST /api/matches/[matchId]/participants - Add/update participants for a match
 * DELETE /api/matches/[matchId]/participants - Remove participant from match
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server-client';
import { validateApiAuth } from '@/lib/auth/api-auth';

interface AddParticipantRequest {
  teamId: string;
  userId: string;
  position?: string;
  jerseyNumber?: number;
  isStarter?: boolean;
  isCaptain?: boolean;
}

interface UpdateParticipantRequest {
  participantId: string;
  position?: string;
  jerseyNumber?: number;
  isStarter?: boolean;
  isCaptain?: boolean;
}

/**
 * GET - Get all participants for a match
 */
export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await params;
    console.log('🔍 Getting participants for match:', matchId);

    // Validate authentication
    const authResult = await validateApiAuth(request);
    if (!authResult.success) {
      return authResult.response!;
    }

    const { user } = authResult;
    const supabase = await createServerSupabaseClient();

    // Get match details first to verify access
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select(`
        id, 
        status,
        home_team_id,
        away_team_id,
        home_team:teams!matches_home_team_id_fkey(id, name, team_color),
        away_team:teams!matches_away_team_id_fkey(id, name, team_color)
      `)
      .eq('id', matchId)
      .single();

    if (matchError || !match) {
      return NextResponse.json(
        { error: 'Match not found', message: 'The specified match does not exist' },
        { status: 404 }
      );
    }

    // Check if user has access to view participants (must be member of one of the teams)
    const { data: userTeamMembership, error: membershipError } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .in('team_id', [match.home_team_id, match.away_team_id]);

    if (membershipError || !userTeamMembership || userTeamMembership.length === 0) {
      return NextResponse.json(
        { error: 'Access denied', message: 'You must be a member of one of the teams to view participants' },
        { status: 403 }
      );
    }

    // Get participants for both teams
    const { data: participants, error: participantsError } = await supabase
      .from('match_participants')
      .select(`
        id,
        team_id,
        user_id,
        position,
        jersey_number,
        is_starter,
        is_captain,
        selected_at,
        user:user_profiles(id, display_name, full_name, avatar_url, preferred_position),
        team:teams(id, name, team_color)
      `)
      .eq('match_id', matchId)
      .order('jersey_number', { ascending: true });

    if (participantsError) {
      console.error('Error fetching participants:', participantsError);
      return NextResponse.json(
        { error: 'Database error', message: 'Failed to fetch participants' },
        { status: 500 }
      );
    }

    // Group participants by team
    const homeParticipants = participants?.filter(p => p.team_id === match.home_team_id) || [];
    const awayParticipants = participants?.filter(p => p.team_id === match.away_team_id) || [];

    const responseData = {
      matchId: match.id,
      status: match.status,
      homeTeam: {
        ...match.home_team,
        participants: homeParticipants.map(p => ({
          id: p.id,
          userId: p.user_id,
          position: p.position,
          jerseyNumber: p.jersey_number,
          isStarter: p.is_starter,
          isCaptain: p.is_captain,
          selectedAt: p.selected_at,
          player: {
            id: p.user.id,
            displayName: p.user.display_name,
            fullName: p.user.full_name,
            avatarUrl: p.user.avatar_url,
            preferredPosition: p.user.preferred_position
          }
        }))
      },
      awayTeam: {
        ...match.away_team,
        participants: awayParticipants.map(p => ({
          id: p.id,
          userId: p.user_id,
          position: p.position,
          jerseyNumber: p.jersey_number,
          isStarter: p.is_starter,
          isCaptain: p.is_captain,
          selectedAt: p.selected_at,
          player: {
            id: p.user.id,
            displayName: p.user.display_name,
            fullName: p.user.full_name,
            avatarUrl: p.user.avatar_url,
            preferredPosition: p.user.preferred_position
          }
        }))
      }
    };

    return NextResponse.json({
      data: responseData,
      message: 'Participants retrieved successfully'
    });

  } catch (error) {
    console.error('Error in GET /api/matches/[matchId]/participants:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * POST - Add or update participant for a match
 */
export async function POST(
  request: NextRequest, 
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await params;
    console.log('➕ Adding participant to match:', matchId);

    // Parse request body
    let requestData: AddParticipantRequest;
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

    // Validate required fields
    if (!requestData.teamId || !requestData.userId) {
      return NextResponse.json(
        { error: 'Missing required fields', message: 'teamId and userId are required' },
        { status: 400 }
      );
    }

    // Get match details and verify access
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('id, status, home_team_id, away_team_id')
      .eq('id', matchId)
      .single();

    if (matchError || !match) {
      return NextResponse.json(
        { error: 'Match not found', message: 'The specified match does not exist' },
        { status: 404 }
      );
    }

    // Check if match is still in scheduled state
    if (match.status !== 'scheduled') {
      return NextResponse.json(
        { error: 'Match locked', message: 'Cannot modify participants for a match that is not scheduled' },
        { status: 400 }
      );
    }

    // Verify team is part of the match
    if (requestData.teamId !== match.home_team_id && requestData.teamId !== match.away_team_id) {
      return NextResponse.json(
        { error: 'Invalid team', message: 'Team is not part of this match' },
        { status: 400 }
      );
    }

    // Check if user is captain of the team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('captain_id')
      .eq('id', requestData.teamId)
      .single();

    if (teamError || !team || team.captain_id !== user.id) {
      return NextResponse.json(
        { error: 'Permission denied', message: 'Only team captains can manage participants' },
        { status: 403 }
      );
    }

    // Verify the user being added is a member of the team
    const { data: teamMember, error: memberError } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', requestData.teamId)
      .eq('user_id', requestData.userId)
      .eq('is_active', true)
      .single();

    if (memberError || !teamMember) {
      return NextResponse.json(
        { error: 'Invalid player', message: 'Player is not a member of this team' },
        { status: 400 }
      );
    }

    // Check jersey number conflicts (if provided)
    if (requestData.jerseyNumber) {
      const { data: existingJersey, error: jerseyError } = await supabase
        .from('match_participants')
        .select('id')
        .eq('match_id', matchId)
        .eq('team_id', requestData.teamId)
        .eq('jersey_number', requestData.jerseyNumber)
        .neq('user_id', requestData.userId);

      if (jerseyError) {
        console.error('Error checking jersey numbers:', jerseyError);
      } else if (existingJersey && existingJersey.length > 0) {
        return NextResponse.json(
          { error: 'Jersey number conflict', message: `Jersey number ${requestData.jerseyNumber} is already taken` },
          { status: 400 }
        );
      }
    }

    // Insert or update participant
    const { data: participant, error: participantError } = await supabase
      .from('match_participants')
      .upsert({
        match_id: matchId,
        team_id: requestData.teamId,
        user_id: requestData.userId,
        position: requestData.position || null,
        jersey_number: requestData.jerseyNumber || null,
        is_starter: requestData.isStarter || false,
        is_captain: requestData.isCaptain || false
      }, {
        onConflict: 'match_id,user_id'
      })
      .select(`
        id,
        team_id,
        user_id,
        position,
        jersey_number,
        is_starter,
        is_captain,
        selected_at,
        user:user_profiles(id, display_name, full_name)
      `)
      .single();

    if (participantError) {
      console.error('Error adding participant:', participantError);
      return NextResponse.json(
        { error: 'Database error', message: 'Failed to add participant' },
        { status: 500 }
      );
    }

    console.log('✅ Participant added successfully:', participant.id);

    return NextResponse.json({
      data: {
        id: participant.id,
        matchId: matchId,
        teamId: participant.team_id,
        userId: participant.user_id,
        position: participant.position,
        jerseyNumber: participant.jersey_number,
        isStarter: participant.is_starter,
        isCaptain: participant.is_captain,
        selectedAt: participant.selected_at,
        player: {
          id: participant.user.id,
          displayName: participant.user.display_name,
          fullName: participant.user.full_name
        }
      },
      message: 'Participant added successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/matches/[matchId]/participants:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove participant from match
 */
export async function DELETE(
  request: NextRequest, 
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await params;
    console.log('🗑️ Removing participant from match:', matchId);

    // Get participantId from query params
    const { searchParams } = new URL(request.url);
    const participantId = searchParams.get('participantId');

    if (!participantId) {
      return NextResponse.json(
        { error: 'Missing parameter', message: 'participantId is required' },
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

    // Get participant details to verify access
    const { data: participant, error: participantError } = await supabase
      .from('match_participants')
      .select(`
        id,
        match_id,
        team_id,
        user_id,
        team:teams(captain_id)
      `)
      .eq('id', participantId)
      .eq('match_id', matchId)
      .single();

    if (participantError || !participant) {
      return NextResponse.json(
        { error: 'Participant not found', message: 'The specified participant does not exist' },
        { status: 404 }
      );
    }

    // Check if user is captain of the team
    if (participant.team.captain_id !== user.id) {
      return NextResponse.json(
        { error: 'Permission denied', message: 'Only team captains can remove participants' },
        { status: 403 }
      );
    }

    // Check match status
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('status')
      .eq('id', matchId)
      .single();

    if (matchError || !match || match.status !== 'scheduled') {
      return NextResponse.json(
        { error: 'Match locked', message: 'Cannot remove participants from a match that is not scheduled' },
        { status: 400 }
      );
    }

    // Remove participant
    const { error: deleteError } = await supabase
      .from('match_participants')
      .delete()
      .eq('id', participantId);

    if (deleteError) {
      console.error('Error removing participant:', deleteError);
      return NextResponse.json(
        { error: 'Database error', message: 'Failed to remove participant' },
        { status: 500 }
      );
    }

    console.log('✅ Participant removed successfully:', participantId);

    return NextResponse.json({
      message: 'Participant removed successfully'
    });

  } catch (error) {
    console.error('Error in DELETE /api/matches/[matchId]/participants:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}
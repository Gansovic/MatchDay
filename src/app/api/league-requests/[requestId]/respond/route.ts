/**
 * League Request Response API Routes
 * 
 * Handles league admin responses to team join requests:
 * - POST: Approve or reject a team join request
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

interface RouteContext {
  params: {
    requestId: string;
  };
}

/**
 * POST /api/league-requests/[requestId]/respond
 * Approve or reject a team join request
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { requestId } = params;
    const supabase = createServerClient();
    
    // Get authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { action, review_message } = body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    // Get the request details
    const { data: leagueRequest, error: requestError } = await supabase
      .from('team_league_requests')
      .select(`
        *,
        leagues:league_id (
          id,
          name,
          created_by,
          max_teams
        ),
        teams:team_id (
          id,
          name,
          captain_id
        )
      `)
      .eq('id', requestId)
      .single();

    if (requestError || !leagueRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    // Verify user is the league admin
    if (leagueRequest.leagues.created_by !== user.id) {
      return NextResponse.json(
        { error: 'Only league administrators can respond to requests' },
        { status: 403 }
      );
    }

    // Check if request is still pending
    if (leagueRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'Request has already been processed' },
        { status: 400 }
      );
    }

    // Check if request has expired
    if (new Date(leagueRequest.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Request has expired' },
        { status: 400 }
      );
    }

    // If approving, check league capacity
    if (action === 'approve' && leagueRequest.leagues.max_teams) {
      const { count: currentTeams } = await supabase
        .from('teams')
        .select('*', { count: 'exact', head: true })
        .eq('league_id', leagueRequest.league_id);

      if (currentTeams && currentTeams >= leagueRequest.leagues.max_teams) {
        return NextResponse.json(
          { error: 'League is at maximum capacity' },
          { status: 400 }
        );
      }
    }

    // Update the request status
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const { data: updatedRequest, error: updateError } = await supabase
      .from('team_league_requests')
      .update({
        status: newStatus,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        review_message: review_message?.trim() || null
      })
      .eq('id', requestId)
      .select(`
        *,
        teams:team_id (
          id,
          name,
          team_color
        ),
        leagues:league_id (
          id,
          name,
          description
        ),
        requested_by_user:requested_by (
          email,
          user_profiles (
            display_name,
            full_name
          )
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating request:', updateError);
      return NextResponse.json(
        { error: 'Failed to update request' },
        { status: 500 }
      );
    }

    // Note: The database trigger will automatically update the team's league_id
    // when the request is approved

    const responseMessage = action === 'approve' 
      ? 'Team join request approved successfully'
      : 'Team join request rejected';

    return NextResponse.json({
      data: updatedRequest,
      message: responseMessage
    });

  } catch (error) {
    console.error('Error in POST /api/league-requests/[requestId]/respond:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
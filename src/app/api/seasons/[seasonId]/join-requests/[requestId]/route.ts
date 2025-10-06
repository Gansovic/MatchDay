import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

// PATCH /api/seasons/[seasonId]/join-requests/[requestId] - Update a specific join request
export async function PATCH(
  request: NextRequest,
  { params }: { params: { seasonId: string; requestId: string } }
) {
  try {
    // Using imported supabase client

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { seasonId, requestId } = params;
    const body = await request.json();
    const { status, response_message } = body;

    // Validate input
    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Status is required' },
        { status: 400 }
      );
    }

    // Get the existing request to verify it exists and belongs to the season
    const { data: existingRequest, error: requestError } = await supabase
      .from('season_join_requests')
      .select(`
        *,
        season:seasons (
          id,
          league_id,
          league:leagues (
            id,
            admin_user_id
          )
        )
      `)
      .eq('id', requestId)
      .eq('season_id', seasonId)
      .single();

    if (requestError || !existingRequest) {
      return NextResponse.json(
        { success: false, error: 'Join request not found' },
        { status: 404 }
      );
    }

    // Check request is still pending
    if (existingRequest.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'Only pending requests can be modified' },
        { status: 400 }
      );
    }

    // Handle different update scenarios
    if (status === 'withdrawn') {
      // Only the user who created the request can withdraw it
      if (existingRequest.user_id !== user.id) {
        return NextResponse.json(
          { success: false, error: 'Only the request creator can withdraw the request' },
          { status: 403 }
        );
      }
    } else if (['approved', 'rejected'].includes(status)) {
      // Only league admins can approve/reject
      if (!existingRequest.season?.league?.admin_user_id ||
          existingRequest.season.league.admin_user_id !== user.id) {
        return NextResponse.json(
          { success: false, error: 'Only league admins can approve or reject join requests' },
          { status: 403 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid status. Must be approved, rejected, or withdrawn' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {
      status,
      response_message: response_message || null,
      updated_at: new Date().toISOString()
    };

    // Set responded_by and responded_at for admin actions
    if (['approved', 'rejected'].includes(status)) {
      updateData.responded_by = user.id;
      updateData.responded_at = new Date().toISOString();
    }

    // Update the request (the database trigger will handle team registration for approved requests)
    const { data: updatedRequest, error: updateError } = await supabase
      .from('season_join_requests')
      .update(updateData)
      .eq('id', requestId)
      .eq('season_id', seasonId)
      .select(`
        *,
        team:teams (
          id,
          name,
          team_color
        ),
        user:users!user_id (
          id,
          email
        ),
        responded_by_user:users!responded_by (
          id,
          email
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating join request:', updateError);
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedRequest
    });
  } catch (error) {
    console.error('Error in PATCH /api/seasons/[seasonId]/join-requests/[requestId]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/seasons/[seasonId]/join-requests/[requestId] - Get a specific join request
export async function GET(
  request: NextRequest,
  { params }: { params: { seasonId: string; requestId: string } }
) {
  try {
    // Using imported supabase client

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { seasonId, requestId } = params;

    // Get the join request with related data
    const { data: joinRequest, error } = await supabase
      .from('season_join_requests')
      .select(`
        *,
        team:teams (
          id,
          name,
          team_color,
          captain_id
        ),
        user:users!user_id (
          id,
          email
        ),
        responded_by_user:users!responded_by (
          id,
          email
        ),
        season:seasons (
          id,
          name,
          league:leagues (
            id,
            admin_user_id
          )
        )
      `)
      .eq('id', requestId)
      .eq('season_id', seasonId)
      .single();

    if (error) {
      console.error('Error fetching join request:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    if (!joinRequest) {
      return NextResponse.json(
        { success: false, error: 'Join request not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to view this request
    const isRequestCreator = joinRequest.user_id === user.id;
    const isLeagueAdmin = joinRequest.season?.league?.admin_user_id === user.id;
    const isTeamCaptain = joinRequest.team?.captain_id === user.id;

    if (!isRequestCreator && !isLeagueAdmin && !isTeamCaptain) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to view this request' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: joinRequest
    });
  } catch (error) {
    console.error('Error in GET /api/seasons/[seasonId]/join-requests/[requestId]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
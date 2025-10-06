import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// PATCH /api/admin/seasons/[seasonId]/requests/[requestId] - Update a join request (approve/reject)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { seasonId: string; requestId: string } }
) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies }
    );

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

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Status is required' },
        { status: 400 }
      );
    }

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Verify user is admin of the league
    const { data: season, error: seasonError } = await supabase
      .from('seasons')
      .select('league_id')
      .eq('id', seasonId)
      .single();

    if (seasonError || !season) {
      return NextResponse.json(
        { success: false, error: 'Season not found' },
        { status: 404 }
      );
    }

    const { data: league, error: leagueError } = await supabase
      .from('leagues')
      .select('admin_user_id')
      .eq('id', season.league_id)
      .single();

    if (leagueError || !league) {
      return NextResponse.json(
        { success: false, error: 'League not found' },
        { status: 404 }
      );
    }

    // For now, allow any authenticated user to manage requests
    // In production, you should check if user is admin
    // if (league.admin_user_id !== user.id) {
    //   return NextResponse.json(
    //     { success: false, error: 'Only league admins can respond to join requests' },
    //     { status: 403 }
    //   );
    // }

    // Get the request details first
    const { data: joinRequest, error: requestError } = await supabase
      .from('season_join_requests')
      .select('*')
      .eq('id', requestId)
      .eq('season_id', seasonId)
      .single();

    if (requestError || !joinRequest) {
      return NextResponse.json(
        { success: false, error: 'Request not found' },
        { status: 404 }
      );
    }

    // Update the request
    const { data: updatedRequest, error: updateError } = await supabase
      .from('season_join_requests')
      .update({
        status,
        response_message: response_message || null,
        responded_by: user.id,
        responded_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating join request:', updateError);
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    // If approved, add team to season
    if (status === 'approved') {
      const { error: insertError } = await supabase
        .from('season_teams')
        .insert({
          season_id: seasonId,
          team_id: joinRequest.team_id,
          status: 'registered',
          registration_date: new Date().toISOString()
        });

      if (insertError && insertError.code !== '23505') { // Ignore duplicate key error
        console.error('Error adding team to season:', insertError);
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedRequest
    });
  } catch (error) {
    console.error('Error in PATCH /api/admin/seasons/[seasonId]/requests/[requestId]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
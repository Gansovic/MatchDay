/**
 * API Route: Reject Team Season Join Request
 *
 * POST /api/league-requests/[requestId]/reject
 * Rejects a team's request to join a season
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await params;

    if (!requestId) {
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get the user from the session
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Get user from token
    const { data: { user }, error: authError } = await (supabase as any).auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const { responseMessage } = body;

    // Fetch the join request with season and league info
    const { data: joinRequest, error: fetchError } = await (supabase as any)
      .from('season_join_requests')
      .select(`
        *,
        season:seasons (
          id,
          name,
          league_id,
          leagues (
            id,
            name,
            created_by
          )
        ),
        team:teams (
          id,
          name
        )
      `)
      .eq('id', requestId)
      .single();

    if (fetchError || !joinRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    // Check if user has permission (must be league creator)
    if (joinRequest.season?.leagues?.created_by !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to reject this request' },
        { status: 403 }
      );
    }

    // Check if request is still pending
    if (joinRequest.status !== 'pending') {
      return NextResponse.json(
        { error: `Request has already been ${joinRequest.status}` },
        { status: 409 }
      );
    }

    // Delete the join request
    const { error: deleteError } = await (supabase as any)
      .from('season_join_requests')
      .delete()
      .eq('id', requestId);

    if (deleteError) {
      console.error('Error deleting request:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete request' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Request from team "${joinRequest.team?.name}" has been rejected.`,
      data: {
        requestId: joinRequest.id,
        teamId: joinRequest.team_id,
        seasonId: joinRequest.season_id,
        leagueId: joinRequest.season?.league_id
      }
    });

  } catch (error) {
    console.error('Error rejecting request:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
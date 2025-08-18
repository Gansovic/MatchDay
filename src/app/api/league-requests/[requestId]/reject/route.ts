/**
 * API Route: Reject Team League Request
 * 
 * POST /api/league-requests/[requestId]/reject
 * Rejects a team's request to join a league and triggers notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/client';

export async function POST(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  try {
    const { requestId } = await params;
    
    if (!requestId) {
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      );
    }

    // Get the user from the session
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const supabase = createServerClient();
    
    // Get user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const { responseMessage } = body;

    // Use admin client for database operations to bypass RLS
    const adminSupabase = createAdminClient();

    // First, verify the request exists and admin has permission
    const { data: leagueRequest, error: fetchError } = await adminSupabase
      .from('team_league_requests')
      .select(`
        *,
        teams:team_id (
          id, name, captain_id
        ),
        leagues:league_id (
          id, name, created_by
        )
      `)
      .eq('id', requestId)
      .single();

    if (fetchError || !leagueRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    // Check if admin owns the league
    if ((leagueRequest.leagues as any)?.created_by !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to reject this request' },
        { status: 403 }
      );
    }

    // Check if request is still pending
    if (leagueRequest.status !== 'pending') {
      return NextResponse.json(
        { error: `Request has already been ${leagueRequest.status}` },
        { status: 409 }
      );
    }

    // Reject the request
    const { error: updateError } = await adminSupabase
      .from('team_league_requests')
      .update({
        status: 'rejected',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        review_message: responseMessage || null
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('Error updating request:', updateError);
      return NextResponse.json(
        { error: 'Failed to reject request' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Request rejected successfully',
      data: {
        id: requestId,
        status: 'rejected',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        review_message: responseMessage || null
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
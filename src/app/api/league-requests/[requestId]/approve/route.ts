/**
 * API Route: Approve Team League Request
 * 
 * POST /api/league-requests/[requestId]/approve
 * Approves a team's request to join a league and triggers notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/client';

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_ADMIN_APP_URL || 'http://localhost:3002',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
};

// Helper function to add CORS headers to any response
function addCorsHeaders(response: NextResponse) {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

// Handle preflight OPTIONS request
export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  try {
    const { requestId } = await params;
    
    if (!requestId) {
      return addCorsHeaders(NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      ));
    }

    // Get the user from the session
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return addCorsHeaders(NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      ));
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
          id, name, captain_id, league_id
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
        { error: 'You do not have permission to approve this request' },
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

    // Approve the request - the database trigger will handle the junction table
    const { error: updateError } = await adminSupabase
      .from('team_league_requests')
      .update({
        status: 'approved',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        review_message: responseMessage || null
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('Error updating request:', updateError);
      return NextResponse.json(
        { error: 'Failed to approve request' },
        { status: 500 }
      );
    }

    // The database trigger will automatically:
    // 1. Add/update the team-league relationship in the team_leagues junction table
    // 2. Update the teams.league_id field for backward compatibility
    
    // Verify the team-league relationship was created
    const { data: teamLeague, error: verifyError } = await adminSupabase
      .from('team_leagues')
      .select('*')
      .eq('team_id', leagueRequest.team_id)
      .eq('league_id', leagueRequest.league_id)
      .eq('is_active', true)
      .single();

    if (verifyError) {
      console.error('Warning: Could not verify team-league relationship creation:', verifyError);
      // Continue anyway as the trigger should have handled this
    } else {
      console.log('Team-league relationship confirmed:', teamLeague);
    }

    const response = NextResponse.json({
      success: true,
      message: 'Request approved successfully',
      data: {
        id: requestId,
        status: 'approved',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        review_message: responseMessage || null
      }
    });

    return addCorsHeaders(response);

  } catch (error) {
    console.error('Error approving request:', error);
    
    const response = NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );

    return addCorsHeaders(response);
  }
}
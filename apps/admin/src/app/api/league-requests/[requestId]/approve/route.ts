/**
 * API Route: Approve Team Season Join Request
 *
 * POST /api/league-requests/[requestId]/approve
 * Approves a team's request to join a season
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  console.log('🚀 APPROVE ENDPOINT HIT - Starting approval process');
  try {
    const { requestId } = await params;
    console.log('📝 Request ID:', requestId);

    if (!requestId) {
      console.log('❌ ERROR: No request ID provided');
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    console.log('✅ Admin client created');

    // Get the user from the session
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ ERROR: No authorization header');
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Get user from token
    const { data: { user }, error: authError } = await (supabase as any).auth.getUser(token);

    if (authError || !user) {
      console.log('❌ ERROR: Auth failed', authError);
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }
    console.log('✅ User authenticated:', user.id);

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const { responseMessage } = body;
    console.log('📄 Request body parsed, responseMessage:', responseMessage);

    // Fetch the join request with season and league info
    console.log('🔍 Fetching join request from database...');
    const { data: joinRequest, error: fetchError } = await (supabase as any)
      .from('season_join_requests')
      .select(`
        *,
        season:seasons (
          id,
          name,
          league_id,
          status,
          max_teams,
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
      console.log('❌ ERROR: Request not found', fetchError);
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }
    console.log('✅ Join request found, status:', joinRequest.status);

    // Check if user has permission (must be league creator)
    console.log('🔒 Checking permissions. Created by:', joinRequest.season?.leagues?.created_by, 'User:', user.id);
    if (joinRequest.season?.leagues?.created_by !== user.id) {
      console.log('❌ ERROR: Permission denied');
      return NextResponse.json(
        { error: 'You do not have permission to approve this request' },
        { status: 403 }
      );
    }
    console.log('✅ Permission check passed');

    // Check if request is still pending or if it's approved but team wasn't added yet
    console.log('📊 Checking request status:', joinRequest.status);
    if (joinRequest.status !== 'pending' && joinRequest.status !== 'approved') {
      console.log(`❌ ERROR: Request ${requestId} has already been ${joinRequest.status}`);
      return NextResponse.json(
        { error: `Request has already been ${joinRequest.status}` },
        { status: 409 }
      );
    }
    console.log('✅ Status check passed');

    // If already approved, check if team was actually added to season
    if (joinRequest.status === 'approved') {
      const { data: teamInSeason } = await (supabase as any)
        .from('season_teams')
        .select('id')
        .eq('season_id', joinRequest.season_id)
        .eq('team_id', joinRequest.team_id)
        .single();

      if (teamInSeason) {
        // Team was already successfully added
        return NextResponse.json({
          success: true,
          message: `Team "${joinRequest.team?.name}" is already registered in "${joinRequest.season?.name}"`,
          data: {
            requestId: joinRequest.id,
            teamId: joinRequest.team_id,
            seasonId: joinRequest.season_id,
            leagueId: joinRequest.season?.league_id
          }
        });
      }

      // Request was approved but team wasn't added - complete the process
      console.log(`Request ${requestId} was approved but team wasn't added yet. Completing approval...`);
    }

    // Check if season is accepting registrations
    if (joinRequest.season?.status !== 'draft' && joinRequest.season?.status !== 'registration') {
      return NextResponse.json(
        { error: 'Season is not accepting new team registrations' },
        { status: 400 }
      );
    }

    // Check max teams limit
    if (joinRequest.season?.max_teams) {
      const { count: teamCount } = await (supabase as any)
        .from('season_teams')
        .select('*', { count: 'exact', head: true })
        .eq('season_id', joinRequest.season_id)
        .in('status', ['registered', 'confirmed']);

      if (teamCount && teamCount >= joinRequest.season.max_teams) {
        return NextResponse.json(
          { error: 'Season has reached maximum team capacity' },
          { status: 400 }
        );
      }
    }

    // Check if team is already in this season
    const { data: existingTeam } = await (supabase as any)
      .from('season_teams')
      .select('id')
      .eq('season_id', joinRequest.season_id)
      .eq('team_id', joinRequest.team_id)
      .single();

    if (existingTeam) {
      return NextResponse.json(
        { error: `Team "${joinRequest.team?.name}" is already registered for this season` },
        { status: 400 }
      );
    }

    // Add team to season_teams table
    const now = new Date().toISOString();
    console.log('📝 Adding team to season_teams...');

    const { error: addTeamError } = await (supabase as any)
      .from('season_teams')
      .insert({
        season_id: joinRequest.season_id,
        team_id: joinRequest.team_id,
        status: 'registered',
        registration_date: now
      });

    // Handle team insert errors
    if (addTeamError) {
      console.error('Error adding team to season:', addTeamError);

      // If duplicate key error, team is already registered - this is OK
      if (addTeamError.code === '23505') {
        console.log('✅ Team already in season (duplicate), treating as success');
      } else {
        // For other errors, return 500
        return NextResponse.json(
          { error: 'Failed to add team to season' },
          { status: 500 }
        );
      }
    } else {
      console.log('✅ Team successfully added to season');
    }

    // Delete the request (whether team was newly added or already existed)
    console.log('🗑️ Deleting join request...');
    const { error: deleteError } = await (supabase as any)
      .from('season_join_requests')
      .delete()
      .eq('id', requestId);

    if (deleteError) {
      console.error('Error deleting request:', deleteError);
      // Don't fail the request if delete fails - team is already in season
      console.warn('⚠️ Team was added but request could not be deleted');
    } else {
      console.log('✅ Join request deleted successfully');
    }

    return NextResponse.json({
      success: true,
      message: `Team "${joinRequest.team?.name}" has been approved and added to "${joinRequest.season?.name}"!`,
      data: {
        requestId: joinRequest.id,
        teamId: joinRequest.team_id,
        seasonId: joinRequest.season_id,
        leagueId: joinRequest.season?.league_id
      }
    });

  } catch (error) {
    console.error('Error approving request:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
/**
 * Team League Request API Route
 * 
 * Handles team requests to join leagues with support for auto-approval.
 * Integrates with the new LeagueRequestService for Copa Facil-style functionality.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { LeagueRequestService, CreateTeamRequestData } from '@/lib/services/league-request.service';

export async function POST(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    // Create authenticated client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies }
    );
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { teamId } = params;
    const body = await request.json();
    const { league_id, message } = body;

    // Validate required fields
    if (!league_id) {
      return NextResponse.json(
        { error: 'League ID is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Verify user is captain of the team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('id, name, captain_id, league_id')
      .eq('id', teamId)
      .eq('captain_id', user.id)
      .single();

    if (teamError || !team) {
      return NextResponse.json(
        { 
          error: 'Team not found or you are not the captain', 
          code: 'TEAM_NOT_FOUND' 
        },
        { status: 404 }
      );
    }

    // Check if team is already in a league
    if (team.league_id) {
      return NextResponse.json(
        { 
          error: 'Team is already in a league', 
          code: 'TEAM_ALREADY_IN_LEAGUE' 
        },
        { status: 400 }
      );
    }

    // Create the league request using our new service
    const leagueRequestService = LeagueRequestService.getInstance();
    
    const requestData: CreateTeamRequestData = {
      teamId,
      leagueId: league_id,
      requestedBy: user.id,
      message: message?.trim() || undefined
    };

    const result = await leagueRequestService.createTeamRequest(requestData);

    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.error?.message || 'Failed to create team request',
          code: result.error?.code || 'REQUEST_FAILED'
        },
        { status: 400 }
      );
    }

    // Return success with appropriate message
    const isAutoApproved = result.data?.status === 'approved';
    
    return NextResponse.json({
      data: result.data,
      success: true,
      message: result.message || (isAutoApproved 
        ? 'Team joined league successfully!' 
        : 'Team request submitted successfully'
      ),
      auto_approved: isAutoApproved
    });

  } catch (error) {
    console.error('Team league request API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}
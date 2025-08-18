/**
 * League Request Management API Routes
 * 
 * Handles league admin operations for team join requests:
 * - GET: Get all pending requests for a league
 * - PUT: Approve/reject team join requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

interface RouteContext {
  params: {
    leagueId: string;
  };
}

/**
 * GET /api/leagues/[leagueId]/requests
 * Get all team join requests for a league (for league admins)
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { leagueId } = params;
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

    // Verify user is the league admin/creator
    const { data: league, error: leagueError } = await supabase
      .from('leagues')
      .select('created_by, name')
      .eq('id', leagueId)
      .single();

    if (leagueError || !league) {
      return NextResponse.json(
        { error: 'League not found' },
        { status: 404 }
      );
    }

    if (league.created_by !== user.id) {
      return NextResponse.json(
        { error: 'Only league administrators can view requests' },
        { status: 403 }
      );
    }

    // Extract query parameters for filtering
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'pending';

    // Get all requests for this league
    let query = supabase
      .from('team_league_requests')
      .select(`
        *,
        teams:team_id (
          id,
          name,
          team_color,
          team_bio,
          max_players,
          min_players,
          captain_id,
          team_members (
            count
          )
        ),
        requested_by_user:requested_by (
          email,
          user_profiles (
            display_name,
            full_name
          )
        ),
        reviewed_by_user:reviewed_by (
          email,
          user_profiles (
            display_name,
            full_name
          )
        )
      `)
      .eq('league_id', leagueId)
      .order('created_at', { ascending: false });

    // Apply status filter
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: requests, error } = await query;

    if (error) {
      console.error('Error fetching league requests:', error);
      return NextResponse.json(
        { error: 'Failed to fetch league requests' },
        { status: 500 }
      );
    }

    // Transform data to include team member count
    const transformedRequests = requests?.map(request => ({
      ...request,
      teams: {
        ...request.teams,
        member_count: request.teams?.team_members?.[0]?.count || 0
      }
    })) || [];

    return NextResponse.json({
      data: transformedRequests,
      message: 'League requests retrieved successfully',
      count: transformedRequests.length
    });

  } catch (error) {
    console.error('Error in GET /api/leagues/[leagueId]/requests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
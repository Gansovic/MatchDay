/**
 * API Route: League Requests
 * 
 * GET /api/league-requests
 * Fetches league requests for the authenticated admin
 */

import { NextRequest, NextResponse } from 'next/server';
import { LeagueRequestService } from '@/lib/services/league-request.service';
import { createAdminClient } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();

    // Try to get the user from the session first
    const { data: { user }, error: sessionError } = await supabase.auth.getUser();
    
    // If no user in session, check for authorization header
    let authenticatedUser = user;
    
    if (!authenticatedUser) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const { data: { user: tokenUser }, error: authError } = await supabase.auth.getUser(token);
        if (!authError && tokenUser) {
          authenticatedUser = tokenUser;
        }
      }
    }

    // Fetch pending season join requests
    const { data: requests, error } = await supabase
      .from('season_join_requests')
      .select(`
        id,
        team_id,
        season_id,
        user_id,
        message,
        status,
        created_at,
        updated_at,
        team:teams (
          id,
          name,
          team_color
        ),
        season:seasons (
          id,
          name,
          league_id,
          leagues (
            id,
            name
          )
        )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false});

    if (error) {
      console.error('Error fetching league requests:', error);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to fetch requests',
          message: error.message
        },
        { status: 500 }
      );
    }

    // Transform the data to match expected format
    const transformedRequests = (requests || []).map(req => ({
      id: req.id,
      team_id: req.team_id,
      season_id: req.season_id,
      league_id: req.season?.league_id,
      user_id: req.user_id,
      message: req.message,
      status: req.status,
      created_at: req.created_at,
      updated_at: req.updated_at,
      team: req.team,
      season: req.season,
      league: {
        id: req.season?.leagues?.id,
        name: req.season?.leagues?.name
      },
      requested_by_user: {
        display_name: null,
        full_name: null
      }
    }));

    return NextResponse.json({
      success: true,
      data: transformedRequests,
      count: transformedRequests.length
    });

  } catch (error) {
    console.error('Error fetching league requests:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
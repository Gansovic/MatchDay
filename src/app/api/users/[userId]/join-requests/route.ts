import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// GET /api/users/[userId]/join-requests - Get all join requests for a specific user
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { userId } = params;

    // Users can only view their own requests unless they are league admins
    if (userId !== user.id) {
      // Check if the current user is a league admin who can view these requests
      // We'll validate this by checking if any of the requests are for seasons
      // in leagues they administer
      const { data: adminCheck } = await supabase
        .from('season_join_requests')
        .select(`
          id,
          season:seasons (
            league:leagues (
              created_by
            )
          )
        `)
        .eq('user_id', userId)
        .limit(1);

      const isLeagueAdmin = adminCheck?.some(request =>
        request.season?.league?.created_by === user.id
      );

      if (!isLeagueAdmin) {
        return NextResponse.json(
          { success: false, error: 'Insufficient permissions to view these requests' },
          { status: 403 }
        );
      }
    }

    // Parse query parameters for filtering
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const seasonId = url.searchParams.get('seasonId');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Build the query
    let query = supabase
      .from('season_join_requests')
      .select(`
        *,
        team:teams (
          id,
          name,
          team_color,
          captain_id
        ),
        season:seasons (
          id,
          name,
          display_name,
          season_year,
          start_date,
          end_date,
          league:leagues (
            id,
            name,
            created_by
          )
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
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters if provided
    if (status) {
      query = query.eq('status', status);
    }
    if (seasonId) {
      query = query.eq('season_id', seasonId);
    }

    const { data: requests, error } = await query;

    if (error) {
      console.error('Error fetching user join requests:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('season_join_requests')
      .select('id', { count: 'exact' })
      .eq('user_id', userId);

    if (status) {
      countQuery = countQuery.eq('status', status);
    }
    if (seasonId) {
      countQuery = countQuery.eq('season_id', seasonId);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Error counting user join requests:', countError);
    }

    return NextResponse.json({
      success: true,
      data: requests || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    });
  } catch (error) {
    console.error('Error in GET /api/users/[userId]/join-requests:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
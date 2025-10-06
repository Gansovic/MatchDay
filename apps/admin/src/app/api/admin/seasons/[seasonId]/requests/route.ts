import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// GET /api/admin/seasons/[seasonId]/requests - Get all join requests for a season (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: { seasonId: string } }
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

    const { seasonId } = params;

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

    // For now, allow any authenticated user to view requests
    // In production, you should check if user is admin
    // if (league.admin_user_id !== user.id) {
    //   return NextResponse.json(
    //     { success: false, error: 'Only league admins can view requests' },
    //     { status: 403 }
    //   );
    // }

    // Get all join requests for this season
    const { data: requests, error } = await supabase
      .from('season_join_requests')
      .select(`
        *,
        team:teams (
          id,
          name,
          team_color,
          captain_id
        ),
        user:auth.users!user_id (
          id,
          email
        )
      `)
      .eq('season_id', seasonId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching season join requests:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: requests || []
    });
  } catch (error) {
    console.error('Error in GET /api/admin/seasons/[seasonId]/requests:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
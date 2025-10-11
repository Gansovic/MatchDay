/**
 * API Route: Season Fixtures
 *
 * GET /api/seasons/[seasonId]/fixtures - Get all fixtures for a season
 * DELETE /api/seasons/[seasonId]/fixtures - Delete all fixtures for a season
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ seasonId: string }> }
) {
  try {
    const { seasonId } = await params;

    if (!seasonId) {
      return NextResponse.json(
        { error: 'Season ID is required' },
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

    // Fetch the season with league info
    const { data: season, error: fetchError } = await (supabase as any)
      .from('seasons')
      .select(`
        id,
        name,
        leagues (
          id,
          created_by
        )
      `)
      .eq('id', seasonId)
      .single();

    if (fetchError || !season) {
      return NextResponse.json(
        { error: 'Season not found' },
        { status: 404 }
      );
    }

    // Check if user has permission (must be league creator)
    if (season.leagues?.created_by !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to view fixtures for this season' },
        { status: 403 }
      );
    }

    // Fetch fixtures with team information
    const { data: fixtures, error: fixturesError } = await (supabase as any)
      .from('matches')
      .select(`
        *,
        home_team:teams!matches_home_team_id_fkey (
          id,
          name,
          team_color
        ),
        away_team:teams!matches_away_team_id_fkey (
          id,
          name,
          team_color
        )
      `)
      .eq('season_id', seasonId)
      .order('matchday_number', { ascending: true })
      .order('match_date', { ascending: true })
      .order('match_time', { ascending: true });

    if (fixturesError) {
      console.error('Error fetching fixtures:', fixturesError);
      return NextResponse.json(
        { error: 'Failed to fetch fixtures' },
        { status: 500 }
      );
    }

    // Group fixtures by matchday
    const fixturesByMatchday: { [key: number]: any[] } = {};
    fixtures?.forEach(fixture => {
      const matchday = fixture.matchday_number || 0;
      if (!fixturesByMatchday[matchday]) {
        fixturesByMatchday[matchday] = [];
      }
      fixturesByMatchday[matchday].push(fixture);
    });

    return NextResponse.json({
      success: true,
      data: {
        fixtures: fixtures || [],
        fixturesByMatchday,
        totalMatches: fixtures?.length || 0,
        totalMatchdays: Object.keys(fixturesByMatchday).length
      }
    });

  } catch (error) {
    console.error('Error fetching fixtures:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ seasonId: string }> }
) {
  console.log('🚀 DELETE FIXTURES ENDPOINT HIT');
  try {
    const { seasonId } = await params;
    console.log('📝 Season ID:', seasonId);

    if (!seasonId) {
      console.log('❌ ERROR: No season ID provided');
      return NextResponse.json(
        { error: 'Season ID is required' },
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

    // Fetch the season with league info
    console.log('🔍 Fetching season from database...');
    const { data: season, error: fetchError } = await (supabase as any)
      .from('seasons')
      .select(`
        *,
        leagues (
          id,
          name,
          created_by
        )
      `)
      .eq('id', seasonId)
      .single();

    if (fetchError || !season) {
      console.log('❌ ERROR: Season not found', fetchError);
      return NextResponse.json(
        { error: 'Season not found' },
        { status: 404 }
      );
    }
    console.log('✅ Season found:', season.name);

    // Check if user has permission (must be league creator)
    console.log('🔒 Checking permissions. Created by:', season.leagues?.created_by, 'User:', user.id);
    if (season.leagues?.created_by !== user.id) {
      console.log('❌ ERROR: Permission denied');
      return NextResponse.json(
        { error: 'You do not have permission to delete fixtures for this season' },
        { status: 403 }
      );
    }
    console.log('✅ Permission check passed');

    // Check if season is in progress or completed
    if (season.status === 'active' || season.status === 'completed') {
      console.log('⚠️ WARNING: Cannot delete fixtures for active/completed season');
      return NextResponse.json(
        {
          error: 'Cannot delete fixtures',
          message: 'Fixtures cannot be deleted for seasons that are active or completed'
        },
        { status: 409 }
      );
    }

    // Count existing fixtures
    const { count: fixturesCount } = await (supabase as any)
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .eq('season_id', seasonId);

    if (!fixturesCount || fixturesCount === 0) {
      console.log('ℹ️ No fixtures to delete');
      return NextResponse.json({
        success: true,
        message: 'No fixtures to delete',
        data: { deletedCount: 0 }
      });
    }

    // Delete all fixtures for this season
    console.log(`🗑️ Deleting ${fixturesCount} fixtures...`);
    const { error: deleteError } = await (supabase as any)
      .from('matches')
      .delete()
      .eq('season_id', seasonId);

    if (deleteError) {
      console.error('❌ ERROR: Delete failed', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete fixtures' },
        { status: 500 }
      );
    }

    console.log('✅ Fixtures deleted successfully');

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${fixturesCount} fixtures`,
      data: { deletedCount: fixturesCount }
    });

  } catch (error) {
    console.error('Error deleting fixtures:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

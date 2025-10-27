/**
 * Season Statistics Recalculation API Route
 *
 * POST /api/seasons/[seasonId]/recalculate-stats
 * Recalculate all player and team statistics for a season from match events
 *
 * This is an admin function to fix historical data or after bulk changes
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { StatsService } from '@matchday/services';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@matchday/database';

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

/**
 * POST /api/seasons/[seasonId]/recalculate-stats
 * Recalculate season statistics
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ seasonId: string }> }
) {
  try {
    const { seasonId } = await params;
    console.log('🔄 POST /api/seasons/[seasonId]/recalculate-stats:', seasonId);

    // Check authentication - get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, data: null, error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Create a regular client to validate the user token first
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const userClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();

    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { success: false, data: null, error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated:', user.id);

    // Create admin client for database operations
    const adminSupabase = createAdminClient();

    // Fetch the season with league info to check permissions
    const { data: season, error: seasonError } = await (adminSupabase as any)
      .from('seasons')
      .select(`
        id,
        name,
        season_year,
        league_id,
        leagues!inner (
          id,
          name,
          created_by
        )
      `)
      .eq('id', seasonId)
      .single();

    if (seasonError || !season) {
      console.log('❌ ERROR: Season not found', seasonError);
      return NextResponse.json(
        { success: false, data: null, error: 'Season not found' },
        { status: 404 }
      );
    }

    console.log('✅ Season found:', season.name);

    // Check if user has permission (must be league creator - same as fixture generation)
    console.log('🔒 Checking permissions. Created by:', season.leagues?.created_by, 'User:', user.id);
    if (season.leagues?.created_by !== user.id) {
      console.log('❌ ERROR: Permission denied');
      return NextResponse.json(
        { success: false, data: null, error: 'You do not have permission to recalculate stats for this season' },
        { status: 403 }
      );
    }

    console.log('✅ Permission check passed');

    // Get stats service instance
    const statsService = StatsService.getInstance(adminSupabase);

    // Recalculate stats
    const result = await statsService.recalculateSeasonStats(seasonId);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: result.error?.message || 'Failed to recalculate statistics'
        },
        { status: 500 }
      );
    }

    console.log('✅ Stats recalculated successfully:', result.data);

    const response = NextResponse.json({
      success: true,
      data: {
        season: {
          id: season.id,
          name: season.name,
          season_year: season.season_year
        },
        stats: result.data
      },
      message: `Successfully recalculated statistics for ${season.name}`,
      error: null
    });

    response.headers.set('Access-Control-Allow-Origin', '*');
    return response;

  } catch (error) {
    console.error('Error in POST /api/seasons/[seasonId]/recalculate-stats:', error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

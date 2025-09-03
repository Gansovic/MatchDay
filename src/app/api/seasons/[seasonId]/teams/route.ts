/**
 * Season Teams API Routes
 * 
 * Handles team registration for seasons:
 * - GET /api/seasons/[seasonId]/teams - Get all teams registered for a season
 * - POST /api/seasons/[seasonId]/teams - Register a team for a season
 * - DELETE /api/seasons/[seasonId]/teams/[teamId] - Remove team from season
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server-client';
import { SeasonService } from '@/lib/services/season.service';

interface RouteParams {
  params: Promise<{ seasonId: string }>;
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

/**
 * GET /api/seasons/[seasonId]/teams
 * Get all teams registered for a season
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { seasonId } = await params;

    if (!seasonId) {
      return NextResponse.json(
        { success: false, error: 'Season ID is required' },
        { status: 400 }
      );
    }

    // Validate seasonId format (basic UUID validation)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(seasonId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid season ID format' },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();
    const seasonService = SeasonService.getInstance(supabase);

    const result = await seasonService.getSeasonDetails(seasonId);

    if (!result.success) {
      if (result.error?.code === 'SEASON_NOT_FOUND') {
        return NextResponse.json(
          { success: false, error: 'Season not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to get season teams' },
        { status: 500 }
      );
    }

    const jsonResponse = NextResponse.json({
      success: true,
      data: result.data?.teams || [],
      message: 'Season teams retrieved successfully'
    });

    // Add CORS headers
    jsonResponse.headers.set('Access-Control-Allow-Origin', '*');
    jsonResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    jsonResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return jsonResponse;

  } catch (error) {
    console.error('Error in GET /api/seasons/[seasonId]/teams:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/seasons/[seasonId]/teams
 * Register a team for a season
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { seasonId } = await params;
    const body = await request.json();

    if (!seasonId) {
      return NextResponse.json(
        { success: false, error: 'Season ID is required' },
        { status: 400 }
      );
    }

    // Validate seasonId format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(seasonId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid season ID format' },
        { status: 400 }
      );
    }

    const { team_id } = body;
    if (!team_id) {
      return NextResponse.json(
        { success: false, error: 'Team ID is required' },
        { status: 400 }
      );
    }

    // Validate team_id format
    if (!uuidRegex.test(team_id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid team ID format' },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();
    const seasonService = SeasonService.getInstance(supabase);

    // Check if team exists
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('id, name, team_color, captain_id')
      .eq('id', team_id)
      .single();

    if (teamError) {
      if (teamError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Team not found' },
          { status: 404 }
        );
      }
      throw teamError;
    }

    const result = await seasonService.registerTeamForSeason(seasonId, team_id);

    if (!result.success) {
      if (result.error?.code === 'ALREADY_REGISTERED') {
        return NextResponse.json(
          { success: false, error: 'Team is already registered for this season' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to register team for season' },
        { status: 500 }
      );
    }

    const jsonResponse = NextResponse.json({
      success: true,
      data: result.data,
      message: result.message || 'Team registered for season successfully'
    });

    // Add CORS headers
    jsonResponse.headers.set('Access-Control-Allow-Origin', '*');
    jsonResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    jsonResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return jsonResponse;

  } catch (error) {
    console.error('Error in POST /api/seasons/[seasonId]/teams:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
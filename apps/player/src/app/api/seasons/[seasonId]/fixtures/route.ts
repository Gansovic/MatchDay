/**
 * Season Fixtures API Routes
 * 
 * Handles fixture operations for a season:
 * - GET /api/seasons/[seasonId]/fixtures - Get all fixtures for a season
 * - POST /api/seasons/[seasonId]/fixtures - Generate fixtures for a season
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server-client';
import { SeasonService } from '@matchday/services';

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
 * GET /api/seasons/[seasonId]/fixtures
 * Get all fixtures/matches for a season
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

    const result = await seasonService.getSeasonMatches(seasonId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to get season fixtures' },
        { status: 500 }
      );
    }

    const jsonResponse = NextResponse.json({
      success: true,
      data: result.data,
      message: result.message || 'Season fixtures retrieved successfully'
    });

    // Add CORS headers
    jsonResponse.headers.set('Access-Control-Allow-Origin', '*');
    jsonResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    jsonResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return jsonResponse;

  } catch (error) {
    console.error('Error in GET /api/seasons/[seasonId]/fixtures:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/seasons/[seasonId]/fixtures
 * Generate fixtures for a season
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { seasonId } = await params;

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

    const supabase = createAdminSupabaseClient();
    const seasonService = SeasonService.getInstance(supabase);

    // Check if season exists
    const seasonDetails = await seasonService.getSeasonDetails(seasonId);
    if (!seasonDetails.success) {
      if (seasonDetails.error?.code === 'SEASON_NOT_FOUND') {
        return NextResponse.json(
          { success: false, error: 'Season not found' },
          { status: 404 }
        );
      }
      throw seasonDetails.error;
    }

    const result = await seasonService.generateFixtures(seasonId);

    if (!result.success) {
      if (result.error?.code === 'INSUFFICIENT_TEAMS') {
        return NextResponse.json(
          { success: false, error: 'Need at least 2 teams to generate fixtures' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to generate fixtures' },
        { status: 500 }
      );
    }

    const jsonResponse = NextResponse.json({
      success: true,
      data: result.data,
      message: result.message || 'Fixtures generated successfully'
    });

    // Add CORS headers
    jsonResponse.headers.set('Access-Control-Allow-Origin', '*');
    jsonResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    jsonResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return jsonResponse;

  } catch (error) {
    console.error('Error in POST /api/seasons/[seasonId]/fixtures:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
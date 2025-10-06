/**
 * Individual Season API Routes
 * 
 * Handles individual season operations:
 * - GET /api/seasons/[seasonId] - Get detailed season information
 * - PUT /api/seasons/[seasonId] - Update season information
 * - DELETE /api/seasons/[seasonId] - Delete season
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
 * GET /api/seasons/[seasonId]
 * Get detailed information for a specific season
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
        { success: false, error: result.error || 'Failed to get season details' },
        { status: 500 }
      );
    }

    const jsonResponse = NextResponse.json({
      success: true,
      data: result.data,
      message: result.message || 'Season details retrieved successfully'
    });

    // Add CORS headers
    jsonResponse.headers.set('Access-Control-Allow-Origin', '*');
    jsonResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    jsonResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return jsonResponse;

  } catch (error) {
    console.error('Error in GET /api/seasons/[seasonId]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/seasons/[seasonId]
 * Update season information
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    // Validate dates if provided
    if (body.start_date && body.end_date) {
      const startDate = new Date(body.start_date);
      const endDate = new Date(body.end_date);
      if (startDate >= endDate) {
        return NextResponse.json(
          { success: false, error: 'End date must be after start date' },
          { status: 400 }
        );
      }
    }

    const supabase = createAdminSupabaseClient();
    const seasonService = SeasonService.getInstance(supabase);

    const result = await seasonService.updateSeason(seasonId, body);

    if (!result.success) {
      if (result.error?.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Season not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to update season' },
        { status: 500 }
      );
    }

    const jsonResponse = NextResponse.json({
      success: true,
      data: result.data,
      message: result.message || 'Season updated successfully'
    });

    // Add CORS headers
    jsonResponse.headers.set('Access-Control-Allow-Origin', '*');
    jsonResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    jsonResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return jsonResponse;

  } catch (error) {
    console.error('Error in PUT /api/seasons/[seasonId]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
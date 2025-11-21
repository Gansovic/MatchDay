import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { MediaService } from '@matchday/services';

/**
 * GET /api/media/season/[seasonId]/icon
 * Get season icon with automatic fallback to league icon
 * Query params: leagueId (required)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ seasonId: string }> }
) {
  try {
    const { seasonId } = await params;
    const supabase = createAdminClient();

    const { searchParams } = new URL(request.url);
    const leagueId = searchParams.get('leagueId');

    if (!leagueId) {
      return NextResponse.json(
        { error: 'leagueId query parameter is required' },
        { status: 400 }
      );
    }

    const mediaService = MediaService.getInstance(supabase);
    const result = await mediaService.getSeasonIcon(seasonId, leagueId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error?.message || 'Failed to fetch icon' },
        { status: 500 }
      );
    }

    if (!result.data) {
      // Return 204 No Content instead of 404 - no icon is a valid state
      return new NextResponse(null, { status: 204 });
    }

    return NextResponse.json({ icon: result.data });

  } catch (error) {
    console.error('Error fetching season icon:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/media/season/[seasonId]/icon
 * Delete season icon
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ seasonId: string }> }
) {
  try {
    const { seasonId } = await params;
    const supabase = createAdminClient();

    const mediaService = MediaService.getInstance(supabase);

    // Get user ID from request headers if needed
    const userId = request.headers.get('x-user-id') || '';
    const result = await mediaService.deleteSeasonIcon(seasonId, userId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error?.message || 'Failed to delete icon' },
        { status: result.error?.code === 'NOT_FOUND' ? 404 : 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting season icon:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

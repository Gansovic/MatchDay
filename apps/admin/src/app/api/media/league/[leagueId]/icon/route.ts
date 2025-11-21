import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { MediaService } from '@matchday/services';

/**
 * GET /api/media/league/[leagueId]/icon
 * Get league icon
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ leagueId: string }> }
) {
  try {
    const { leagueId } = await params;
    const supabase = createAdminClient();
    const mediaService = MediaService.getInstance(supabase);
    const result = await mediaService.getLeagueIcon(leagueId);

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
    console.error('Error fetching league icon:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/media/league/[leagueId]/icon
 * Delete league icon
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ leagueId: string }> }
) {
  try {
    const { leagueId } = await params;
    const supabase = createAdminClient();

    // Note: Admin client bypasses auth, but we still need user ID for ownership
    // This should be passed from the client or extracted from session
    // For now, we'll let MediaService handle the deletion with empty user check
    const mediaService = MediaService.getInstance(supabase);

    // Get user ID from request headers or session if needed
    const userId = request.headers.get('x-user-id') || '';
    const result = await mediaService.deleteLeagueIcon(leagueId, userId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error?.message || 'Failed to delete icon' },
        { status: result.error?.code === 'NOT_FOUND' ? 404 : 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting league icon:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

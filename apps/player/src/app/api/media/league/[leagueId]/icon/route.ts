import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server-client';
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
    const supabase = await createServerSupabaseClient();
    const mediaService = MediaService.getInstance(supabase);
    const result = await mediaService.getLeagueIcon(leagueId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error?.message || 'Failed to fetch icon' },
        { status: 500 }
      );
    }

    if (!result.data) {
      return NextResponse.json(
        { error: 'Icon not found' },
        { status: 404 }
      );
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
    const supabase = await createServerSupabaseClient();
    const mediaService = MediaService.getInstance(supabase);

    // Get user ID from authenticated session
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const result = await mediaService.deleteLeagueIcon(leagueId, user.id);

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

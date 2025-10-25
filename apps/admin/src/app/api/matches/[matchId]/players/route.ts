import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { MatchService } from '@matchday/services';

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

/**
 * GET /api/matches/[matchId]/players
 * Get team players for a match (for dropdowns in results entry)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await params;
    const supabase = createAdminClient();

    // Get match service instance
    const matchService = MatchService.getInstance(supabase);

    // Get team players
    const result = await matchService.getTeamPlayersForMatch(matchId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, data: null, error: result.error?.message || 'Failed to fetch team players' },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      success: true,
      data: result.data,
      error: null
    });

    response.headers.set('Access-Control-Allow-Origin', '*');
    return response;

  } catch (error) {
    console.error('API error in GET /api/matches/[matchId]/players:', error);
    return NextResponse.json(
      { success: false, data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

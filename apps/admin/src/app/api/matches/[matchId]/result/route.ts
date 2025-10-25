import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { MatchService } from '@matchday/services';

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

/**
 * PATCH /api/matches/[matchId]/result
 * Update match result with final score, man of match, and lineups
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await params;
    const supabase = createAdminClient();

    // Check authentication - get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, data: null, error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json(
        { success: false, data: null, error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { homeScore, awayScore, manOfMatchId, homeLineup, awayLineup, status } = body;

    // Validate required fields
    if (homeScore === undefined || awayScore === undefined) {
      return NextResponse.json(
        { success: false, data: null, error: 'Home and away scores are required' },
        { status: 400 }
      );
    }

    // Get match service instance
    const matchService = MatchService.getInstance(supabase);

    // Update match result
    const result = await matchService.updateMatchResult({
      matchId,
      homeScore,
      awayScore,
      manOfMatchId,
      homeLineup,
      awayLineup,
      status
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, data: null, error: result.error?.message || 'Failed to update match result' },
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
    console.error('API error in PATCH /api/matches/[matchId]/result:', error);
    return NextResponse.json(
      { success: false, data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

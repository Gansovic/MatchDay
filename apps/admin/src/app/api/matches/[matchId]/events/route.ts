import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { MatchService } from '@matchday/services';

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

/**
 * GET /api/matches/[matchId]/events
 * Get all events for a match
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

    // Get match events
    const result = await matchService.getMatchEvents(matchId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, data: null, error: result.error?.message || 'Failed to fetch match events' },
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
    console.error('API error in GET /api/matches/[matchId]/events:', error);
    return NextResponse.json(
      { success: false, data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/matches/[matchId]/events
 * Record a new match event (goal, card, substitution, etc.)
 */
export async function POST(
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
    const { teamId, playerId, eventType, eventTime, description, assistPlayerId } = body;

    // Validate required fields
    if (!teamId || !eventType) {
      return NextResponse.json(
        { success: false, data: null, error: 'Team ID and event type are required' },
        { status: 400 }
      );
    }

    // Validate event type
    const validEventTypes = ['goal', 'assist', 'yellow_card', 'red_card', 'substitution', 'penalty'];
    if (!validEventTypes.includes(eventType)) {
      return NextResponse.json(
        { success: false, data: null, error: `Invalid event type. Must be one of: ${validEventTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Get match service instance
    const matchService = MatchService.getInstance(supabase);

    // Record match event
    const result = await matchService.recordMatchEvent({
      matchId,
      teamId,
      playerId,
      eventType,
      eventTime,
      description,
      assistPlayerId
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, data: null, error: result.error?.message || 'Failed to record match event' },
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
    console.error('API error in POST /api/matches/[matchId]/events:', error);
    return NextResponse.json(
      { success: false, data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

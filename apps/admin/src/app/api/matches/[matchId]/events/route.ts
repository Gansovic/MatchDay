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

/**
 * DELETE /api/matches/[matchId]/events?eventId=xxx
 * Delete a match event
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await params;
    const supabase = createAdminClient();

    // Check authentication
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

    // Get eventId from query params
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json(
        { success: false, data: null, error: 'Event ID is required' },
        { status: 400 }
      );
    }

    // Delete the event
    const { error: deleteError } = await supabase
      .from('match_events')
      .delete()
      .eq('id', eventId)
      .eq('match_id', matchId);

    if (deleteError) {
      console.error('❌ Error deleting event:', deleteError);
      return NextResponse.json(
        { success: false, data: null, error: deleteError.message },
        { status: 500 }
      );
    }

    // Recalculate match scores after deleting a goal
    await updateMatchScores(supabase, matchId);

    console.log('✅ Event deleted successfully');

    const response = NextResponse.json({
      success: true,
      data: null,
      error: null
    });

    response.headers.set('Access-Control-Allow-Origin', '*');
    return response;

  } catch (error) {
    console.error('API error in DELETE /api/matches/[matchId]/events:', error);
    return NextResponse.json(
      { success: false, data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to update match scores based on goal events
 */
async function updateMatchScores(supabase: any, matchId: string) {
  try {
    // Get match details
    const { data: match } = await supabase
      .from('matches')
      .select('home_team_id, away_team_id')
      .eq('id', matchId)
      .single();

    if (!match) return;

    // Count goals for each team
    const { count: homeCount } = await supabase
      .from('match_events')
      .select('*', { count: 'exact', head: true })
      .eq('match_id', matchId)
      .eq('team_id', match.home_team_id)
      .eq('event_type', 'goal');

    const { count: awayCount } = await supabase
      .from('match_events')
      .select('*', { count: 'exact', head: true })
      .eq('match_id', matchId)
      .eq('team_id', match.away_team_id)
      .eq('event_type', 'goal');

    await supabase
      .from('matches')
      .update({
        home_score: homeCount || 0,
        away_score: awayCount || 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', matchId);

    console.log(`✅ Updated match scores: ${homeCount || 0} - ${awayCount || 0}`);
  } catch (error) {
    console.error('Error updating match scores:', error);
  }
}

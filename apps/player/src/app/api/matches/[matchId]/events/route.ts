/**
 * Match Events API Route
 *
 * GET /api/matches/[matchId]/events - Get all events for a match
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server-client';
import { validateApiAuth } from '@/lib/auth/api-auth';

/**
 * GET - Get match events
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await params;
    console.log('⚽ Getting match events:', matchId);

    // Validate authentication
    const authResult = await validateApiAuth(request);
    if (!authResult.success) {
      return authResult.response!;
    }

    const supabase = await createServerSupabaseClient();

    // Get match events
    const { data: events, error } = await supabase
      .from('match_events')
      .select(`
        *,
        player:users!match_events_player_id_fkey(id, full_name, email)
      `)
      .eq('match_id', matchId)
      .order('event_time', { ascending: true });

    if (error) {
      console.error('❌ Error fetching events:', error);
      return NextResponse.json(
        { success: false, data: null, error: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Events loaded:', events?.length || 0);

    return NextResponse.json({
      success: true,
      data: events || [],
      error: null
    });

  } catch (error) {
    console.error('API error in GET /api/matches/[matchId]/events:', error);
    return NextResponse.json(
      { success: false, data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    // Get match events with player info
    const { data: events, error } = await supabase
      .from('match_events')
      .select(`
        *,
        player_email:users!match_events_player_id_fkey(id, email)
      `)
      .eq('match_id', matchId)
      .order('event_time', { ascending: true });

    // Fetch player profiles separately if we have events
    if (events && events.length > 0 && !error) {
      const playerIds = [...new Set(events.map(e => e.player_id).filter(Boolean))];

      if (playerIds.length > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, display_name, full_name')
          .in('id', playerIds);

        // Merge profile data into events
        const profileMap: Record<string, any> = {};
        if (profiles) {
          for (const profile of profiles) {
            profileMap[profile.id] = profile;
          }
        }

        // Transform events to include properly structured player object
        for (const event of events) {
          const profile = profileMap[event.player_id];
          const email = Array.isArray((event as any).player_email)
            ? (event as any).player_email[0]?.email
            : (event as any).player_email?.email;

          // Create player object matching frontend expectations
          (event as any).player = {
            id: event.player_id,
            full_name: profile?.full_name || null,
            display_name: profile?.display_name || null,
            email: email || null
          };
        }
      }
    }

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

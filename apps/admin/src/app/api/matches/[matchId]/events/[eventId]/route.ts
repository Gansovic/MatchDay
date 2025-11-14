/**
 * Match Event Delete API Route (Admin)
 *
 * DELETE /api/matches/[matchId]/events/[eventId] - Delete a specific match event
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

/**
 * DELETE - Delete a match event
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string; eventId: string }> }
) {
  try {
    const { matchId, eventId } = await params;
    console.log('🗑️ Deleting match event:', eventId, 'from match:', matchId);

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

    // Get the event to check its type before deleting
    const { data: event } = await supabase
      .from('match_events')
      .select('event_type, team_id')
      .eq('id', eventId)
      .eq('match_id', matchId)
      .single();

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

    // If it was a goal, recalculate match scores
    if (event?.event_type === 'goal') {
      await updateMatchScores(supabase, matchId);
    }

    console.log('✅ Event deleted successfully');

    const response = NextResponse.json({
      success: true,
      data: null,
      error: null
    });

    response.headers.set('Access-Control-Allow-Origin', '*');
    return response;

  } catch (error) {
    console.error('API error in DELETE /api/matches/[matchId]/events/[eventId]:', error);
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

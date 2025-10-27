/**
 * Match Players API Route
 *
 * GET /api/matches/[matchId]/players - Get team rosters for a match
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server-client';
import { validateApiAuth } from '@/lib/auth/api-auth';

/**
 * GET - Get match team rosters
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await params;
    console.log('👥 Getting match players:', matchId);

    // Validate authentication
    const authResult = await validateApiAuth(request);
    if (!authResult.success) {
      return authResult.response!;
    }

    const supabase = await createServerSupabaseClient();

    // First get the match to get team IDs
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('home_team_id, away_team_id')
      .eq('id', matchId)
      .single();

    if (matchError || !match) {
      console.error('❌ Error fetching match:', matchError);
      return NextResponse.json(
        { success: false, data: null, error: 'Match not found' },
        { status: 404 }
      );
    }

    // Get home team players
    const { data: homeTeamMembers, error: homeError } = await supabase
      .from('team_members')
      .select(`
        id,
        user_id,
        position,
        jersey_number,
        users!inner(id, full_name, email)
      `)
      .eq('team_id', match.home_team_id)
      .eq('is_active', true);

    if (homeError) {
      console.error('❌ Error fetching home team:', homeError);
    }

    // Get away team players
    const { data: awayTeamMembers, error: awayError } = await supabase
      .from('team_members')
      .select(`
        id,
        user_id,
        position,
        jersey_number,
        users!inner(id, full_name, email)
      `)
      .eq('team_id', match.away_team_id)
      .eq('is_active', true);

    if (awayError) {
      console.error('❌ Error fetching away team:', awayError);
    }

    console.log('✅ Players loaded:', {
      home: homeTeamMembers?.length || 0,
      away: awayTeamMembers?.length || 0
    });

    return NextResponse.json({
      success: true,
      data: {
        homePlayers: homeTeamMembers || [],
        awayPlayers: awayTeamMembers || []
      },
      error: null
    });

  } catch (error) {
    console.error('API error in GET /api/matches/[matchId]/players:', error);
    return NextResponse.json(
      { success: false, data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

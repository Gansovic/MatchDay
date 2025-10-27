/**
 * Match Details API Route
 * 
 * GET /api/matches/[matchId] - Get basic match details
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server-client';
import { validateApiAuth } from '@/lib/auth/api-auth';

/**
 * GET - Get basic match details
 */
export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await params;
    console.log('🔍 Getting match details:', matchId);

    // Validate authentication
    const authResult = await validateApiAuth(request);
    if (!authResult.success) {
      return authResult.response!;
    }

    const { user } = authResult;
    const supabase = await createServerSupabaseClient();

    // Get match details with team information
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select(`
        id,
        home_score,
        away_score,
        status,
        match_date,
        match_time,
        matchday_number,
        court_number,
        venue,
        notes,
        home_team_id,
        away_team_id,
        league_id,
        home_team:teams!matches_home_team_id_fkey(
          id,
          name,
          team_color,
          logo_url
        ),
        away_team:teams!matches_away_team_id_fkey(
          id,
          name,
          team_color,
          logo_url
        )
      `)
      .eq('id', matchId)
      .single();

    if (matchError || !match) {
      console.error('❌ Match not found:', matchError?.message);
      return NextResponse.json(
        { success: false, data: null, error: 'Match not found' },
        { status: 404 }
      );
    }

    console.log('✅ Match details retrieved successfully:', matchId);

    return NextResponse.json({
      success: true,
      data: match,
      error: null
    });

  } catch (error) {
    console.error('Error in GET /api/matches/[matchId]:', error);
    return NextResponse.json(
      { success: false, data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}
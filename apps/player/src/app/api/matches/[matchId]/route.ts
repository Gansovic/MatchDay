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
        created_at,
        updated_at,
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

    // Transform the data to match component expectations
    const transformedMatch = {
      id: match.id,
      match_number: match.matchday_number,
      homeTeam: {
        id: match.home_team.id,
        name: match.home_team.name,
        color: match.home_team.team_color || '#6B7280', // Default to gray if no color
        score: match.home_score || 0
      },
      awayTeam: {
        id: match.away_team.id,
        name: match.away_team.name,
        color: match.away_team.team_color || '#6B7280', // Default to gray if no color
        score: match.away_score || 0
      },
      status: match.status || 'scheduled',
      matchDate: match.match_date,
      venue: match.venue || 'TBD',
      notes: match.notes,
      createdAt: match.created_at,
      updatedAt: match.updated_at
    };

    return NextResponse.json({
      success: true,
      data: transformedMatch,
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
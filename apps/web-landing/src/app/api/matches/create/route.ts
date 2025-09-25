/**
 * Match Creation API Route
 * 
 * POST /api/matches/create - Create a new match between two teams
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server-client';
import { validateApiAuth } from '@/lib/auth/api-auth';

interface CreateMatchRequest {
  homeTeamId: string;
  awayTeamId: string;
  matchDate: string;
  venue?: string;
  matchType?: 'friendly' | 'league' | 'tournament' | 'regular_season';
  leagueId?: string;
}

interface CreateMatchValidationError {
  field: string;
  message: string;
}

/**
 * Validate match creation request data
 */
function validateMatchCreationRequest(data: any): {
  isValid: boolean;
  errors: CreateMatchValidationError[];
  cleanData?: CreateMatchRequest;
} {
  const errors: CreateMatchValidationError[] = [];

  // Required fields validation
  if (!data.homeTeamId || typeof data.homeTeamId !== 'string') {
    errors.push({ field: 'homeTeamId', message: 'Home team ID is required' });
  }

  if (!data.awayTeamId || typeof data.awayTeamId !== 'string') {
    errors.push({ field: 'awayTeamId', message: 'Away team ID is required' });
  }

  if (data.homeTeamId === data.awayTeamId) {
    errors.push({ field: 'teams', message: 'Home and away teams must be different' });
  }

  if (!data.matchDate || typeof data.matchDate !== 'string') {
    errors.push({ field: 'matchDate', message: 'Match date is required' });
  } else {
    // Validate date format and ensure it's in the future
    const matchDate = new Date(data.matchDate);
    if (isNaN(matchDate.getTime())) {
      errors.push({ field: 'matchDate', message: 'Invalid match date format' });
    } else if (matchDate < new Date()) {
      errors.push({ field: 'matchDate', message: 'Match date must be in the future' });
    }
  }

  // Optional field validation
  if (data.venue && (typeof data.venue !== 'string' || data.venue.length > 255)) {
    errors.push({ field: 'venue', message: 'Venue must be less than 255 characters' });
  }

  const validMatchTypes = ['friendly', 'league', 'tournament', 'regular_season'];
  if (data.matchType && !validMatchTypes.includes(data.matchType)) {
    errors.push({ field: 'matchType', message: 'Invalid match type' });
  }

  if (data.leagueId && typeof data.leagueId !== 'string') {
    errors.push({ field: 'leagueId', message: 'Invalid league ID' });
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  // Clean and format the data
  const cleanData: CreateMatchRequest = {
    homeTeamId: data.homeTeamId.trim(),
    awayTeamId: data.awayTeamId.trim(),
    matchDate: data.matchDate,
    venue: data.venue?.trim() || 'TBD',
    matchType: data.matchType || 'friendly',
    leagueId: data.leagueId?.trim() || null
  };

  return { isValid: true, errors: [], cleanData };
}

export async function POST(request: NextRequest) {
  try {
    console.log('🏟️ Match creation request received');

    // Parse and validate request body
    let requestData: CreateMatchRequest;
    try {
      requestData = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid request body', message: 'Request body must be valid JSON' },
        { status: 400 }
      );
    }

    // Validate the request data
    const validation = validateMatchCreationRequest(requestData);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          message: 'Please check your input and try again',
          validationErrors: validation.errors
        },
        { status: 400 }
      );
    }

    const matchData = validation.cleanData!;

    // Validate authentication
    const authResult = await validateApiAuth(request);
    if (!authResult.success) {
      return authResult.response!;
    }
    
    const { user } = authResult;
    console.log('✅ Authenticated user for match creation:', user.id, user.email);

    // Create Supabase client
    const supabase = await createServerSupabaseClient();
    
    // Verify both teams exist
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id, name, captain_id')
      .in('id', [matchData.homeTeamId, matchData.awayTeamId]);

    if (teamsError) {
      console.error('Error fetching teams:', teamsError);
      return NextResponse.json(
        { error: 'Database error', message: 'Failed to verify teams' },
        { status: 500 }
      );
    }

    if (!teams || teams.length !== 2) {
      return NextResponse.json(
        { error: 'Teams not found', message: 'One or both teams do not exist' },
        { status: 400 }
      );
    }

    const homeTeam = teams.find(t => t.id === matchData.homeTeamId);
    const awayTeam = teams.find(t => t.id === matchData.awayTeamId);

    // Check if user has permission to create matches for these teams
    // (User must be captain of at least one of the teams)
    const isHomeCaptain = homeTeam?.captain_id === user.id;
    const isAwayCaptain = awayTeam?.captain_id === user.id;
    
    if (!isHomeCaptain && !isAwayCaptain) {
      return NextResponse.json(
        { 
          error: 'Permission denied', 
          message: 'You must be the captain of at least one team to create a match' 
        },
        { status: 403 }
      );
    }

    // Check if league exists (if specified)
    if (matchData.leagueId) {
      const { data: league, error: leagueError } = await supabase
        .from('leagues')
        .select('id, name, is_active')
        .eq('id', matchData.leagueId)
        .single();

      if (leagueError || !league || !league.is_active) {
        return NextResponse.json(
          { error: 'League not found', message: 'Specified league does not exist or is inactive' },
          { status: 400 }
        );
      }
    }

    // Create the match
    const { data: matchResult, error: matchError } = await supabase
      .from('matches')
      .insert({
        home_team_id: matchData.homeTeamId,
        away_team_id: matchData.awayTeamId,
        match_date: matchData.matchDate,
        scheduled_date: matchData.matchDate,
        venue: matchData.venue,
        match_type: matchData.matchType,
        league_id: matchData.leagueId,
        status: 'scheduled',
        home_score: 0,
        away_score: 0
      })
      .select(`
        *,
        home_team:teams!matches_home_team_id_fkey(id, name, team_color),
        away_team:teams!matches_away_team_id_fkey(id, name, team_color),
        league:leagues(id, name)
      `)
      .single();

    if (matchError) {
      console.error('Match creation failed:', matchError);
      return NextResponse.json(
        { 
          error: 'Match creation failed', 
          message: matchError.message || 'Failed to create match'
        },
        { status: 400 }
      );
    }

    console.log('✅ Match created successfully:', matchResult.id);

    // Format response
    const responseData = {
      id: matchResult.id,
      homeTeam: {
        id: matchResult.home_team.id,
        name: matchResult.home_team.name,
        color: matchResult.home_team.team_color
      },
      awayTeam: {
        id: matchResult.away_team.id,
        name: matchResult.away_team.name,
        color: matchResult.away_team.team_color
      },
      matchDate: matchResult.match_date,
      scheduledDate: matchResult.scheduled_date,
      venue: matchResult.venue,
      status: matchResult.status,
      matchType: matchResult.match_type,
      league: matchResult.league ? {
        id: matchResult.league.id,
        name: matchResult.league.name
      } : null,
      createdAt: matchResult.created_at
    };

    return NextResponse.json({
      data: responseData,
      message: 'Match created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/matches/create:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred while creating the match' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}
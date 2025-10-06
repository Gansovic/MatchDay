/**
 * Match Score Management API Route
 * 
 * GET /api/matches/[matchId]/score - Get current match score
 * PUT /api/matches/[matchId]/score - Update match score and status
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server-client';
import { validateApiAuth } from '@/lib/auth/api-auth';
import { StatsService } from '@/lib/services/stats.service';
// import { findMatchByIdOrNumber, findMatchForScoreUpdate } from '@/lib/utils/match-lookup';

interface PlayerStat {
  user_id: string;
  goals: number;
  assists: number;
  minutes_played: number;
  yellow_cards?: number;
  red_cards?: number;
  clean_sheets?: number;
  saves?: number;
}

interface UpdateScoreRequest {
  homeScore: number;
  awayScore: number;
  status?: 'scheduled' | 'live' | 'completed' | 'cancelled';
  matchDuration?: number;
  notes?: string;
  playerStats?: {
    homeTeamStats: PlayerStat[];
    awayTeamStats: PlayerStat[];
  };
}

/**
 * GET - Get current match score and details
 */
export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await params;
    console.log('⚽ Getting match score:', matchId);

    // Validate authentication
    const authResult = await validateApiAuth(request);
    if (!authResult.success) {
      return authResult.response!;
    }

    const { user } = authResult;
    const supabase = await createServerSupabaseClient();

    // Get match details with teams using direct UUID lookup (temporary until database migration)
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select(`
        id,
        home_score,
        away_score,
        status,
        match_date,
        scheduled_date,
        venue,
        match_duration,
        notes,
        created_at,
        updated_at,
        home_team_id,
        away_team_id,
        home_team:teams!matches_home_team_id_fkey(id, name, team_color),
        away_team:teams!matches_away_team_id_fkey(id, name, team_color),
        league:leagues(id, name)
      `)
      .eq('id', matchId)
      .single();

    if (matchError || !match) {
      return NextResponse.json(
        { error: 'Match not found', message: 'The specified match does not exist' },
        { status: 404 }
      );
    }

    // Check if user has access to view this match (must be member of one of the teams)
    const { data: userTeamMembership, error: membershipError } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .in('team_id', [match.home_team_id, match.away_team_id]);

    if (membershipError || !userTeamMembership || userTeamMembership.length === 0) {
      return NextResponse.json(
        { error: 'Access denied', message: 'You must be a member of one of the teams to view match details' },
        { status: 403 }
      );
    }

    const responseData = {
      id: match.id,
      homeTeam: {
        id: match.home_team.id,
        name: match.home_team.name,
        color: match.home_team.team_color,
        score: match.home_score
      },
      awayTeam: {
        id: match.away_team.id,
        name: match.away_team.name,
        color: match.away_team.team_color,
        score: match.away_score
      },
      status: match.status,
      matchDate: match.match_date,
      scheduledDate: match.scheduled_date,
      venue: match.venue,
      duration: match.match_duration,
      notes: match.notes,
      league: match.league,
      createdAt: match.created_at,
      updatedAt: match.updated_at
    };

    return NextResponse.json({
      data: responseData,
      message: 'Match details retrieved successfully'
    });

  } catch (error) {
    console.error('Error in GET /api/matches/[matchId]/score:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update match score and status
 */
export async function PUT(
  request: NextRequest, 
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await params;
    console.log('🎯 Updating match score:', matchId);

    // Parse request body
    let requestData: UpdateScoreRequest;
    try {
      requestData = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid request body', message: 'Request body must be valid JSON' },
        { status: 400 }
      );
    }

    // Validate authentication
    const authResult = await validateApiAuth(request);
    if (!authResult.success) {
      return authResult.response!;
    }

    const { user } = authResult;
    const supabase = await createServerSupabaseClient();

    // Validate scores
    if (typeof requestData.homeScore !== 'number' || requestData.homeScore < 0) {
      return NextResponse.json(
        { error: 'Invalid home score', message: 'Home score must be a non-negative number' },
        { status: 400 }
      );
    }

    if (typeof requestData.awayScore !== 'number' || requestData.awayScore < 0) {
      return NextResponse.json(
        { error: 'Invalid away score', message: 'Away score must be a non-negative number' },
        { status: 400 }
      );
    }

    // Get match details to verify access using direct UUID lookup (temporary until database migration)
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select(`
        id,
        status,
        home_team_id,
        away_team_id,
        home_team:teams!matches_home_team_id_fkey(id, name, captain_id),
        away_team:teams!matches_away_team_id_fkey(id, name, captain_id)
      `)
      .eq('id', matchId)
      .single();

    if (matchError || !match) {
      return NextResponse.json(
        { error: 'Match not found', message: 'The specified match does not exist' },
        { status: 404 }
      );
    }

    // Check if user is captain of either team
    const isHomeCaptain = match.home_team.captain_id === user.id;
    const isAwayCaptain = match.away_team.captain_id === user.id;

    if (!isHomeCaptain && !isAwayCaptain) {
      return NextResponse.json(
        { error: 'Permission denied', message: 'Only team captains can update match scores' },
        { status: 403 }
      );
    }

    // Validate status transition
    const validStatuses = ['scheduled', 'live', 'completed', 'cancelled'];
    if (requestData.status && !validStatuses.includes(requestData.status)) {
      return NextResponse.json(
        { error: 'Invalid status', message: 'Invalid match status' },
        { status: 400 }
      );
    }

    // Update the match
    const updateData: any = {
      home_score: requestData.homeScore,
      away_score: requestData.awayScore,
      updated_at: new Date().toISOString()
    };

    if (requestData.status) {
      updateData.status = requestData.status;
    }

    if (requestData.matchDuration !== undefined) {
      if (requestData.matchDuration < 0 || requestData.matchDuration > 120) {
        return NextResponse.json(
          { error: 'Invalid duration', message: 'Match duration must be between 0 and 120 minutes' },
          { status: 400 }
        );
      }
      updateData.match_duration = requestData.matchDuration;
    }

    if (requestData.notes !== undefined) {
      updateData.notes = requestData.notes;
    }

    const { data: updatedMatch, error: updateError } = await supabase
      .from('matches')
      .update(updateData)
      .eq('id', match.id)
      .select(`
        id,
        home_score,
        away_score,
        status,
        match_date,
        venue,
        match_duration,
        notes,
        updated_at,
        home_team:teams!matches_home_team_id_fkey(id, name, team_color),
        away_team:teams!matches_away_team_id_fkey(id, name, team_color)
      `)
      .single();

    if (updateError) {
      console.error('Error updating match:', updateError);
      return NextResponse.json(
        { error: 'Database error', message: 'Failed to update match' },
        { status: 500 }
      );
    }

    // If match is completed and player stats are provided, create player statistics
    if (requestData.status === 'completed' && requestData.playerStats) {
      console.log('📊 Creating player statistics for completed match...');
      
      try {
        const allPlayerStats: any[] = [];

        // Process home team stats
        if (requestData.playerStats.homeTeamStats && requestData.playerStats.homeTeamStats.length > 0) {
          for (const playerStat of requestData.playerStats.homeTeamStats) {
            // Validate player is member of home team
            const { data: teamMember, error: memberError } = await supabase
              .from('team_members')
              .select('id')
              .eq('user_id', playerStat.user_id)
              .eq('team_id', match.home_team_id)
              .eq('is_active', true)
              .single();

            if (memberError || !teamMember) {
              console.warn(`Player ${playerStat.user_id} is not a member of home team ${match.home_team_id}`);
              continue;
            }

            allPlayerStats.push({
              user_id: playerStat.user_id,
              match_id: match.id,
              team_id: match.home_team_id,
              goals: playerStat.goals || 0,
              assists: playerStat.assists || 0,
              minutes_played: playerStat.minutes_played || 0,
              yellow_cards: playerStat.yellow_cards || 0,
              red_cards: playerStat.red_cards || 0,
              clean_sheets: playerStat.clean_sheets || 0,
              saves: playerStat.saves || 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }
        }

        // Process away team stats
        if (requestData.playerStats.awayTeamStats && requestData.playerStats.awayTeamStats.length > 0) {
          for (const playerStat of requestData.playerStats.awayTeamStats) {
            // Validate player is member of away team
            const { data: teamMember, error: memberError } = await supabase
              .from('team_members')
              .select('id')
              .eq('user_id', playerStat.user_id)
              .eq('team_id', match.away_team_id)
              .eq('is_active', true)
              .single();

            if (memberError || !teamMember) {
              console.warn(`Player ${playerStat.user_id} is not a member of away team ${match.away_team_id}`);
              continue;
            }

            allPlayerStats.push({
              user_id: playerStat.user_id,
              match_id: match.id,
              team_id: match.away_team_id,
              goals: playerStat.goals || 0,
              assists: playerStat.assists || 0,
              minutes_played: playerStat.minutes_played || 0,
              yellow_cards: playerStat.yellow_cards || 0,
              red_cards: playerStat.red_cards || 0,
              clean_sheets: playerStat.clean_sheets || 0,
              saves: playerStat.saves || 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }
        }

        // Insert all player statistics
        if (allPlayerStats.length > 0) {
          const { error: statsError } = await supabase
            .from('player_stats')
            .insert(allPlayerStats);

          if (statsError) {
            console.error('Error creating player stats:', statsError);
            // Don't fail the entire request, but log the error
          } else {
            console.log(`✅ Created ${allPlayerStats.length} player stat records`);

            // Update cross-league aggregated stats for all players
            const statsService = StatsService.getInstance(supabase);
            const uniquePlayerIds = new Set(allPlayerStats.map(s => s.user_id));

            for (const playerId of uniquePlayerIds) {
              const result = await statsService.updatePlayerCrossLeagueStats(playerId);
              if (!result.success) {
                console.error(`Failed to update cross-league stats for player ${playerId}:`, result.error);
              } else {
                console.log(`✅ Updated cross-league stats for player ${playerId}`);
              }
            }
          }
        }
      } catch (statsCreationError) {
        console.error('Error in player stats creation:', statsCreationError);
        // Don't fail the entire request, but log the error
      }
    }

    console.log('✅ Match score updated successfully:', matchId);

    const responseData = {
      id: updatedMatch.id,
      homeTeam: {
        id: updatedMatch.home_team.id,
        name: updatedMatch.home_team.name,
        color: updatedMatch.home_team.team_color,
        score: updatedMatch.home_score
      },
      awayTeam: {
        id: updatedMatch.away_team.id,
        name: updatedMatch.away_team.name,
        color: updatedMatch.away_team.team_color,
        score: updatedMatch.away_score
      },
      status: updatedMatch.status,
      matchDate: updatedMatch.match_date,
      venue: updatedMatch.venue,
      duration: updatedMatch.match_duration,
      notes: updatedMatch.notes,
      updatedAt: updatedMatch.updated_at
    };

    return NextResponse.json({
      data: responseData,
      message: 'Match score updated successfully'
    });

  } catch (error) {
    console.error('Error in PUT /api/matches/[matchId]/score:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}
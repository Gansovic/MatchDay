/**
 * Tournament Fixture Generation API Endpoints
 * 
 * Handles:
 * - POST: Generate tournament fixtures for a league
 * - GET: Get existing fixtures for a league 
 * - DELETE: Delete all fixtures for a league (to regenerate)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database, TournamentFormat } from '@/lib/types/database.types';
import { TournamentFixtureGeneratorService, TournamentConfig } from '@/lib/services/tournament-fixture-generator.service';

/**
 * Generate tournament fixtures for a league
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { leagueId: string } }
) {
  try {
    const supabase = createServerComponentClient<Database>({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { leagueId } = params;
    const body = await request.json();

    // Validate request body
    const { 
      format, 
      startDate, 
      matchFrequency = 7, 
      playoffTeamsCount, 
      venue,
      preview = false 
    } = body;

    if (!format || !startDate) {
      return NextResponse.json(
        { error: 'Missing required fields: format, startDate' },
        { status: 400 }
      );
    }

    // Validate tournament format
    const validFormats = Object.values(TournamentFormat);
    if (!validFormats.includes(format)) {
      return NextResponse.json(
        { error: `Invalid tournament format. Must be one of: ${validFormats.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if user has permission to generate fixtures for this league
    const { data: league, error: leagueError } = await supabase
      .from('leagues')
      .select('id, created_by, tournament_format')
      .eq('id', leagueId)
      .single();

    if (leagueError) {
      if (leagueError.code === 'PGRST116') {
        return NextResponse.json({ error: 'League not found' }, { status: 404 });
      }
      throw leagueError;
    }

    // Check user permissions (must be league creator or admin)
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    const isAuthorized = 
      league.created_by === session.user.id || 
      ['admin', 'league_admin', 'app_admin'].includes(userProfile?.role || '');

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Insufficient permissions to generate fixtures for this league' },
        { status: 403 }
      );
    }

    // Create tournament configuration
    const tournamentConfig: TournamentConfig = {
      leagueId,
      format: format as TournamentFormat,
      startDate: new Date(startDate),
      matchFrequency,
      playoffTeamsCount,
      venue
    };

    // Get fixture generator service
    const fixtureService = TournamentFixtureGeneratorService.getInstance(supabase);

    let result;
    if (preview) {
      // Preview fixtures without saving
      result = await fixtureService.previewTournamentFixtures(tournamentConfig);
    } else {
      // Generate and save fixtures
      result = await fixtureService.generateTournamentFixtures(tournamentConfig);
      
      // Update league tournament format if needed
      if (league.tournament_format !== format) {
        await supabase
          .from('leagues')
          .update({ 
            tournament_format: format,
            tournament_start_date: startDate,
            match_frequency: matchFrequency,
            playoff_teams_count: playoffTeamsCount
          })
          .eq('id', leagueId);
      }
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error?.message || 'Failed to generate fixtures' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: preview ? 'Fixture preview generated' : 'Tournament fixtures generated successfully'
    });

  } catch (error) {
    console.error('Error generating tournament fixtures:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get existing fixtures for a league
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { leagueId: string } }
) {
  try {
    const supabase = createServerComponentClient<Database>({ cookies });
    const { leagueId } = params;

    // Get league info
    const { data: league, error: leagueError } = await supabase
      .from('leagues')
      .select('id, name, tournament_format, fixtures_generated, fixtures_generated_at')
      .eq('id', leagueId)
      .single();

    if (leagueError) {
      if (leagueError.code === 'PGRST116') {
        return NextResponse.json({ error: 'League not found' }, { status: 404 });
      }
      throw leagueError;
    }

    // Get all matches for the league
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select(`
        *,
        home_team:teams!matches_home_team_id_fkey(id, name, team_color),
        away_team:teams!matches_away_team_id_fkey(id, name, team_color)
      `)
      .eq('league_id', leagueId)
      .order('scheduled_date', { ascending: true });

    if (matchesError) throw matchesError;

    // Group matches by type
    const regularSeasonMatches = matches?.filter(m => m.match_type === 'regular_season') || [];
    const playoffMatches = matches?.filter(m => m.match_type !== 'regular_season') || [];

    const fixtures = {
      league,
      totalMatches: matches?.length || 0,
      regularSeasonMatches: regularSeasonMatches.length,
      playoffMatches: playoffMatches.length,
      fixtures: {
        regularSeason: regularSeasonMatches,
        playoffs: playoffMatches
      }
    };

    return NextResponse.json({
      success: true,
      data: fixtures
    });

  } catch (error) {
    console.error('Error getting league fixtures:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Delete all fixtures for a league (to allow regeneration)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { leagueId: string } }
) {
  try {
    const supabase = createServerComponentClient<Database>({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { leagueId } = params;

    // Check if user has permission to delete fixtures for this league
    const { data: league, error: leagueError } = await supabase
      .from('leagues')
      .select('id, created_by')
      .eq('id', leagueId)
      .single();

    if (leagueError) {
      if (leagueError.code === 'PGRST116') {
        return NextResponse.json({ error: 'League not found' }, { status: 404 });
      }
      throw leagueError;
    }

    // Check user permissions
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    const isAuthorized = 
      league.created_by === session.user.id || 
      ['admin', 'league_admin', 'app_admin'].includes(userProfile?.role || '');

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete fixtures for this league' },
        { status: 403 }
      );
    }

    // Get fixture generator service and delete fixtures
    const fixtureService = TournamentFixtureGeneratorService.getInstance(supabase);
    const result = await fixtureService.deleteLeagueFixtures(leagueId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error?.message || 'Failed to delete fixtures' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'All fixtures deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting league fixtures:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
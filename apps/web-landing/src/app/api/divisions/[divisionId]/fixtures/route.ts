/**
 * Division Fixtures API Routes
 * 
 * Handles fixture generation and management for divisions:
 * - GET /api/divisions/[divisionId]/fixtures - Get all fixtures for a division
 * - POST /api/divisions/[divisionId]/fixtures - Generate fixtures or schedule individual fixture
 * - PUT /api/divisions/[divisionId]/fixtures - Update fixture schedule
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server-client';

interface RouteParams {
  params: Promise<{ divisionId: string }>;
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

/**
 * GET /api/divisions/[divisionId]/fixtures
 * Get all fixtures for a division organized by rounds
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { divisionId } = await params;
    const { searchParams } = new URL(request.url);
    const roundNumber = searchParams.get('round');
    const includeMatches = searchParams.get('includeMatches') === 'true';

    if (!divisionId) {
      return NextResponse.json(
        { success: false, error: 'Division ID is required' },
        { status: 400 }
      );
    }

    // Validate divisionId format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(divisionId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid division ID format' },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();

    // Verify division exists and get details
    const { data: division, error: divisionError } = await supabase
      .from('divisions')
      .select('id, name, league_id, current_teams')
      .eq('id', divisionId)
      .single();

    if (divisionError) {
      if (divisionError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Division not found' },
          { status: 404 }
        );
      }
      throw divisionError;
    }

    // Build fixtures query
    let fixturesQuery = supabase
      .from('division_fixtures')
      .select(`
        id,
        round_number,
        home_team_id,
        away_team_id,
        match_date,
        venue,
        is_scheduled,
        created_at,
        home_team:teams!division_fixtures_home_team_id_fkey (
          id,
          name,
          captain_id
        ),
        away_team:teams!division_fixtures_away_team_id_fkey (
          id,
          name,
          captain_id
        )
      `)
      .eq('division_id', divisionId)
      .order('round_number')
      .order('created_at');

    // Filter by round if specified
    if (roundNumber) {
      fixturesQuery = fixturesQuery.eq('round_number', parseInt(roundNumber));
    }

    const { data: fixtures, error: fixturesError } = await fixturesQuery;

    if (fixturesError) {
      console.error('Error fetching fixtures:', fixturesError);
      return NextResponse.json(
        { success: false, error: 'Database error', message: fixturesError.message },
        { status: 500 }
      );
    }

    // Get matches if requested
    let matchesMap = new Map();
    if (includeMatches) {
      const { data: matches } = await supabase
        .from('matches')
        .select('id, fixture_id, status, home_score, away_score, notes, match_date')
        .eq('division_id', divisionId);

      (matches || []).forEach(match => {
        if (match.fixture_id) {
          matchesMap.set(match.fixture_id, match);
        }
      });
    }

    // Group fixtures by round and process
    const fixturesByRound: Record<number, any[]> = {};
    (fixtures || []).forEach(fixture => {
      const round = fixture.round_number;
      if (!fixturesByRound[round]) {
        fixturesByRound[round] = [];
      }

      const processedFixture = {
        id: fixture.id,
        home_team: {
          id: fixture.home_team?.id,
          name: fixture.home_team?.name,
          captain_id: fixture.home_team?.captain_id
        },
        away_team: {
          id: fixture.away_team?.id,
          name: fixture.away_team?.name,
          captain_id: fixture.away_team?.captain_id
        },
        match_date: fixture.match_date,
        venue: fixture.venue,
        is_scheduled: fixture.is_scheduled,
        created_at: fixture.created_at
      };

      // Add match information if available
      if (includeMatches && matchesMap.has(fixture.id)) {
        const match = matchesMap.get(fixture.id);
        processedFixture.match = {
          id: match.id,
          status: match.status,
          home_score: match.home_score,
          away_score: match.away_score,
          notes: match.notes,
          match_date: match.match_date
        };
      }

      fixturesByRound[round].push(processedFixture);
    });

    // Calculate fixture statistics
    const totalFixtures = fixtures?.length || 0;
    const scheduledFixtures = fixtures?.filter(f => f.is_scheduled).length || 0;
    const totalRounds = Math.max(...Object.keys(fixturesByRound).map(Number), 0);
    
    let completedMatches = 0;
    let scheduledMatches = 0;
    if (includeMatches) {
      const allMatches = Array.from(matchesMap.values());
      completedMatches = allMatches.filter(m => m.status === 'completed').length;
      scheduledMatches = allMatches.filter(m => m.status === 'scheduled').length;
    }

    const response = {
      division: {
        id: division.id,
        name: division.name,
        league_id: division.league_id,
        current_teams: division.current_teams
      },
      fixtures: {
        byRound: fixturesByRound,
        rounds: Object.keys(fixturesByRound).map(Number).sort((a, b) => a - b)
      },
      statistics: {
        totalFixtures,
        scheduledFixtures,
        unscheduledFixtures: totalFixtures - scheduledFixtures,
        totalRounds,
        schedulingProgress: totalFixtures > 0 ? Math.round((scheduledFixtures / totalFixtures) * 100) : 0
      }
    };

    if (includeMatches) {
      response.statistics.completedMatches = completedMatches;
      response.statistics.scheduledMatches = scheduledMatches;
      response.statistics.matchProgress = totalFixtures > 0 ? 
        Math.round((completedMatches / totalFixtures) * 100) : 0;
    }

    const jsonResponse = NextResponse.json({
      success: true,
      data: response,
      message: `Retrieved fixtures for division "${division.name}"`
    });

    // Add CORS headers
    jsonResponse.headers.set('Access-Control-Allow-Origin', '*');
    jsonResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    jsonResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return jsonResponse;

  } catch (error) {
    console.error('Error in GET /api/divisions/[divisionId]/fixtures:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/divisions/[divisionId]/fixtures
 * Generate all fixtures for a division using round-robin algorithm
 * or schedule a specific fixture
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { divisionId } = await params;
    const body = await request.json();

    // Validate divisionId format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(divisionId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid division ID format' },
        { status: 400 }
      );
    }

    const {
      action = 'generate_all', // 'generate_all' or 'schedule_fixture'
      fixture_id, // For scheduling specific fixture
      match_date,
      venue,
      overwrite = false // Whether to overwrite existing fixtures
    } = body;

    const supabase = createAdminSupabaseClient();

    // Get division and teams
    const { data: division, error: divisionError } = await supabase
      .from('divisions')
      .select('id, name, league_id, current_teams, min_teams')
      .eq('id', divisionId)
      .single();

    if (divisionError) {
      if (divisionError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Division not found' },
          { status: 404 }
        );
      }
      throw divisionError;
    }

    if (action === 'schedule_fixture') {
      // Schedule specific fixture
      
      if (!fixture_id || !match_date) {
        return NextResponse.json(
          { success: false, error: 'fixture_id and match_date are required for scheduling' },
          { status: 400 }
        );
      }

      // Update fixture with schedule information
      const { data: updatedFixture, error: updateError } = await supabase
        .from('division_fixtures')
        .update({
          match_date,
          venue,
          is_scheduled: true
        })
        .eq('id', fixture_id)
        .eq('division_id', divisionId)
        .select(`
          id,
          round_number,
          home_team_id,
          away_team_id,
          match_date,
          venue,
          is_scheduled,
          home_team:teams!division_fixtures_home_team_id_fkey (
            id,
            name
          ),
          away_team:teams!division_fixtures_away_team_id_fkey (
            id,
            name
          )
        `)
        .single();

      if (updateError) {
        console.error('Error updating fixture:', updateError);
        return NextResponse.json(
          { success: false, error: 'Database error', message: updateError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: updatedFixture,
        message: `Fixture scheduled for ${new Date(match_date).toLocaleDateString()}`
      });

    } else {
      // Generate all fixtures
      
      // Get teams in division
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('id, name')
        .eq('division_id', divisionId)
        .eq('is_active', true)
        .order('name');

      if (teamsError) {
        console.error('Error fetching teams:', teamsError);
        return NextResponse.json(
          { success: false, error: 'Database error', message: teamsError.message },
          { status: 500 }
        );
      }

      if (!teams || teams.length < division.min_teams) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Insufficient teams for fixture generation. Division requires minimum ${division.min_teams} teams, but only ${teams?.length || 0} teams found.` 
          },
          { status: 400 }
        );
      }

      // Check if fixtures already exist
      const { data: existingFixtures } = await supabase
        .from('division_fixtures')
        .select('id')
        .eq('division_id', divisionId)
        .limit(1);

      if (existingFixtures && existingFixtures.length > 0 && !overwrite) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Fixtures already exist for this division. Set overwrite=true to replace existing fixtures.' 
          },
          { status: 409 }
        );
      }

      // Delete existing fixtures if overwriting
      if (overwrite) {
        await supabase
          .from('division_fixtures')
          .delete()
          .eq('division_id', divisionId);
      }

      // Generate round-robin fixtures
      const fixtures = generateRoundRobinFixtures(teams, divisionId);

      // Insert fixtures in batches
      const batchSize = 100;
      const insertedFixtures = [];
      
      for (let i = 0; i < fixtures.length; i += batchSize) {
        const batch = fixtures.slice(i, i + batchSize);
        
        const { data: batchResults, error: insertError } = await supabase
          .from('division_fixtures')
          .insert(batch)
          .select('id, round_number, home_team_id, away_team_id');

        if (insertError) {
          console.error('Error inserting fixtures batch:', insertError);
          return NextResponse.json(
            { success: false, error: 'Database error', message: insertError.message },
            { status: 500 }
          );
        }

        insertedFixtures.push(...(batchResults || []));
      }

      // Group by rounds for response
      const fixturesByRound: Record<number, any[]> = {};
      insertedFixtures.forEach(fixture => {
        const round = fixture.round_number;
        if (!fixturesByRound[round]) {
          fixturesByRound[round] = [];
        }
        fixturesByRound[round].push(fixture);
      });

      const totalRounds = Math.max(...Object.keys(fixturesByRound).map(Number), 0);

      return NextResponse.json({
        success: true,
        data: {
          division: {
            id: division.id,
            name: division.name,
            teams_count: teams.length
          },
          fixtures: {
            total: insertedFixtures.length,
            rounds: totalRounds,
            byRound: fixturesByRound
          }
        },
        message: `Generated ${insertedFixtures.length} fixtures across ${totalRounds} rounds for division "${division.name}"`
      }, { status: 201 });
    }

  } catch (error) {
    console.error('Error in POST /api/divisions/[divisionId]/fixtures:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * Generate round-robin fixtures for teams
 * Each team plays every other team once (single round-robin)
 */
function generateRoundRobinFixtures(teams: Array<{id: string, name: string}>, divisionId: string) {
  const fixtures = [];
  const teamCount = teams.length;
  
  if (teamCount < 2) {
    return fixtures;
  }

  // For odd number of teams, add a "bye" team
  const teamsForScheduling = [...teams];
  const hasByeTeam = teamCount % 2 !== 0;
  if (hasByeTeam) {
    teamsForScheduling.push({ id: 'bye', name: 'BYE' });
  }

  const totalTeams = teamsForScheduling.length;
  const roundsCount = totalTeams - 1;
  const matchesPerRound = totalTeams / 2;

  for (let round = 0; round < roundsCount; round++) {
    for (let match = 0; match < matchesPerRound; match++) {
      let home: number, away: number;

      if (match === 0) {
        // First match: team 0 is always at home
        home = 0;
        away = totalTeams - 1 - round;
      } else {
        // Calculate other matches using round-robin algorithm
        home = (round + match) % (totalTeams - 1);
        if (home >= totalTeams - 1 - round) home++;
        
        away = (totalTeams - 1 - round - match) % (totalTeams - 1);
        if (away >= totalTeams - 1 - round) away++;
      }

      // Skip if either team is the bye team
      if (teamsForScheduling[home].id === 'bye' || teamsForScheduling[away].id === 'bye') {
        continue;
      }

      fixtures.push({
        division_id: divisionId,
        round_number: round + 1,
        home_team_id: teamsForScheduling[home].id,
        away_team_id: teamsForScheduling[away].id,
        is_scheduled: false
      });
    }
  }

  return fixtures;
}
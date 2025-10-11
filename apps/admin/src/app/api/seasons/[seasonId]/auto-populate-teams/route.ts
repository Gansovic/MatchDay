/**
 * API Route: Auto-Populate Teams to Season
 *
 * POST /api/seasons/[seasonId]/auto-populate-teams
 * Automatically registers teams to a season for testing purposes.
 * Reuses existing teams from the league or creates test teams.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';

// Color palette for test teams
const TEAM_COLORS = [
  '#EF4444', // Red
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#84CC16', // Lime
  '#F43F5E', // Rose
];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ seasonId: string }> }
) {
  console.log('🚀 AUTO-POPULATE TEAMS ENDPOINT HIT');
  try {
    const { seasonId } = await params;
    console.log('📝 Season ID:', seasonId);

    if (!seasonId) {
      console.log('❌ ERROR: No season ID provided');
      return NextResponse.json(
        { error: 'Season ID is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    console.log('✅ Admin client created');

    // Get the user from the session
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ ERROR: No authorization header');
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Get user from token
    const { data: { user }, error: authError } = await (supabase as any).auth.getUser(token);

    if (authError || !user) {
      console.log('❌ ERROR: Auth failed', authError);
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }
    console.log('✅ User authenticated:', user.id);

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const { teamCount = 8 } = body;
    console.log('📄 Request body parsed, teamCount:', teamCount);

    // Validate teamCount
    if (typeof teamCount !== 'number' || teamCount < 1 || teamCount > 64) {
      return NextResponse.json(
        { error: 'teamCount must be between 1 and 64' },
        { status: 400 }
      );
    }

    // Fetch the season with league info
    console.log('🔍 Fetching season from database...');
    const { data: season, error: fetchError } = await (supabase as any)
      .from('seasons')
      .select(`
        *,
        leagues (
          id,
          name,
          created_by
        )
      `)
      .eq('id', seasonId)
      .single();

    if (fetchError || !season) {
      console.log('❌ ERROR: Season not found', fetchError);
      return NextResponse.json(
        { error: 'Season not found' },
        { status: 404 }
      );
    }
    console.log('✅ Season found:', season.name);

    // Check if user has permission (must be league creator)
    console.log('🔒 Checking permissions. Created by:', season.leagues?.created_by, 'User:', user.id);
    if (season.leagues?.created_by !== user.id) {
      console.log('❌ ERROR: Permission denied');
      return NextResponse.json(
        { error: 'You do not have permission to manage teams for this season' },
        { status: 403 }
      );
    }
    console.log('✅ Permission check passed');

    // Check if season is in appropriate status
    if (season.status !== 'draft' && season.status !== 'registration') {
      return NextResponse.json(
        { error: 'Teams can only be added to seasons in draft or registration status' },
        { status: 400 }
      );
    }

    // Check max_teams limit
    const { count: currentTeamCount } = await (supabase as any)
      .from('season_teams')
      .select('*', { count: 'exact', head: true })
      .eq('season_id', seasonId);

    const availableSlots = (season.max_teams || 16) - (currentTeamCount || 0);
    if (availableSlots <= 0) {
      return NextResponse.json(
        { error: 'Season has reached maximum team capacity' },
        { status: 400 }
      );
    }

    const actualTeamCount = Math.min(teamCount, availableSlots);
    console.log(`📊 Available slots: ${availableSlots}, will add: ${actualTeamCount} teams`);

    // Strategy A: Get existing teams from the league
    console.log('🔍 Fetching existing teams in league...');
    const { data: existingTeams, error: teamsError } = await (supabase as any)
      .from('teams')
      .select('id, name, team_color')
      .eq('league_id', season.league_id)
      .limit(actualTeamCount * 2); // Fetch extra in case some are already registered

    if (teamsError) {
      console.error('❌ ERROR: Failed to fetch teams', teamsError);
      return NextResponse.json(
        { error: 'Failed to fetch league teams' },
        { status: 500 }
      );
    }

    console.log(`✅ Found ${existingTeams?.length || 0} existing teams in league`);

    // Filter out teams already registered to this season
    const { data: alreadyRegistered } = await (supabase as any)
      .from('season_teams')
      .select('team_id')
      .eq('season_id', seasonId);

    const registeredTeamIds = new Set(alreadyRegistered?.map((st: any) => st.team_id) || []);
    const availableTeams = (existingTeams || []).filter((t: any) => !registeredTeamIds.has(t.id));

    console.log(`📋 ${availableTeams.length} teams available for registration`);

    let teamsToRegister: any[] = [];
    let teamsCreated = 0;
    let teamsReused = 0;

    // Use existing teams first
    if (availableTeams.length > 0) {
      const teamsToUse = availableTeams.slice(0, actualTeamCount);
      teamsToRegister.push(...teamsToUse);
      teamsReused = teamsToUse.length;
      console.log(`♻️ Reusing ${teamsReused} existing teams`);
    }

    // Strategy B: Create test teams if we need more
    const teamsNeeded = actualTeamCount - teamsToRegister.length;
    if (teamsNeeded > 0) {
      console.log(`🏗️ Creating ${teamsNeeded} test teams...`);

      // Get existing team names to avoid conflicts
      const { data: allTeamNames } = await (supabase as any)
        .from('teams')
        .select('name')
        .eq('league_id', season.league_id);

      const existingNames = new Set(allTeamNames?.map((t: any) => t.name) || []);

      const testTeamsToCreate = [];
      let nameIndex = 1;

      while (testTeamsToCreate.length < teamsNeeded) {
        const testName = `Test Team ${nameIndex}`;
        if (!existingNames.has(testName)) {
          const colorIndex = (nameIndex - 1) % TEAM_COLORS.length;
          testTeamsToCreate.push({
            name: testName,
            league_id: season.league_id,
            captain_id: user.id,
            team_color: TEAM_COLORS[colorIndex],
            max_players: 22,
            min_players: 7,
            is_recruiting: true,
            team_bio: `Auto-generated test team for ${season.name}`
          });
        }
        nameIndex++;
      }

      // Insert test teams
      const { data: newTeams, error: createError } = await (supabase as any)
        .from('teams')
        .insert(testTeamsToCreate)
        .select('id, name, team_color');

      if (createError) {
        console.error('❌ ERROR: Failed to create test teams', createError);
        return NextResponse.json(
          { error: 'Failed to create test teams' },
          { status: 500 }
        );
      }

      teamsToRegister.push(...(newTeams || []));
      teamsCreated = newTeams?.length || 0;
      console.log(`✅ Created ${teamsCreated} test teams`);
    }

    // Register teams to season
    console.log(`📝 Registering ${teamsToRegister.length} teams to season...`);
    const registrations = teamsToRegister.map((team: any) => ({
      season_id: seasonId,
      team_id: team.id,
      status: 'registered',
      registration_date: new Date().toISOString()
    }));

    const { data: registeredTeams, error: registerError } = await (supabase as any)
      .from('season_teams')
      .insert(registrations)
      .select(`
        *,
        teams (
          id,
          name,
          team_color
        )
      `);

    if (registerError) {
      // Check if it's a duplicate error (constraint violation)
      if (registerError.code === '23505') {
        console.log('⚠️ Some teams were already registered, continuing...');
        // Try one by one to see which succeed
        const individualResults = [];
        for (const reg of registrations) {
          const { data, error } = await (supabase as any)
            .from('season_teams')
            .insert(reg)
            .select(`
              *,
              teams (
                id,
                name,
                team_color
              )
            `)
            .single();

          if (!error) {
            individualResults.push(data);
          }
        }

        if (individualResults.length === 0) {
          return NextResponse.json(
            { error: 'All teams are already registered to this season' },
            { status: 400 }
          );
        }

        console.log(`✅ Successfully registered ${individualResults.length} teams`);
        return NextResponse.json({
          success: true,
          message: `Successfully registered ${individualResults.length} teams (some were already registered)`,
          data: {
            teamsAdded: individualResults.length,
            teamsCreated,
            teamsReused: teamsReused - (registrations.length - individualResults.length),
            teams: individualResults.map((rt: any) => rt.teams)
          }
        });
      }

      console.error('❌ ERROR: Failed to register teams', registerError);
      return NextResponse.json(
        { error: 'Failed to register teams to season' },
        { status: 500 }
      );
    }

    console.log(`✅ Successfully registered ${registeredTeams?.length || 0} teams`);

    return NextResponse.json({
      success: true,
      message: `Successfully registered ${registeredTeams?.length || 0} teams to ${season.name}`,
      data: {
        teamsAdded: registeredTeams?.length || 0,
        teamsCreated,
        teamsReused,
        teams: registeredTeams?.map((rt: any) => rt.teams) || []
      }
    });

  } catch (error) {
    console.error('Error auto-populating teams:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

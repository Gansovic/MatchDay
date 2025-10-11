/**
 * API Route: Generate Fixtures for Season
 *
 * POST /api/seasons/[seasonId]/fixtures/generate
 * Generates fixtures for a season with advanced scheduling constraints
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { SeasonService } from '@matchday/services';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ seasonId: string }> }
) {
  console.log('🚀 FIXTURE GENERATION ENDPOINT HIT');
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
    const { preview = false } = body;
    console.log('📄 Request body parsed, preview mode:', preview);

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
        { error: 'You do not have permission to generate fixtures for this season' },
        { status: 403 }
      );
    }
    console.log('✅ Permission check passed');

    // Check if season is in appropriate status
    if (season.status !== 'draft' && season.status !== 'registration') {
      return NextResponse.json(
        { error: 'Fixtures can only be generated for seasons in draft or registration status' },
        { status: 400 }
      );
    }

    // Initialize SeasonService
    const seasonService = new SeasonService(supabase);
    console.log('🎮 SeasonService initialized');

    // Generate fixtures
    console.log(`🎯 Generating fixtures (preview=${preview})...`);
    const result = await seasonService.generateFixtures(seasonId, preview);

    if (!result.success) {
      throw new Error(result.message || 'Failed to generate fixtures');
    }

    if (preview) {
      const fixtures = result.data || [];
      const matchdays = fixtures.length > 0
        ? Math.max(...fixtures.map((f: any) => f.matchday_number || 0))
        : 0;

      console.log(`✅ Preview generated: ${fixtures.length} matches across ${matchdays} matchdays`);

      // Fetch team details for preview
      const teamIds = [...new Set(fixtures.flatMap((f: any) => [f.home_team_id, f.away_team_id]))];
      const { data: teams } = await (supabase as any)
        .from('teams')
        .select('id, name, team_color')
        .in('id', teamIds);

      const teamsMap = new Map(teams?.map((t: any) => [t.id, t]) || []);

      // Add team info to fixtures
      const fixturesWithTeams = fixtures.map((f: any) => ({
        ...f,
        home_team: teamsMap.get(f.home_team_id),
        away_team: teamsMap.get(f.away_team_id)
      }));

      return NextResponse.json({
        success: true,
        preview: true,
        message: `Preview generated: ${fixtures.length} matches across ${matchdays} matchdays`,
        data: {
          fixtures: fixturesWithTeams,
          matchdays
        }
      });
    }

    const fixtures = result.data || [];
    const matchdays = fixtures.length > 0
      ? Math.max(...fixtures.map((f: any) => f.matchday_number || 0))
      : 0;

    console.log(`✅ Fixtures generated and saved: ${fixtures.length} matches`);
    return NextResponse.json({
      success: true,
      message: `Successfully generated ${fixtures.length} matches across ${matchdays} matchdays!`,
      data: {
        fixtures,
        matchdays
      }
    });

  } catch (error) {
    console.error('❌ ERROR: Error generating fixtures:', error);
    console.error('❌ ERROR STACK:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('❌ ERROR MESSAGE:', error instanceof Error ? error.message : String(error));

    // Handle specific error messages from SeasonService
    if (error instanceof Error) {
      // Check if it's a constraint violation error
      if (error.message.includes('Not enough available match dates') ||
          error.message.includes('cannot play their matches') ||
          error.message.includes('No teams registered')) {
        return NextResponse.json(
          {
            error: 'Scheduling constraint error',
            message: error.message,
            suggestion: 'Try increasing the season duration, adding more available match days, or reducing rest days between matches.'
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

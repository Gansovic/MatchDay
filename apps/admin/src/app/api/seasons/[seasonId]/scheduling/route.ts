/**
 * API Route: Season Scheduling Configuration
 *
 * GET /api/seasons/[seasonId]/scheduling - Get scheduling config
 * PATCH /api/seasons/[seasonId]/scheduling - Update scheduling config
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';

interface SchedulingConfig {
  match_day: string; // Day of week: 'monday', 'tuesday', etc.
  match_start_time: string; // Start time: '19:00:00'
  match_end_time: string; // End time: '21:00:00'
  courts_available: number; // Number of courts
  games_per_court: number; // Games per court in time window
  rest_weeks_between_matches: number; // Weeks between team matches
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ seasonId: string }> }
) {
  try {
    const { seasonId } = await params;

    if (!seasonId) {
      return NextResponse.json(
        { error: 'Season ID is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get the user from the session
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Get user from token
    const { data: { user }, error: authError } = await (supabase as any).auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Fetch the season with scheduling config
    const { data: season, error: fetchError} = await (supabase as any)
      .from('seasons')
      .select(`
        id,
        name,
        match_day,
        match_start_time,
        match_end_time,
        courts_available,
        games_per_court,
        rest_weeks_between_matches,
        leagues (
          id,
          created_by
        )
      `)
      .eq('id', seasonId)
      .single();

    if (fetchError || !season) {
      return NextResponse.json(
        { error: 'Season not found' },
        { status: 404 }
      );
    }

    // Check if user has permission (must be league creator)
    if (season.leagues?.created_by !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to view this season configuration' },
        { status: 403 }
      );
    }

    const config: SchedulingConfig = {
      match_day: season.match_day || 'saturday',
      match_start_time: season.match_start_time || '19:00:00',
      match_end_time: season.match_end_time || '21:00:00',
      courts_available: season.courts_available || 1,
      games_per_court: season.games_per_court || 2,
      rest_weeks_between_matches: season.rest_weeks_between_matches || 0
    };

    return NextResponse.json({
      success: true,
      data: config
    });

  } catch (error) {
    console.error('Error fetching scheduling config:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ seasonId: string }> }
) {
  console.log('🚀 UPDATE SCHEDULING CONFIG ENDPOINT HIT');
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
    const body = await request.json();
    const {
      match_day,
      match_start_time,
      match_end_time,
      courts_available,
      games_per_court,
      rest_weeks_between_matches
    } = body as Partial<SchedulingConfig>;

    console.log('📄 Request body parsed:', body);

    // Validate input
    const errors: string[] = [];

    if (match_day !== undefined) {
      const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      if (!validDays.includes(match_day.toLowerCase())) {
        errors.push(`Invalid match_day: ${match_day}. Must be one of: ${validDays.join(', ')}`);
      }
    }

    if (match_start_time !== undefined) {
      // Basic time format validation (HH:MM:SS)
      if (!/^\d{2}:\d{2}:\d{2}$/.test(match_start_time)) {
        errors.push('match_start_time must be in format HH:MM:SS (e.g., 19:00:00)');
      }
    }

    if (match_end_time !== undefined) {
      // Basic time format validation (HH:MM:SS)
      if (!/^\d{2}:\d{2}:\d{2}$/.test(match_end_time)) {
        errors.push('match_end_time must be in format HH:MM:SS (e.g., 21:00:00)');
      }
    }

    if (courts_available !== undefined) {
      if (typeof courts_available !== 'number' || courts_available < 1) {
        errors.push('courts_available must be a positive number');
      }
    }

    if (games_per_court !== undefined) {
      if (typeof games_per_court !== 'number' || games_per_court < 1) {
        errors.push('games_per_court must be a positive number');
      }
    }

    if (rest_weeks_between_matches !== undefined) {
      if (typeof rest_weeks_between_matches !== 'number' || rest_weeks_between_matches < 0) {
        errors.push('rest_weeks_between_matches must be a non-negative number');
      }
    }

    if (errors.length > 0) {
      console.log('❌ Validation errors:', errors);
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
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
        { error: 'You do not have permission to update this season configuration' },
        { status: 403 }
      );
    }
    console.log('✅ Permission check passed');

    // Check if season has active fixtures
    const { count: fixturesCount } = await (supabase as any)
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .eq('season_id', seasonId);

    if (fixturesCount && fixturesCount > 0) {
      console.log('⚠️ WARNING: Season has existing fixtures');
      return NextResponse.json(
        {
          error: 'Cannot update scheduling configuration',
          message: 'This season already has generated fixtures. Delete existing fixtures before updating configuration.'
        },
        { status: 409 }
      );
    }

    // Build update object (only include provided fields)
    const updateData: any = {};
    if (match_day !== undefined) updateData.match_day = match_day.toLowerCase();
    if (match_start_time !== undefined) updateData.match_start_time = match_start_time;
    if (match_end_time !== undefined) updateData.match_end_time = match_end_time;
    if (courts_available !== undefined) updateData.courts_available = courts_available;
    if (games_per_court !== undefined) updateData.games_per_court = games_per_court;
    if (rest_weeks_between_matches !== undefined) updateData.rest_weeks_between_matches = rest_weeks_between_matches;

    // Update season
    console.log('💾 Updating season scheduling config...');
    const { data: updatedSeason, error: updateError } = await (supabase as any)
      .from('seasons')
      .update(updateData)
      .eq('id', seasonId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ ERROR: Update failed', updateError);
      return NextResponse.json(
        { error: 'Failed to update scheduling configuration' },
        { status: 500 }
      );
    }

    console.log('✅ Scheduling config updated successfully');

    return NextResponse.json({
      success: true,
      message: 'Scheduling configuration updated successfully',
      data: {
        match_day: updatedSeason.match_day,
        match_start_time: updatedSeason.match_start_time,
        match_end_time: updatedSeason.match_end_time,
        courts_available: updatedSeason.courts_available,
        games_per_court: updatedSeason.games_per_court,
        rest_weeks_between_matches: updatedSeason.rest_weeks_between_matches
      }
    });

  } catch (error) {
    console.error('Error updating scheduling config:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

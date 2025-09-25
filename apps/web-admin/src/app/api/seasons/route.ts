/**
 * Admin Seasons API Route
 *
 * Provides season management functionality for admins including
 * creation, validation, and database operations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

interface CreateSeasonRequest {
  name: string;
  display_name?: string;
  league_id: string;
  season_year: number;
  tournament_format: 'league' | 'knockout' | 'hybrid';
  start_date: string;
  end_date: string;
  registration_deadline: string;
  min_teams: number;
  max_teams: number;
  status: 'draft' | 'registration';
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateSeasonRequest = await request.json();

    // Input validation
    const validationError = validateSeasonData(body);
    if (validationError) {
      return NextResponse.json(
        {
          success: false,
          error: validationError
        },
        { status: 400 }
      );
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies }
    );

    // Check if user is authenticated and has admin rights
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized'
        },
        { status: 401 }
      );
    }

    // Verify league exists and is accessible
    const { data: league, error: leagueError } = await supabase
      .from('leagues')
      .select('id, name, status')
      .eq('id', body.league_id)
      .single();

    if (leagueError || !league) {
      return NextResponse.json(
        {
          success: false,
          error: 'League not found or inaccessible'
        },
        { status: 404 }
      );
    }

    // Check for duplicate season names within the league
    const { data: existingSeason } = await supabase
      .from('seasons')
      .select('id')
      .eq('league_id', body.league_id)
      .eq('name', body.name)
      .single();

    if (existingSeason) {
      return NextResponse.json(
        {
          success: false,
          error: 'A season with this name already exists in the selected league'
        },
        { status: 409 }
      );
    }

    // Prepare season data
    const seasonData = {
      name: body.name,
      display_name: body.display_name || body.name,
      league_id: body.league_id,
      season_year: body.season_year,
      tournament_format: body.tournament_format,
      start_date: body.start_date,
      end_date: body.end_date,
      registration_deadline: body.registration_deadline,
      min_teams: body.min_teams,
      max_teams: body.max_teams,
      status: body.status,
      created_by: session.user.id,
      created_at: new Date().toISOString()
    };

    // Insert season into database
    const { data: newSeason, error: insertError } = await supabase
      .from('seasons')
      .insert([seasonData])
      .select(`
        *,
        league:leagues (
          id,
          name,
          sport_type,
          league_type
        )
      `)
      .single();

    if (insertError) {
      console.error('Season creation error:', insertError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create season: ' + insertError.message
        },
        { status: 500 }
      );
    }

    // Log the admin action (optional - table may not exist yet)
    try {
      await supabase
        .from('admin_actions')
        .insert([{
          admin_id: session.user.id,
          action_type: 'season_created',
          resource_type: 'season',
          resource_id: newSeason.id,
          details: {
            season_name: newSeason.name,
            league_name: league.name,
            league_id: league.id
          }
        }]);
    } catch (adminLogError) {
      // Admin actions logging is optional - continue if table doesn't exist
      console.warn('Could not log admin action:', adminLogError);
    }

    return NextResponse.json({
      success: true,
      data: newSeason,
      message: 'Season created successfully'
    });

  } catch (error) {
    console.error('Season creation API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies }
    );

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized'
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const leagueId = searchParams.get('league_id');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('seasons')
      .select(`
        *,
        league:leagues (
          id,
          name,
          sport_type,
          league_type
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (leagueId) {
      query = query.eq('league_id', leagueId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: seasons, error } = await query;

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message
        },
        { status: 500 }
      );
    }

    // Get team counts for each season
    const seasonsWithCounts = await Promise.all(
      (seasons || []).map(async (season) => {
        const { count } = await supabase
          .from('season_teams')
          .select('*', { count: 'exact', head: true })
          .eq('season_id', season.id);

        return {
          ...season,
          registered_teams_count: count || 0
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: seasonsWithCounts
    });

  } catch (error) {
    console.error('Seasons fetch API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}

function validateSeasonData(data: CreateSeasonRequest): string | null {
  // Required field validation
  if (!data.name?.trim()) {
    return 'Season name is required';
  }

  if (!data.league_id) {
    return 'League selection is required';
  }

  if (!data.season_year || data.season_year < 2020 || data.season_year > 2050) {
    return 'Valid season year is required (2020-2050)';
  }

  if (!['league', 'knockout', 'hybrid'].includes(data.tournament_format)) {
    return 'Valid tournament format is required';
  }

  if (!data.start_date || !data.end_date || !data.registration_deadline) {
    return 'All dates are required';
  }

  if (!['draft', 'registration'].includes(data.status)) {
    return 'Valid status is required';
  }

  // Date validation
  const startDate = new Date(data.start_date);
  const endDate = new Date(data.end_date);
  const regDeadline = new Date(data.registration_deadline);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || isNaN(regDeadline.getTime())) {
    return 'Invalid date format';
  }

  if (regDeadline >= startDate) {
    return 'Registration deadline must be before season start date';
  }

  if (startDate >= endDate) {
    return 'End date must be after start date';
  }

  // Team limits validation
  if (!data.min_teams || !data.max_teams) {
    return 'Team limits are required';
  }

  if (data.min_teams < 2 || data.max_teams < 2) {
    return 'Minimum and maximum teams must be at least 2';
  }

  if (data.min_teams >= data.max_teams) {
    return 'Maximum teams must be greater than minimum teams';
  }

  if (data.min_teams > 64 || data.max_teams > 64) {
    return 'Team limits cannot exceed 64';
  }

  // Season name validation
  if (data.name.length > 100) {
    return 'Season name cannot exceed 100 characters';
  }

  if (data.display_name && data.display_name.length > 100) {
    return 'Display name cannot exceed 100 characters';
  }

  return null;
}
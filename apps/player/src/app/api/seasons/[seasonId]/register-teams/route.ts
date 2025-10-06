import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server-client';

interface RouteParams {
  params: Promise<{ seasonId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { seasonId } = await params;
    const { teamIds } = await request.json();

    if (!seasonId || !teamIds || !Array.isArray(teamIds)) {
      return NextResponse.json(
        { success: false, error: 'Season ID and team IDs array are required' },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();

    // Register each team for the season
    const registrations = teamIds.map(teamId => ({
      season_id: seasonId,
      team_id: teamId,
      status: 'confirmed',
      registration_date: '2022-08-15T10:00:00Z'
    }));

    const { data, error } = await (supabase as any)
      .from('season_teams')
      .insert(registrations)
      .select();

    if (error) {
      console.error('Registration error:', error);
      return NextResponse.json(
        { success: false, error: `Failed to register teams: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: `Successfully registered ${teamIds.length} teams for the season`
    });

  } catch (error) {
    console.error('Error registering teams:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
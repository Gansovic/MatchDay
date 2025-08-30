import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: team, error } = await supabase
      .from('teams')
      .select(`
        *,
        team_members(
          *,
          user:user_profiles(*)
        ),
        league_teams(
          league:leagues(id, name, sport_type)
        ),
        captain:user_profiles!teams_captain_id_fkey(*),
        vice_captain:user_profiles!teams_vice_captain_id_fkey(*)
      `)
      .eq('id', params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Team not found' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const { data: stats } = await supabase
      .from('team_statistics')
      .select('*')
      .eq('team_id', params.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({
      ...team,
      statistics: stats || {
        matches_played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goals_for: 0,
        goals_against: 0,
        points: 0
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const updateData: any = {};
    const allowedFields = [
      'name', 'description', 'logo_url', 'home_colors', 'away_colors',
      'home_ground', 'location', 'captain_id', 'vice_captain_id',
      'contact_email', 'contact_phone', 'website', 'social_media'
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const { data: team, error } = await supabase
      .from('teams')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Team not found' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (body.captain_id && body.captain_id !== team.captain_id) {
      await supabase
        .from('team_members')
        .update({ role: 'player' })
        .eq('team_id', params.id)
        .eq('role', 'captain');

      await supabase
        .from('team_members')
        .update({ role: 'captain' })
        .eq('team_id', params.id)
        .eq('user_id', body.captain_id);
    }

    if (body.vice_captain_id && body.vice_captain_id !== team.vice_captain_id) {
      await supabase
        .from('team_members')
        .update({ role: 'player' })
        .eq('team_id', params.id)
        .eq('role', 'vice_captain');

      await supabase
        .from('team_members')
        .update({ role: 'vice_captain' })
        .eq('team_id', params.id)
        .eq('user_id', body.vice_captain_id);
    }

    return NextResponse.json(team);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: team, error } = await supabase
      .from('teams')
      .update({ is_active: false })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Team not found' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await supabase
      .from('team_members')
      .update({ is_active: false })
      .eq('team_id', params.id);

    return NextResponse.json({ 
      message: 'Team archived successfully',
      team 
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
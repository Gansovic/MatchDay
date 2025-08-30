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
    const { data: player, error } = await supabase
      .from('user_profiles')
      .select(`
        *,
        team_members(
          *,
          team:teams(*)
        ),
        player_statistics(*),
        match_events(
          match_id,
          event_type,
          minute,
          match:matches(
            id,
            home_team:teams!matches_home_team_id_fkey(name),
            away_team:teams!matches_away_team_id_fkey(name),
            home_score,
            away_score,
            match_date
          )
        )
      `)
      .eq('id', params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Player not found' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const currentSeason = new Date().getFullYear();
    const currentStats = player.player_statistics?.find(
      (s: any) => s.season === currentSeason.toString()
    ) || {
      matches_played: 0,
      goals: 0,
      assists: 0,
      yellow_cards: 0,
      red_cards: 0,
      clean_sheets: 0
    };

    return NextResponse.json({
      ...player,
      current_season_stats: currentStats,
      career_stats: {
        total_matches: player.player_statistics?.reduce((acc: number, s: any) => acc + s.matches_played, 0) || 0,
        total_goals: player.player_statistics?.reduce((acc: number, s: any) => acc + s.goals, 0) || 0,
        total_assists: player.player_statistics?.reduce((acc: number, s: any) => acc + s.assists, 0) || 0,
        total_yellow_cards: player.player_statistics?.reduce((acc: number, s: any) => acc + s.yellow_cards, 0) || 0,
        total_red_cards: player.player_statistics?.reduce((acc: number, s: any) => acc + s.red_cards, 0) || 0,
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
      'display_name', 'first_name', 'last_name', 'date_of_birth',
      'phone', 'avatar_url', 'bio', 'nationality',
      'preferred_position', 'preferred_foot', 'height', 'weight',
      'emergency_contact', 'medical_info'
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

    const { data: player, error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Player not found' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(player);
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
    const { data: player, error } = await supabase
      .from('user_profiles')
      .update({ is_active: false })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Player not found' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await supabase
      .from('team_members')
      .update({ is_active: false })
      .eq('user_id', params.id);

    return NextResponse.json({ 
      message: 'Player deactivated successfully',
      player 
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
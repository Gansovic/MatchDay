import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const team_id = searchParams.get('team_id');
    const search = searchParams.get('search');
    const position = searchParams.get('position');
    const limit = searchParams.get('limit') || '50';
    const offset = searchParams.get('offset') || '0';

    let query = supabase
      .from('user_profiles')
      .select(`
        *,
        team_members(
          team_id,
          role,
          jersey_number,
          position,
          team:teams(id, name, logo_url)
        ),
        player_statistics(
          season,
          matches_played,
          goals,
          assists,
          yellow_cards,
          red_cards,
          clean_sheets
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (search) {
      query = query.or(`display_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    let filteredData = data;
    if (team_id) {
      filteredData = data?.filter(player => 
        player.team_members?.some((tm: any) => tm.team_id === team_id)
      );
    }

    if (position) {
      filteredData = filteredData?.filter(player =>
        player.team_members?.some((tm: any) => tm.position === position)
      );
    }

    return NextResponse.json({
      data: filteredData,
      count: filteredData?.length || 0,
      total: count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const requiredFields = ['email', 'display_name'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    const { data: existingUser } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', body.email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    const profileData = {
      email: body.email,
      display_name: body.display_name,
      first_name: body.first_name || null,
      last_name: body.last_name || null,
      date_of_birth: body.date_of_birth || null,
      phone: body.phone || null,
      avatar_url: body.avatar_url || null,
      bio: body.bio || null,
      nationality: body.nationality || null,
      preferred_position: body.preferred_position || null,
      preferred_foot: body.preferred_foot || null,
      height: body.height || null,
      weight: body.weight || null,
      emergency_contact: body.emergency_contact || null,
      medical_info: body.medical_info || null,
      is_active: true
    };

    const { data: player, error } = await supabase
      .from('user_profiles')
      .insert(profileData)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (body.season) {
      await supabase
        .from('player_statistics')
        .insert({
          player_id: player.id,
          season: body.season,
          matches_played: 0,
          goals: 0,
          assists: 0,
          yellow_cards: 0,
          red_cards: 0,
          clean_sheets: 0
        });
    }

    return NextResponse.json(player, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
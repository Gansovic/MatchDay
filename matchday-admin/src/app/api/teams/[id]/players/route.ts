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
    const { data: players, error } = await supabase
      .from('team_members')
      .select(`
        *,
        user:user_profiles(
          *,
          player_statistics(
            goals,
            assists,
            yellow_cards,
            red_cards,
            matches_played
          )
        )
      `)
      .eq('team_id', params.id)
      .eq('is_active', true)
      .order('jersey_number', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(players);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    if (!body.user_id) {
      return NextResponse.json(
        { error: 'Missing required field: user_id' },
        { status: 400 }
      );
    }

    const { data: existingMember } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', params.id)
      .eq('user_id', body.user_id)
      .single();

    if (existingMember) {
      if (!existingMember.is_active) {
        const { data: reactivated, error } = await supabase
          .from('team_members')
          .update({ 
            is_active: true,
            joined_at: new Date().toISOString()
          })
          .eq('id', existingMember.id)
          .select()
          .single();

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }
        return NextResponse.json(reactivated);
      }
      
      return NextResponse.json(
        { error: 'Player is already a member of this team' },
        { status: 409 }
      );
    }

    const memberData = {
      team_id: params.id,
      user_id: body.user_id,
      role: body.role || 'player',
      jersey_number: body.jersey_number || null,
      position: body.position || null,
      joined_at: new Date().toISOString(),
      is_active: true
    };

    const { data: member, error } = await supabase
      .from('team_members')
      .insert(memberData)
      .select(`
        *,
        user:user_profiles(*)
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(member, { status: 201 });
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
    const searchParams = request.nextUrl.searchParams;
    const playerId = searchParams.get('player_id');
    
    if (!playerId) {
      return NextResponse.json(
        { error: 'Missing player_id parameter' },
        { status: 400 }
      );
    }

    const { data: member, error } = await supabase
      .from('team_members')
      .update({ 
        is_active: false,
        left_at: new Date().toISOString()
      })
      .eq('team_id', params.id)
      .eq('user_id', playerId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Player not found in team' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ 
      message: 'Player removed from team successfully',
      member 
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
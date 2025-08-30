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
    const searchParams = request.nextUrl.searchParams;
    const season = searchParams.get('season');

    let query = supabase
      .from('player_statistics')
      .select('*')
      .eq('player_id', params.id)
      .order('season', { ascending: false });

    if (season) {
      query = query.eq('season', season);
    }

    const { data: stats, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(stats);
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
    
    if (!body.season) {
      body.season = new Date().getFullYear().toString();
    }

    const { data: existingStats } = await supabase
      .from('player_statistics')
      .select('*')
      .eq('player_id', params.id)
      .eq('season', body.season)
      .single();

    if (existingStats) {
      const updateData: any = {};
      
      if (body.matches_played !== undefined) {
        updateData.matches_played = existingStats.matches_played + (body.matches_played || 0);
      }
      if (body.goals !== undefined) {
        updateData.goals = existingStats.goals + (body.goals || 0);
      }
      if (body.assists !== undefined) {
        updateData.assists = existingStats.assists + (body.assists || 0);
      }
      if (body.yellow_cards !== undefined) {
        updateData.yellow_cards = existingStats.yellow_cards + (body.yellow_cards || 0);
      }
      if (body.red_cards !== undefined) {
        updateData.red_cards = existingStats.red_cards + (body.red_cards || 0);
      }
      if (body.clean_sheets !== undefined) {
        updateData.clean_sheets = existingStats.clean_sheets + (body.clean_sheets || 0);
      }

      const { data: updated, error } = await supabase
        .from('player_statistics')
        .update(updateData)
        .eq('id', existingStats.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json(updated);
    } else {
      const statsData = {
        player_id: params.id,
        season: body.season,
        matches_played: body.matches_played || 0,
        goals: body.goals || 0,
        assists: body.assists || 0,
        yellow_cards: body.yellow_cards || 0,
        red_cards: body.red_cards || 0,
        clean_sheets: body.clean_sheets || 0
      };

      const { data: newStats, error } = await supabase
        .from('player_statistics')
        .insert(statsData)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json(newStats, { status: 201 });
    }
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
    
    if (!body.season) {
      return NextResponse.json(
        { error: 'Season is required' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    const allowedFields = [
      'matches_played', 'goals', 'assists',
      'yellow_cards', 'red_cards', 'clean_sheets'
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

    const { data: stats, error } = await supabase
      .from('player_statistics')
      .update(updateData)
      .eq('player_id', params.id)
      .eq('season', body.season)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Statistics not found for this season' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
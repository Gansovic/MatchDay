import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const limit = searchParams.get('limit') || '50';
    const offset = searchParams.get('offset') || '0';

    let query = supabase
      .from('leagues')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      data,
      count,
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
    
    const requiredFields = ['name', 'description', 'sport_type', 'season_start', 'season_end'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    const leagueData = {
      name: body.name,
      description: body.description,
      sport_type: body.sport_type,
      location: body.location || null,
      season_start: body.season_start,
      season_end: body.season_end,
      max_teams: body.max_teams || 20,
      min_teams: body.min_teams || 4,
      entry_fee: body.entry_fee || 0,
      prize_pool: body.prize_pool || 0,
      rules: body.rules || {},
      settings: body.settings || {},
      status: body.status || 'draft',
      is_active: true,
      created_by: body.created_by
    };

    const { data: league, error } = await supabase
      .from('leagues')
      .insert(leagueData)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (body.created_by) {
      await supabase
        .from('league_admins')
        .insert({
          league_id: league.id,
          user_id: body.created_by,
          role: 'owner'
        });
    }

    return NextResponse.json(league, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
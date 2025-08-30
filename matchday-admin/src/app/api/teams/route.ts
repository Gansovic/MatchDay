import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const league_id = searchParams.get('league_id');
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const limit = searchParams.get('limit') || '50';
    const offset = searchParams.get('offset') || '0';

    let query = supabase
      .from('teams')
      .select(`
        *,
        team_members(count),
        league_teams(league_id)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (status) {
      query = query.eq('is_active', status === 'active');
    }

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    let filteredData = data;
    if (league_id) {
      filteredData = data?.filter(team => 
        team.league_teams?.some((lt: any) => lt.league_id === league_id)
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
    
    const requiredFields = ['name', 'sport_type', 'captain_id'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    const teamData = {
      name: body.name,
      description: body.description || '',
      sport_type: body.sport_type,
      logo_url: body.logo_url || null,
      home_colors: body.home_colors || { primary: '#000000', secondary: '#FFFFFF' },
      away_colors: body.away_colors || { primary: '#FFFFFF', secondary: '#000000' },
      home_ground: body.home_ground || null,
      location: body.location || null,
      captain_id: body.captain_id,
      vice_captain_id: body.vice_captain_id || null,
      contact_email: body.contact_email || null,
      contact_phone: body.contact_phone || null,
      founded_date: body.founded_date || null,
      website: body.website || null,
      social_media: body.social_media || {},
      is_active: true,
      created_by: body.created_by || body.captain_id
    };

    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert(teamData)
      .select()
      .single();

    if (teamError) {
      return NextResponse.json({ error: teamError.message }, { status: 400 });
    }

    const { error: memberError } = await supabase
      .from('team_members')
      .insert({
        team_id: team.id,
        user_id: body.captain_id,
        role: 'captain',
        jersey_number: body.captain_jersey_number || null,
        position: body.captain_position || null,
        joined_at: new Date().toISOString(),
        is_active: true
      });

    if (memberError) {
      console.error('Failed to add captain as team member:', memberError);
    }

    if (body.vice_captain_id && body.vice_captain_id !== body.captain_id) {
      await supabase
        .from('team_members')
        .insert({
          team_id: team.id,
          user_id: body.vice_captain_id,
          role: 'vice_captain',
          jersey_number: body.vice_captain_jersey_number || null,
          position: body.vice_captain_position || null,
          joined_at: new Date().toISOString(),
          is_active: true
        });
    }

    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
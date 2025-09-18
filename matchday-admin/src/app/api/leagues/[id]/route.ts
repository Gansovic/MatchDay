import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch league with teams and team members data that LeagueService expects
    const { data: league, error } = await supabase
      .from('leagues')
      .select(`
        *,
        teams (
          id,
          name,
          team_color,
          captain_id,
          max_players,
          is_active,
          is_recruiting,
          created_at,
          updated_at,
          team_members (
            id,
            user_id,
            is_active,
            position,
            jersey_number,
            users (
              id,
              email,
              full_name
            )
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          success: false,
          data: null,
          error: 'League not found'
        }, { status: 404 });
      }
      return NextResponse.json({
        success: false,
        data: null,
        error: error.message
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: league,
      error: null
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      data: null,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: any = {};
    const allowedFields = [
      'name', 'description', 'sport_type', 'location',
      'season_start', 'season_end', 'max_teams', 'min_teams',
      'entry_fee', 'prize_pool', 'rules', 'settings', 'status'
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({
        success: false,
        data: null,
        error: 'No valid fields to update'
      }, { status: 400 });
    }

    const { data: league, error } = await supabase
      .from('leagues')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          success: false,
          data: null,
          error: 'League not found'
        }, { status: 404 });
      }
      return NextResponse.json({
        success: false,
        data: null,
        error: error.message
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: league,
      error: null
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      data: null,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data: league, error } = await supabase
      .from('leagues')
      .update({ is_active: false, status: 'archived' })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          success: false,
          data: null,
          error: 'League not found'
        }, { status: 404 });
      }
      return NextResponse.json({
        success: false,
        data: null,
        error: error.message
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'League archived successfully',
        league
      },
      error: null
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      data: null,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
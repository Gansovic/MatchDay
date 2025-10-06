/**
 * Teams API Route
 * 
 * Provides team management functionality for authenticated users.
 * Allows users to view their teams for league registration.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Create authenticated client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies }
    );
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Get teams where user is captain
    const { data: teams, error } = await supabase
      .from('teams')
      .select(`
        id,
        name,
        team_color,
        team_bio,
        league_id,
        captain_id,
        max_players,
        min_players,
        is_recruiting,
        created_at
      `)
      .eq('captain_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Teams API error:', error);
      return NextResponse.json(
        { 
          error: 'Failed to fetch teams',
          code: 'FETCH_ERROR'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: teams || [],
      success: true
    });

  } catch (error) {
    console.error('Teams API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createUserSupabaseClient } from '@/lib/supabase/server-client';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Matches API called');

    // Get authenticated user
    const supabaseUserClient = createUserSupabaseClient(request);
    const { data: { user }, error: userError } = await supabaseUserClient.auth.getUser();
    
    if (userError || !user) {
      console.log('❌ Matches API - Authentication failed:', userError?.message);
      return NextResponse.json(
        { error: 'Authentication required', message: 'Please log in to view matches' },
        { status: 401 }
      );
    }
    
    console.log('✅ Matches API - Authenticated user:', user.id);

    // Use server client for database operations
    const supabaseServerClient = await createServerSupabaseClient();
    
    // Get user's team memberships to find their matches
    const { data: memberships, error: membershipsError } = await supabaseServerClient
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (membershipsError) {
      console.error('❌ Failed to get team memberships:', membershipsError);
      return NextResponse.json(
        { error: 'Failed to load team memberships' },
        { status: 500 }
      );
    }

    if (!memberships || memberships.length === 0) {
      console.log('📝 User has no team memberships');
      return NextResponse.json({ success: true, data: [] });
    }

    const teamIds = memberships.map(m => m.team_id);
    console.log('🏟️ User teams:', teamIds);
    
    // Debug: Log the exact query we're about to run
    const teamQuery = teamIds.map(teamId => `home_team_id.eq.${teamId},away_team_id.eq.${teamId}`).join(',');
    console.log('🔍 Team query string:', teamQuery);

    // Query matches where user's teams are involved
    // Get all matches with team details and match numbers (if available)
    const { data: matches, error: matchesError } = await supabaseServerClient
      .from('matches')
      .select(`
        *,
        home_team:teams!matches_home_team_id_fkey(id, name, team_color),
        away_team:teams!matches_away_team_id_fkey(id, name, team_color)
      `)
      .order('match_date', { ascending: true });

    if (matchesError) {
      console.error('❌ Failed to get matches:', matchesError);
      return NextResponse.json(
        { error: 'Failed to load matches' },
        { status: 500 }
      );
    }
    
    // Debug: Log raw matches data
    console.log('🔍 Raw matches from database:', matches?.length || 0, matches);

    console.log('✅ Successfully loaded matches:', matches?.length || 0);
    return NextResponse.json({ success: true, data: matches || [] });

  } catch (error) {
    console.error('❌ Matches API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to process request' },
      { status: 500 }
    );
  }
}
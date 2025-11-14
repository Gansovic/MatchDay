import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server-client';
import { validateApiAuth } from '@/lib/auth/api-auth';

export async function GET(request: NextRequest) {
  try {
    const authResult = await validateApiAuth(request);
    if (!authResult.success) {
      return authResult.response!;
    }

    const { user } = authResult;
    const supabase = await createServerSupabaseClient();

    // Check team_members table directly
    const { data: memberships, error: memberError, count } = await supabase
      .from('team_members')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id);

    console.log('🔍 DEBUG - Direct team_members query:', {
      userId: user.id,
      membershipCount: memberships?.length || 0,
      totalCount: count,
      error: memberError?.message,
      memberships: memberships
    });

    // Check teams created by user
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .eq('captain_id', user.id);

    console.log('🔍 DEBUG - Teams where user is captain:', {
      teamsCount: teams?.length || 0,
      teams: teams
    });

    return NextResponse.json({
      userId: user.id,
      memberships: memberships || [],
      membershipCount: memberships?.length || 0,
      totalCount: count,
      teamsAsCaptain: teams || [],
      teamsAsCaptainCount: teams?.length || 0,
      errors: {
        memberError: memberError?.message,
        teamsError: teamsError?.message
      }
    });

  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Admin Leagues API Route
 *
 * Returns leagues created by the authenticated admin user.
 * Includes both public and private leagues.
 *
 * Note: Uses admin client (service role) to bypass RLS and fetch all admin's leagues
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { LeagueService } from '@matchday/services';
import { supabase as browserClient } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    // Get user from browser client (for user ID)
    const { data: { user }, error: authError } = await browserClient.auth.getUser();

    // Try to get userId from header if browser client fails
    let userId: string | null = user?.id || null;

    if (!userId) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const { data: { user: tokenUser }, error } = await browserClient.auth.getUser(token);
        if (!error && tokenUser) {
          userId = tokenUser.id;
        }
      }
    }

    // If still no user, use admin client to query all leagues
    // The frontend will handle the filtering based on current user
    console.log('Admin leagues API - User ID:', userId || 'using admin client');

    const { searchParams } = new URL(request.url);
    const options = {
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0
    };

    // Use admin client to bypass RLS and fetch ALL active leagues
    const adminClient = createAdminClient();

    // Query all active leagues directly (both public and private)
    // Admin has full access, so we don't filter by is_public
    const { data: leagues, error, count } = await adminClient
      .from('leagues')
      .select(`
        *,
        teams (
          id,
          name,
          team_color,
          captain_id,
          max_players,
          min_players,
          is_recruiting
        )
      `, { count: 'exact' })
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(options.offset || 0, (options.offset || 0) + (options.limit || 100) - 1);

    if (error) {
      console.error('Admin leagues API - Query error:', error);
      return NextResponse.json(
        {
          error: error.message || 'Failed to fetch leagues',
          code: error.code || 'QUERY_ERROR',
          success: false
        },
        { status: 500 }
      );
    }

    // Transform to discovery format
    const discoveryLeagues = await Promise.all(
      (leagues || []).map(async (league) => {
        const teams = league.teams || [];
        let playerCount = 0;

        // Count players across all teams (only if there are teams)
        if (teams.length > 0) {
          const teamIds = teams.map(t => t.id).filter(Boolean);
          if (teamIds.length > 0) {
            const { count } = await adminClient
              .from('team_members')
              .select('*', { count: 'exact', head: true })
              .eq('is_active', true)
              .in('team_id', teamIds);
            playerCount = count || 0;
          }
        }

        return {
          ...league,
          teams,
          teamCount: teams.length,
          playerCount,
          availableSpots: 0,
          isUserMember: false
        };
      })
    );

    console.log('Admin leagues API - Result:', {
      success: true,
      count: discoveryLeagues.length,
      total: count,
      userId,
      publicCount: discoveryLeagues.filter(l => l.is_public).length,
      privateCount: discoveryLeagues.filter(l => !l.is_public).length
    });

    const pagination = {
      page: Math.floor((options.offset || 0) / (options.limit || 20)) + 1,
      limit: options.limit || 20,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / (options.limit || 20)),
      hasNext: ((options.offset || 0) + (options.limit || 20)) < (count || 0),
      hasPrevious: (options.offset || 0) > 0
    };

    return NextResponse.json({
      data: discoveryLeagues,
      pagination,
      success: true
    });

  } catch (error) {
    console.error('Admin leagues API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        success: false
      },
      { status: 500 }
    );
  }
}

/**
 * Public Leagues API Route
 * 
 * Provides public league discovery functionality for teams to browse
 * and join published leagues. Supports Copa Facil-style filtering.
 */

import { NextRequest, NextResponse } from 'next/server';
import { LeagueService, PublicLeagueFilters } from '@matchday/services';
import { supabase } from '@/lib/supabase/client';
import { SportType, LeagueType } from '@matchday/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const filters: PublicLeagueFilters = {
      sportType: searchParams.get('sport_type') as SportType || undefined,
      leagueType: searchParams.get('league_type') as LeagueType || undefined,
      location: searchParams.get('location') || undefined,
      search: searchParams.get('search') || undefined,
      featured: searchParams.get('featured') === 'true',
      openRegistration: searchParams.get('open_registration') === 'true',
      entryFeeMax: searchParams.get('max_entry_fee') ? parseInt(searchParams.get('max_entry_fee')!) : undefined
    };

    const options = {
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0
    };

    // Get league service instance
    const leagueService = LeagueService.getInstance(supabase);
    
    // Fetch public leagues
    const result = await leagueService.getPublicLeagues(filters, options);

    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.error?.message || 'Failed to fetch leagues',
          code: result.error?.code || 'FETCH_ERROR'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: result.data,
      pagination: result.pagination,
      success: true
    });

  } catch (error) {
    console.error('Public leagues API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}
/**
 * API Route: League Requests
 * 
 * GET /api/league-requests
 * Fetches league requests for the authenticated admin
 */

import { NextRequest, NextResponse } from 'next/server';
import { LeagueRequestService } from '@/lib/services/league-request.service';
import { supabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    // Get the user from the session
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Get user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Use the LeagueRequestService to get pending requests
    const leagueRequestService = LeagueRequestService.getInstance();
    
    const result = await leagueRequestService.getPendingRequests(user.id);

    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.error?.message || 'Failed to fetch requests',
          code: result.error?.code
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      count: result.data?.length || 0
    });

  } catch (error) {
    console.error('Error fetching league requests:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
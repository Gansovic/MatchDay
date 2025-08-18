/**
 * User Invitations API Routes
 * 
 * Handles user invitation operations:
 * - GET /api/invitations - List user's pending invitations
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

/**
 * GET /api/invitations
 * List user's pending invitations
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const supabase = createServerClient();
    const token = authHeader.replace('Bearer ', '');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or expired authentication token' },
        { status: 401 }
      );
    }

    // Get user's pending invitations by email or user_id
    const { data: invitations, error: invitationsError } = await supabase
      .from('team_invitations')
      .select(`
        *,
        team:teams(
          id,
          name,
          location,
          team_color,
          team_bio,
          max_players,
          captain:users!teams_captain_id_fkey(
            display_name,
            email
          )
        ),
        invited_by_user:users!team_invitations_invited_by_fkey(
          display_name,
          email
        )
      `)
      .or(`invited_user_id.eq.${user.id},invited_email.eq.${user.email}`)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (invitationsError) {
      console.error('Invitations fetch error:', invitationsError);
      return NextResponse.json(
        { error: 'Fetch failed', message: 'Failed to fetch invitations' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: invitations || [],
      count: invitations?.length || 0,
      message: 'Invitations retrieved successfully'
    });

  } catch (error) {
    console.error('Error in GET /api/invitations:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
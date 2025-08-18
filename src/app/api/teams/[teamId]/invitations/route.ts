/**
 * Team Invitations API Routes
 * 
 * Handles team invitation operations:
 * - POST /api/teams/[teamId]/invitations - Send player invitation (captain only)
 * - GET /api/teams/[teamId]/invitations - List team's pending invitations (captain only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

interface SendInvitationRequest {
  email: string;
  position?: string;
  jersey_number?: number;
  message?: string;
}

interface InvitationValidationError {
  field: string;
  message: string;
}

/**
 * POST /api/teams/[teamId]/invitations
 * Send a player invitation (captain only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const teamId = params.teamId;

    // Parse request body
    let requestData: SendInvitationRequest;
    try {
      requestData = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid request body', message: 'Request body must be valid JSON' },
        { status: 400 }
      );
    }

    // Validate request data
    const errors: InvitationValidationError[] = [];
    
    if (!requestData.email || typeof requestData.email !== 'string') {
      errors.push({ field: 'email', message: 'Email is required' });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(requestData.email)) {
      errors.push({ field: 'email', message: 'Invalid email format' });
    }

    if (requestData.jersey_number && (requestData.jersey_number < 1 || requestData.jersey_number > 99)) {
      errors.push({ field: 'jersey_number', message: 'Jersey number must be between 1 and 99' });
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          message: 'Please correct the following errors',
          validationErrors: errors
        },
        { status: 400 }
      );
    }

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

    // Verify user is captain of the team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('captain_id, name, max_players')
      .eq('id', teamId)
      .single();

    if (teamError || !team) {
      return NextResponse.json(
        { error: 'Team not found', message: 'The specified team does not exist' },
        { status: 404 }
      );
    }

    if (team.captain_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Only the team captain can send invitations' },
        { status: 403 }
      );
    }

    // Check if team is at capacity
    const { count: currentMemberCount } = await supabase
      .from('team_members')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', teamId)
      .eq('is_active', true);

    if (currentMemberCount && currentMemberCount >= (team.max_players || 22)) {
      return NextResponse.json(
        { error: 'Team full', message: 'Team has reached maximum capacity' },
        { status: 400 }
      );
    }

    // Check if jersey number is already taken
    if (requestData.jersey_number) {
      const { data: existingMember } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', teamId)
        .eq('jersey_number', requestData.jersey_number)
        .eq('is_active', true)
        .single();

      if (existingMember) {
        return NextResponse.json(
          { error: 'Jersey taken', message: `Jersey number ${requestData.jersey_number} is already taken` },
          { status: 400 }
        );
      }

      // Check if jersey number is reserved by pending invitation
      const { data: pendingInvitation } = await supabase
        .from('team_invitations')
        .select('id')
        .eq('team_id', teamId)
        .eq('jersey_number', requestData.jersey_number)
        .eq('status', 'pending')
        .single();

      if (pendingInvitation) {
        return NextResponse.json(
          { error: 'Jersey reserved', message: `Jersey number ${requestData.jersey_number} is reserved by a pending invitation` },
          { status: 400 }
        );
      }
    }

    // Check if there's already a pending invitation for this email
    const { data: existingInvitation } = await supabase
      .from('team_invitations')
      .select('id')
      .eq('team_id', teamId)
      .eq('invited_email', requestData.email.toLowerCase())
      .eq('status', 'pending')
      .single();

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'Already invited', message: 'This email already has a pending invitation' },
        { status: 400 }
      );
    }

    // Check if user is already a team member
    const { data: existingMember } = await supabase
      .from('team_members')
      .select('tm.id')
      .from('team_members as tm')
      .innerJoin('users as u', 'tm.user_id', 'u.id')
      .eq('tm.team_id', teamId)
      .eq('u.email', requestData.email.toLowerCase())
      .eq('tm.is_active', true)
      .single();

    if (existingMember) {
      return NextResponse.json(
        { error: 'Already member', message: 'This user is already a team member' },
        { status: 400 }
      );
    }

    // Check if invited user exists
    const { data: invitedUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', requestData.email.toLowerCase())
      .single();

    // Create the invitation
    const invitationData = {
      team_id: teamId,
      invited_by: user.id,
      invited_email: requestData.email.toLowerCase(),
      invited_user_id: invitedUser?.id || null,
      position: requestData.position || null,
      jersey_number: requestData.jersey_number || null,
      message: requestData.message || null,
      status: 'pending' as const
    };

    const { data: invitation, error: invitationError } = await supabase
      .from('team_invitations')
      .insert(invitationData)
      .select(`
        *,
        team:teams(name),
        invited_by_user:users!team_invitations_invited_by_fkey(display_name, email)
      `)
      .single();

    if (invitationError) {
      console.error('Invitation creation error:', invitationError);
      return NextResponse.json(
        { error: 'Creation failed', message: 'Failed to create invitation' },
        { status: 500 }
      );
    }

    // TODO: Send email notification here
    // For now, we'll just return success

    return NextResponse.json({
      data: invitation,
      message: 'Invitation sent successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/teams/[teamId]/invitations:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/teams/[teamId]/invitations
 * List team's pending invitations (captain only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const teamId = params.teamId;

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

    // Verify user is captain of the team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('captain_id')
      .eq('id', teamId)
      .single();

    if (teamError || !team) {
      return NextResponse.json(
        { error: 'Team not found', message: 'The specified team does not exist' },
        { status: 404 }
      );
    }

    if (team.captain_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Only the team captain can view invitations' },
        { status: 403 }
      );
    }

    // Get pending invitations
    const { data: invitations, error: invitationsError } = await supabase
      .from('team_invitations')
      .select(`
        *,
        invited_by_user:users!team_invitations_invited_by_fkey(display_name, email)
      `)
      .eq('team_id', teamId)
      .eq('status', 'pending')
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
      message: 'Invitations retrieved successfully'
    });

  } catch (error) {
    console.error('Error in GET /api/teams/[teamId]/invitations:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
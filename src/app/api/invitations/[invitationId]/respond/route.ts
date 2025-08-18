/**
 * Invitation Response API Route
 * 
 * Handles invitation responses:
 * - POST /api/invitations/[invitationId]/respond - Accept or decline invitation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

interface InvitationResponseRequest {
  action: 'accept' | 'decline';
}

/**
 * POST /api/invitations/[invitationId]/respond
 * Accept or decline an invitation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { invitationId: string } }
) {
  try {
    const invitationId = params.invitationId;

    // Parse request body
    let requestData: InvitationResponseRequest;
    try {
      requestData = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid request body', message: 'Request body must be valid JSON' },
        { status: 400 }
      );
    }

    // Validate action
    if (!requestData.action || !['accept', 'decline'].includes(requestData.action)) {
      return NextResponse.json(
        { error: 'Invalid action', message: 'Action must be either "accept" or "decline"' },
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

    // Get the invitation and verify it belongs to the user
    const { data: invitation, error: invitationError } = await supabase
      .from('team_invitations')
      .select(`
        *,
        team:teams(
          id,
          name,
          max_players,
          captain_id
        )
      `)
      .eq('id', invitationId)
      .single();

    if (invitationError || !invitation) {
      return NextResponse.json(
        { error: 'Invitation not found', message: 'The specified invitation does not exist' },
        { status: 404 }
      );
    }

    // Verify the invitation belongs to the current user
    if (invitation.invited_user_id !== user.id && invitation.invited_email !== user.email) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You can only respond to your own invitations' },
        { status: 403 }
      );
    }

    // Check if invitation is still valid
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: 'Invalid invitation', message: `Invitation has already been ${invitation.status}` },
        { status: 400 }
      );
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Expired invitation', message: 'This invitation has expired' },
        { status: 400 }
      );
    }

    // Handle decline
    if (requestData.action === 'decline') {
      const { error: updateError } = await supabase
        .from('team_invitations')
        .update({
          status: 'declined',
          responded_at: new Date().toISOString()
        })
        .eq('id', invitationId);

      if (updateError) {
        console.error('Invitation decline error:', updateError);
        return NextResponse.json(
          { error: 'Update failed', message: 'Failed to decline invitation' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'Invitation declined successfully'
      });
    }

    // Handle accept
    if (requestData.action === 'accept') {
      // Check if team is at capacity
      const { count: currentMemberCount } = await supabase
        .from('team_members')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', invitation.team_id)
        .eq('is_active', true);

      if (currentMemberCount && currentMemberCount >= (invitation.team?.max_players || 22)) {
        return NextResponse.json(
          { error: 'Team full', message: 'Team has reached maximum capacity' },
          { status: 400 }
        );
      }

      // Check if user is already a member of this team
      const { data: existingMember } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', invitation.team_id)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (existingMember) {
        return NextResponse.json(
          { error: 'Already member', message: 'You are already a member of this team' },
          { status: 400 }
        );
      }

      // Check if jersey number is still available (if specified)
      if (invitation.jersey_number) {
        const { data: jerseyTaken } = await supabase
          .from('team_members')
          .select('id')
          .eq('team_id', invitation.team_id)
          .eq('jersey_number', invitation.jersey_number)
          .eq('is_active', true)
          .single();

        if (jerseyTaken) {
          return NextResponse.json(
            { error: 'Jersey taken', message: `Jersey number ${invitation.jersey_number} is no longer available` },
            { status: 400 }
          );
        }
      }

      // Start transaction: Update invitation and create team member
      const { error: transactionError } = await supabase.rpc('accept_team_invitation', {
        p_invitation_id: invitationId,
        p_user_id: user.id
      });

      if (transactionError) {
        // If the RPC doesn't exist, fall back to manual transaction
        console.log('RPC not found, using manual transaction');
        
        // Update invitation status
        const { error: invitationUpdateError } = await supabase
          .from('team_invitations')
          .update({
            status: 'accepted',
            responded_at: new Date().toISOString(),
            invited_user_id: user.id // Ensure user is linked
          })
          .eq('id', invitationId);

        if (invitationUpdateError) {
          console.error('Invitation update error:', invitationUpdateError);
          return NextResponse.json(
            { error: 'Update failed', message: 'Failed to accept invitation' },
            { status: 500 }
          );
        }

        // Create team member
        const { error: memberCreateError } = await supabase
          .from('team_members')
          .insert({
            team_id: invitation.team_id,
            user_id: user.id,
            position: invitation.position,
            jersey_number: invitation.jersey_number,
            is_active: true
          });

        if (memberCreateError) {
          console.error('Team member creation error:', memberCreateError);
          
          // Rollback invitation status
          await supabase
            .from('team_invitations')
            .update({ status: 'pending', responded_at: null })
            .eq('id', invitationId);

          return NextResponse.json(
            { error: 'Join failed', message: 'Failed to join team' },
            { status: 500 }
          );
        }
      }

      // Get updated team information
      const { data: team } = await supabase
        .from('teams')
        .select('name, location')
        .eq('id', invitation.team_id)
        .single();

      return NextResponse.json({
        message: 'Invitation accepted successfully',
        team: team
      });
    }

  } catch (error) {
    console.error('Error in POST /api/invitations/[invitationId]/respond:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
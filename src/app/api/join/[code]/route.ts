/**
 * Code-based Team Invitations API Route
 * 
 * GET /api/join/[code] - Get invitation details by invitation code
 * POST /api/join/[code] - Accept invitation by invitation code
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server-client';
import jwt from 'jsonwebtoken';

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    
    if (!code) {
      return NextResponse.json(
        { error: 'Invitation code is required' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();
    
    // Get invitation details by code
    const { data: invitation, error: invitationError } = await supabase
      .from('team_invitations')
      .select(`
        id,
        team_id,
        invited_by,
        invited_email,
        position,
        jersey_number,
        message,
        status,
        expires_at,
        created_at,
        team:teams!inner(
          id,
          name,
          team_color,
          team_bio,
          league_id,
          league:leagues(name)
        ),
        inviter:user_profiles!team_invitations_invited_by_fkey(
          id,
          display_name,
          full_name
        )
      `)
      .eq('invitation_code', code.toUpperCase())
      .single();

    if (invitationError || !invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    // Check if invitation is expired
    const isExpired = new Date(invitation.expires_at) < new Date();
    
    // Check if invitation is already accepted
    const isAccepted = invitation.status === 'accepted';

    // Get team member count
    const { count: memberCount } = await supabase
      .from('team_members')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', invitation.team_id)
      .eq('is_active', true);

    // Format response
    const responseData = {
      id: invitation.id,
      team: {
        id: invitation.team.id,
        name: invitation.team.name,
        color: invitation.team.team_color || '#3B82F6',
        description: invitation.team.team_bio || '',
        memberCount: memberCount || 0,
        league: invitation.team.league?.name || 'Independent'
      },
      invitation: {
        email: invitation.invited_email,
        position: invitation.position,
        jerseyNumber: invitation.jersey_number,
        message: invitation.message,
        status: invitation.status,
        expiresAt: invitation.expires_at,
        createdAt: invitation.created_at,
        isExpired,
        isAccepted
      },
      inviter: {
        id: invitation.inviter.id,
        name: invitation.inviter.display_name || invitation.inviter.full_name || 'Team Captain',
        email: invitation.invited_email // Will be replaced with actual inviter email if needed
      }
    };

    const response = NextResponse.json({
      data: responseData,
      message: 'Invitation details retrieved successfully'
    });
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  } catch (error) {
    console.error('Join invitation API error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve invitation' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    
    if (!code) {
      return NextResponse.json(
        { error: 'Invitation code is required' },
        { status: 400 }
      );
    }

    // Get user ID from JWT invitation_code
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const invitation_code = authHeader.replace('Bearer ', '');
    let userId: string;
    
    try {
      const jwtSecret = process.env.SUPABASE_JWT_SECRET || 'super-secret-jwt-invitation_code-with-at-least-32-characters-long';
      const decoded = jwt.verify(invitation_code, jwtSecret) as jwt.JwtPayload;
      userId = decoded.sub as string;
    } catch {
      return NextResponse.json(
        { error: 'Invalid invitation_code', message: 'JWT verification failed' },
        { status: 401 }
      );
    }

    const supabase = createServerSupabaseClient();
    
    // Get invitation details
    const { data: invitation, error: invitationError } = await supabase
      .from('team_invitations')
      .select(`
        id,
        team_id,
        invited_email,
        position,
        jersey_number,
        status,
        expires_at,
        team:teams!inner(
          id,
          name,
          max_players
        )
      `)
      .eq('invitation_code', code.toUpperCase())
      .eq('status', 'pending')
      .single();

    if (invitationError || !invitation) {
      return NextResponse.json(
        { error: 'Invitation not found or already processed' },
        { status: 404 }
      );
    }

    // Check if invitation is expired
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 400 }
      );
    }

    // Check if user is already a member of this team
    const { data: existingMember } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', invitation.team_id)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (existingMember) {
      return NextResponse.json(
        { error: 'You are already a member of this team' },
        { status: 400 }
      );
    }

    // Check team capacity
    const { count: currentMembers } = await supabase
      .from('team_members')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', invitation.team_id)
      .eq('is_active', true);

    if (currentMembers && invitation.team.max_players && currentMembers >= invitation.team.max_players) {
      return NextResponse.json(
        { error: 'Team is already at full capacity' },
        { status: 400 }
      );
    }

    // Add user to team
    const { error: memberError } = await supabase
      .from('team_members')
      .insert({
        team_id: invitation.team_id,
        user_id: userId,
        position: invitation.position || 'midfielder',
        jersey_number: invitation.jersey_number,
        is_active: true
      });

    if (memberError) {
      console.error('Error adding team member:', memberError);
      return NextResponse.json(
        { error: 'Failed to join team' },
        { status: 500 }
      );
    }

    // Update invitation status
    const { error: updateError } = await supabase
      .from('team_invitations')
      .update({
        status: 'accepted',
        updated_at: new Date().toISOString()
      })
      .eq('id', invitation.id);

    if (updateError) {
      console.error('Error updating invitation:', updateError);
      // Don't fail the request if invitation update fails
    }

    const response = NextResponse.json({
      message: `Welcome to ${invitation.team.name}! You have successfully joined the team.`,
      teamId: invitation.team_id,
      teamName: invitation.team.name
    });
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  } catch (error) {
    console.error('Join invitation acceptance error:', error);
    return NextResponse.json(
      { error: 'Failed to accept invitation' },
      { status: 500 }
    );
  }
}
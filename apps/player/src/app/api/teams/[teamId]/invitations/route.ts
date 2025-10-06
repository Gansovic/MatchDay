/**
 * Team Invitations API Route
 * 
 * POST /api/teams/[teamId]/invitations - Generate a new team invitation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SendInvitationForm } from '@matchday/database';
import { createUserSupabaseClient } from '@/lib/supabase/server-client';

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    
    if (!teamId) {
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      );
    }

    // Get authenticated user from Supabase client
    console.log('🔍 Team Invitations - Authenticating user');
    const supabaseUserClient = createUserSupabaseClient(request);
    const { data: { user }, error: userError } = await supabaseUserClient.auth.getUser();
    
    if (userError || !user) {
      console.log('❌ Team Invitations - Authentication failed:', userError?.message || 'No user found');
      return NextResponse.json(
        { error: 'Authentication required', message: 'Please log in to create team invitations' },
        { status: 401 }
      );
    }
    
    const userId = user.id;
    console.log('✅ Team Invitations - Authenticated user:', userId);

    // Parse request body
    const body: SendInvitationForm & { invitationType?: 'invited_email' | 'code' } = await request.json();
    
    const isEmailInvite = body.invitationType === 'email' || (body.email && body.email.trim());
    const isCodeInvite = body.invitationType === 'code' || (!body.email || !body.email.trim());
    
    // Validate required fields based on invitation type
    if (isEmailInvite && (!body.email || !body.email.trim())) {
      return NextResponse.json(
        { 
          error: 'Validation error',
          validationErrors: [{ field: 'invited_email', message: 'Email is required for invited_email invitations' }]
        },
        { status: 400 }
      );
    }

    // Validate invited_email format if invited_email is provided
    if (body.email) {
      const invited_emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!invited_emailRegex.test(body.email)) {
        return NextResponse.json(
          { 
            error: 'Validation error',
            validationErrors: [{ field: 'invited_email', message: 'Please enter a valid invited_email address' }]
          },
          { status: 400 }
        );
      }
    }

    // Validate jersey number if provided
    if (body.jersey_number !== undefined) {
      const jersey = Number(body.jersey_number);
      if (isNaN(jersey) || jersey < 1 || jersey > 99) {
        return NextResponse.json(
          { 
            error: 'Validation error',
            validationErrors: [{ field: 'jersey_number', message: 'Jersey number must be between 1 and 99' }]
          },
          { status: 400 }
        );
      }
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    try {
      // Check if user is captain of the team
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('captain_id')
        .eq('id', teamId)
        .single();

      if (teamError || !team) {
        return NextResponse.json(
          { error: 'Team not found' },
          { status: 404 }
        );
      }

      if (team.captain_id !== userId) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Only team captains can send invitations' },
          { status: 403 }
        );
      }

      // Check if user is already invited or a member (only for invited_email invitations)
      if (isEmailInvite && body.email) {
        // Check for existing team member
        const { data: existingMember } = await supabase
          .from('team_members')
          .select('id')
          .eq('team_id', teamId)
          .in('user_id', 
            supabase
              .from('users')
              .select('id')
              .eq('invited_email', body.email.trim().toLowerCase())
          )
          .eq('is_active', true)
          .limit(1);

        // Check for existing pending invitation
        const { data: existingInvitation } = await supabase
          .from('team_invitations')
          .select('id')
          .eq('team_id', teamId)
          .eq('invited_email', body.email.trim().toLowerCase())
          .eq('status', 'pending')
          .gt('expires_at', new Date().toISOString())
          .limit(1);

        if (existingMember?.length > 0 || existingInvitation?.length > 0) {
          return NextResponse.json(
            { 
              error: 'Validation error',
              validationErrors: [{ 
                field: 'invited_email', 
                message: 'This user is already a member or has a pending invitation' 
              }]
            },
            { status: 400 }
          );
        }
      }

      // Check if jersey number is already taken (if provided)
      if (body.jersey_number) {
        const { data: existingJersey } = await supabase
          .from('team_members')
          .select('id')
          .eq('team_id', teamId)
          .eq('jersey_number', body.jersey_number)
          .eq('is_active', true)
          .limit(1);

        if (existingJersey?.length > 0) {
          return NextResponse.json(
            { 
              error: 'Validation error',
              validationErrors: [{ 
                field: 'jersey_number', 
                message: 'This jersey number is already taken' 
              }]
            },
            { status: 400 }
          );
        }
      }

      // Generate invitation code for shareable invitations
      let invitationCode = null;
      if (isCodeInvite) {
        // Generate a 6-character code
        invitationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      }

      // Create invitation
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now
      
      
      const { data: invitation, error: invitationError } = await supabase
        .from('team_invitations')
        .insert({
          team_id: teamId,
          invited_by: userId,
          invited_email: body.email ? body.email.trim().toLowerCase() : null,
          invitation_code: invitationCode,
          position: body.position || null,
          jersey_number: body.jersey_number || null,
          message: body.message?.trim() || null,
          status: 'pending',
          expires_at: expiresAt.toISOString()
        })
        .select('id, invitation_code, expires_at')
        .single();
        
      if (invitationError || !invitation) {
        console.error('❌ Team Invitations - Database insertion error:', invitationError);
        throw new Error(`Failed to create invitation: ${invitationError?.message || 'Unknown error'}`);
      }

      // Get team information for the response
      const { data: teamData } = await supabase
        .from('teams')
        .select('name')
        .eq('id', teamId)
        .single();

      const teamName = teamData?.name || 'Team';

      // Generate invitation URL
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3002';
      let invitationUrl;
      let whatsappMessage;
      
      if (invitation.invitation_code) {
        // Code-based invitation
        invitationUrl = `${baseUrl}/join/${invitation.invitation_code}`;
        whatsappMessage = `🏆 Join my team "${teamName}" on MatchDay!\n\n⚽ Tap here to join: ${invitationUrl}\n\nMatchDay - Where teams are born! 🚀`;
      } else {
        // Token-based invitation (legacy support)
        invitationUrl = `${baseUrl}/invitations/${invitation.id}`;
        whatsappMessage = `Hi! You've been invited to join ${teamName} on MatchDay! Click the link to accept: ${invitationUrl}`;
      }
      
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

      const response = NextResponse.json({
        data: {
          id: invitation.id,
          code: invitation.invitation_code,
          invitationUrl,
          whatsappUrl,
          whatsappMessage,
          expiresAt: invitation.expires_at,
          teamName,
          invitationType: invitation.invitation_code ? 'code' : 'invited_email'
        },
        message: 'Invitation created successfully'
      });
      
      // Add CORS headers
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      return response;
    } catch (error) {
      console.error('Database operation error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Team invitations API error:', error);
    return NextResponse.json(
      { error: 'Failed to create invitation' },
      { status: 500 }
    );
  }
}
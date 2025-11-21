/**
 * Team Member Management API Route
 *
 * DELETE /api/teams/[teamId]/members/[memberId] - Remove a team member (captain only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { TeamService } from '@matchday/services';
import { createServerSupabaseClient, createUserSupabaseClient } from '@/lib/supabase/server-client';

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string; memberId: string }> }
) {
  try {
    const { teamId, memberId } = await params;

    console.log('🗑️ Remove Team Member - Request:', { teamId, memberId });

    // Validate params
    if (!teamId || !memberId) {
      return NextResponse.json(
        { error: 'Team ID and Member ID are required' },
        { status: 400 }
      );
    }

    // Get authenticated user
    console.log('🔍 Remove Team Member - Authenticating user');
    const supabaseUserClient = createUserSupabaseClient(request);
    const { data: { user }, error: userError } = await supabaseUserClient.auth.getUser();

    if (userError || !user) {
      console.log('❌ Remove Team Member - Authentication failed:', userError?.message || 'No user found');
      return NextResponse.json(
        { error: 'Authentication required', message: 'Please log in to manage team members' },
        { status: 401 }
      );
    }

    const captainId = user.id;
    console.log('✅ Remove Team Member - Authenticated captain:', captainId);

    // Parse optional removal reason from request body
    let removalReason: string | undefined;
    try {
      const body = await request.json();
      removalReason = body.reason;
    } catch {
      // No body provided, that's okay
    }

    // Use TeamService to remove the member
    console.log('🔍 Remove Team Member - Calling TeamService.removeTeamMember');
    const supabaseServerClient = await createServerSupabaseClient();
    const teamService = TeamService.getInstance(supabaseServerClient);
    const result = await teamService.removeTeamMember(
      teamId,
      memberId,
      captainId,
      removalReason
    );

    if (!result.success) {
      console.error('❌ Remove Team Member - TeamService error:', result.error);

      // Map error types to appropriate HTTP status codes
      const errorMessage = result.error?.message || 'Failed to remove team member';

      if (errorMessage.includes('not found') || errorMessage.includes('does not exist')) {
        return NextResponse.json(
          { error: 'Member or team not found', message: errorMessage },
          { status: 404 }
        );
      }

      if (errorMessage.includes('not the captain') || errorMessage.includes('not authorized')) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Only the team captain can remove members' },
          { status: 403 }
        );
      }

      if (errorMessage.includes('cannot remove yourself') || errorMessage.includes('last member')) {
        return NextResponse.json(
          { error: 'Invalid operation', message: errorMessage },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to remove team member', message: errorMessage },
        { status: 500 }
      );
    }

    console.log('✅ Remove Team Member - Successfully removed member:', memberId);

    const response = NextResponse.json({
      success: true,
      message: 'Team member removed successfully',
      data: result.data
    });

    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return response;
  } catch (error) {
    console.error('❌ Remove team member API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to remove team member',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

/**
 * Transfer Team Captain API Route
 *
 * POST /api/teams/[teamId]/transfer-captain - Transfer captaincy to another team member
 */

import { NextRequest, NextResponse } from 'next/server';
import { TeamService } from '@matchday/services';
import { createServerSupabaseClient, createUserSupabaseClient } from '@/lib/supabase/server-client';

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;

    console.log('👑 Transfer Captain - Request for team:', teamId);

    // Validate params
    if (!teamId) {
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      );
    }

    // Get authenticated user
    console.log('🔍 Transfer Captain - Authenticating user');
    const supabaseUserClient = createUserSupabaseClient(request);
    const { data: { user }, error: userError } = await supabaseUserClient.auth.getUser();

    if (userError || !user) {
      console.log('❌ Transfer Captain - Authentication failed:', userError?.message || 'No user found');
      return NextResponse.json(
        { error: 'Authentication required', message: 'Please log in to transfer captaincy' },
        { status: 401 }
      );
    }

    const currentCaptainId = user.id;
    console.log('✅ Transfer Captain - Authenticated current captain:', currentCaptainId);

    // Parse request body for new captain ID
    let newCaptainId: string;
    try {
      const body = await request.json();
      newCaptainId = body.newCaptainId;

      if (!newCaptainId) {
        return NextResponse.json(
          { error: 'New captain ID is required', message: 'Please provide newCaptainId in request body' },
          { status: 400 }
        );
      }

      if (newCaptainId === currentCaptainId) {
        return NextResponse.json(
          { error: 'Invalid operation', message: 'You are already the captain' },
          { status: 400 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid request body', message: 'Request body must contain newCaptainId' },
        { status: 400 }
      );
    }

    // Use TeamService to transfer captaincy
    console.log('🔍 Transfer Captain - Calling TeamService.transferCaptaincy');
    const supabaseServerClient = await createServerSupabaseClient();
    const teamService = TeamService.getInstance(supabaseServerClient);
    const result = await teamService.transferCaptaincy(
      teamId,
      currentCaptainId,
      newCaptainId
    );

    if (!result.success) {
      console.error('❌ Transfer Captain - TeamService error:', result.error);

      // Map error types to appropriate HTTP status codes
      const errorMessage = result.error?.message || 'Failed to transfer captaincy';

      if (errorMessage.includes('not found') || errorMessage.includes('does not exist')) {
        return NextResponse.json(
          { error: 'Team or member not found', message: errorMessage },
          { status: 404 }
        );
      }

      if (errorMessage.includes('not the captain') || errorMessage.includes('not authorized')) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Only the current captain can transfer captaincy' },
          { status: 403 }
        );
      }

      if (errorMessage.includes('not an active member') || errorMessage.includes('invalid member')) {
        return NextResponse.json(
          { error: 'Invalid member', message: 'New captain must be an active team member' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to transfer captaincy', message: errorMessage },
        { status: 500 }
      );
    }

    console.log('✅ Transfer Captain - Successfully transferred to:', newCaptainId);

    const response = NextResponse.json({
      success: true,
      message: 'Captaincy transferred successfully',
      data: result.data
    });

    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return response;
  } catch (error) {
    console.error('❌ Transfer captain API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to transfer captaincy',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

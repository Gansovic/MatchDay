/**
 * Team Details API Route
 * 
 * GET /api/teams/[teamId] - Get comprehensive team information including stats
 */

import { NextRequest, NextResponse } from 'next/server';
import { TeamService } from '@matchday/services';
import { createServerSupabaseClient, createUserSupabaseClient } from '@/lib/supabase/server-client';

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export async function GET(
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
    console.log('🔍 Team Details - Authenticating user');
    const supabaseUserClient = createUserSupabaseClient(request);
    const { data: { user }, error: userError } = await supabaseUserClient.auth.getUser();
    
    if (userError || !user) {
      console.log('❌ Team Details - Authentication failed:', userError?.message || 'No user found');
      return NextResponse.json(
        { error: 'Authentication required', message: 'Please log in to view team details' },
        { status: 401 }
      );
    }
    
    const userId = user.id;
    console.log('✅ Team Details - Authenticated user:', userId);

    // Use TeamService to get team details
    console.log('🔍 Team Details - Getting team details for:', teamId);
    const supabaseServerClient = await createServerSupabaseClient();
    const teamService = TeamService.getInstance(supabaseServerClient);
    const result = await teamService.getTeamDetails(teamId);
    
    if (!result.success || !result.data) {
      console.error('❌ Team Details - TeamService error:', result.error);
      
      if (result.error?.message?.includes('not found')) {
        return NextResponse.json(
          { error: 'Team not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch team details', message: result.error?.message || 'Team details unavailable' },
        { status: 500 }
      );
    }

    const team = result.data;
    console.log('✅ Team Details - Successfully got team data:', team.name);
    
    // Check if user is a member of this team
    const isMember = team.members.some(member => member.user_id === userId);
    const isUserCaptain = team.captain_id === userId;
    
    console.log('🔍 Team Details - User permissions:', {
      userId,
      isMember,
      isUserCaptain,
      teamCaptainId: team.captain_id
    });

    // Use TeamService data structure directly
    const teamData = {
      ...team,
      isMember,
      isUserCaptain,
      userPosition: isMember ? team.members.find(m => m.user_id === userId)?.position : null
    };
    
    console.log('🎯 Team Details - Returning response for team:', teamData.name);
    
    const response = NextResponse.json({
      data: teamData,
      message: 'Team details retrieved successfully'
    });
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  } catch (error: any) {
    console.error('❌ Team Details - Unexpected error:', error?.message || error);
    
    const response = NextResponse.json(
      { error: 'Failed to fetch team details', message: error?.message || 'An unexpected error occurred' },
      { status: 500 }
    );
    
    // Add CORS headers even for error responses
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return response;
  }
}

export async function PATCH(
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

    // Get authenticated user
    console.log('🔍 Team Update - Authenticating user');
    const supabaseUserClient = createUserSupabaseClient(request);
    const { data: { user }, error: userError } = await supabaseUserClient.auth.getUser();

    if (userError || !user) {
      console.log('❌ Team Update - Authentication failed:', userError?.message || 'No user found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = user.id;
    console.log('✅ Team Update - Authenticated user:', userId);

    // Parse request body
    const body = await request.json();
    console.log('🔍 Team Update - Update data:', body);
    console.log('🔍 Team Update - Logo fields:', {
      hasLogoUrl: !!body.logo_url,
      logoUrl: body.logo_url,
      hasLogoMediaId: !!body.logo_media_id,
      logoMediaId: body.logo_media_id
    });

    // Use TeamService to update team
    const supabaseServerClient = await createServerSupabaseClient();
    const teamService = TeamService.getInstance(supabaseServerClient);

    const result = await teamService.updateTeam(teamId, userId, body);

    if (!result.success || !result.data) {
      console.error('❌ Team Update - TeamService error:', result.error);

      if (result.error?.code === 'UNAUTHORIZED') {
        return NextResponse.json(
          { error: result.error.message },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: result.error?.message || 'Failed to update team' },
        { status: 500 }
      );
    }

    console.log('✅ Team Update - Successfully updated team:', result.data.name);

    const response = NextResponse.json({
      data: result.data,
      message: 'Team updated successfully'
    });

    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return response;
  } catch (error: any) {
    console.error('❌ Team Update - Unexpected error:', error?.message || error);

    const response = NextResponse.json(
      { error: 'Failed to update team', message: error?.message || 'An unexpected error occurred' },
      { status: 500 }
    );

    // Add CORS headers even for error responses
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return response;
  }
}
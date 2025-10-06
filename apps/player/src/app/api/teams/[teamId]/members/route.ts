/**
 * Team Members API Route
 * 
 * GET /api/teams/[teamId]/members - Get team members for a specific team
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
    console.log('🔍 Team Members - Authenticating user');
    const supabaseUserClient = createUserSupabaseClient(request);
    const { data: { user }, error: userError } = await supabaseUserClient.auth.getUser();
    
    if (userError || !user) {
      console.log('❌ Team Members - Authentication failed:', userError?.message || 'No user found');
      return NextResponse.json(
        { error: 'Authentication required', message: 'Please log in to view team members' },
        { status: 401 }
      );
    }
    
    const userId = user.id;
    console.log('✅ Team Members - Authenticated user:', userId);

    // Use TeamService to get team details with members
    console.log('🔍 Team Members - Getting team details for:', teamId);
    const supabaseServerClient = await createServerSupabaseClient();
    const teamService = TeamService.getInstance(supabaseServerClient);
    const result = await teamService.getTeamDetails(teamId);
    
    if (!result.success || !result.data) {
      console.error('❌ Team Members - TeamService error:', result.error);
      
      if (result.error?.message?.includes('not found')) {
        return NextResponse.json(
          { error: 'Team not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch team members', message: result.error?.message || 'Team members unavailable' },
        { status: 500 }
      );
    }

    const team = result.data;
    console.log('✅ Team Members - Successfully got team data:', team.name, 'with', team.members.length, 'members');

    const response = NextResponse.json({
      data: team.members,
      count: team.members.length,
      team: {
        id: team.id,
        name: team.name,
        captain_id: team.captain?.id
      }
    });
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  } catch (error) {
    console.error('Team members API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    );
  }
}
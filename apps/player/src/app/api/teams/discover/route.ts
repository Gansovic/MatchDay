/**
 * Discover Teams API Route
 * 
 * GET /api/teams/discover - Get all available teams that users can discover and join
 */

import { NextRequest, NextResponse } from 'next/server';
import { TeamService } from '@matchday/services';
import { createServerSupabaseClient } from '@/lib/supabase/server-client';
import { validateApiAuth } from '@/lib/auth/api-auth';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Discover teams API called');
    console.log('🔍 Request headers:', {
      authorization: request.headers.get('authorization')?.substring(0, 50) + '...',
      cookie: request.headers.get('cookie')?.substring(0, 100) + '...'
    });
    
    // Validate authentication
    const authResult = await validateApiAuth(request);
    if (!authResult.success) {
      console.log('❌ Discover teams - authentication failed:', authResult.error);
      return authResult.response!;
    }

    const { user } = authResult;
    console.log('✅ Authenticated user for discover teams API:', user.id);

    // Get search parameters
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const sport = searchParams.get('sport') || 'football';
    const location = searchParams.get('location');
    const hasAvailableSpots = searchParams.get('recruiting') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const teamService = TeamService.getInstance(await createServerSupabaseClient());

    // Get teams from both sources: league teams and orphaned teams
    const [leagueTeamsResult, orphanedTeamsResult] = await Promise.all([
      // Get teams in leagues (public and active)
      teamService.searchTeams({
        query,
        sport,
        location,
        hasAvailableSpots,
        limit: Math.ceil(limit / 2), // Split the limit between two sources
        offset: Math.floor(offset / 2)
      }),
      
      // Get orphaned teams (teams without leagues)
      teamService.getOrphanedTeams({
        includeArchived: false,
        limit: Math.ceil(limit / 2),
        offset: Math.floor(offset / 2)
      })
    ]);

    let allTeams: any[] = [];
    let totalCount = 0;

    // Add league teams if successful
    if (leagueTeamsResult.success && leagueTeamsResult.data) {
      allTeams = [...allTeams, ...leagueTeamsResult.data];
      totalCount += leagueTeamsResult.pagination?.total || 0;
    }

    // Add orphaned teams if successful
    if (orphanedTeamsResult.success && orphanedTeamsResult.data) {
      allTeams = [...allTeams, ...orphanedTeamsResult.data];
      totalCount += orphanedTeamsResult.pagination?.total || 0;
    }

    // Filter out teams where the user is already a member
    const filteredTeams = allTeams.filter(team => {
      // Check if user is already a member of this team
      return !team.members.some((member: any) => member.user_id === user.id);
    });

    // Apply search query filtering if not already done by the service
    let finalTeams = filteredTeams;
    if (query && query.trim()) {
      const searchQuery = query.toLowerCase().trim();
      finalTeams = filteredTeams.filter(team => 
        team.name.toLowerCase().includes(searchQuery) ||
        team.league?.name?.toLowerCase().includes(searchQuery) ||
        team.team_bio?.toLowerCase().includes(searchQuery)
      );
    }

    // Apply recruiting filter if not already done
    if (hasAvailableSpots) {
      finalTeams = finalTeams.filter(team => 
        team.is_recruiting && team.availableSpots > 0
      );
    }

    // Sort by creation date (newest first)
    finalTeams.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Apply pagination to final results
    const paginatedTeams = finalTeams.slice(offset, offset + limit);

    // Convert to API response format
    const responseTeams = paginatedTeams.map(team => ({
      id: team.id,
      name: team.name,
      league: team.league?.name || 'Independent',
      team_bio: team.team_bio || '',
      team_color: team.team_color || '#3B82F6',
      memberCount: team.memberCount || team.members?.length || 0,
      maxMembers: team.max_players || 22,
      isRecruiting: team.is_recruiting || false,
      location: team.league?.location || 'TBD',
      captain: team.captain?.display_name || team.captain?.full_name || 'Team Captain',
      availableSpots: team.availableSpots || 0,
      created_at: team.created_at,
      stats: team.stats || {
        wins: 0,
        draws: 0,
        losses: 0,
        goals_for: 0,
        goals_against: 0,
        points: 0
      }
    }));

    console.log(`✅ Discover teams - Found ${finalTeams.length} teams (${responseTeams.length} paginated)`);

    return NextResponse.json({
      data: responseTeams,
      pagination: {
        page: Math.floor(offset / limit) + 1,
        limit,
        total: finalTeams.length,
        totalPages: Math.ceil(finalTeams.length / limit),
        hasNext: offset + limit < finalTeams.length,
        hasPrevious: offset > 0
      }
    });

  } catch (error) {
    console.error('Discover teams API error:', error);
    return NextResponse.json(
      { error: 'Failed to discover teams', message: 'Could not retrieve available teams' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}
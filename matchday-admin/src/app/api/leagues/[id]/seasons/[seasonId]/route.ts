import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface RouteParams {
  params: Promise<{
    id: string;
    seasonId: string;
  }>;
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

/**
 * GET /api/leagues/[id]/seasons/[seasonId]
 * Get comprehensive details for a specific season including teams, join requests, and statistics
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: leagueId, seasonId } = await params;

    console.log(`[Admin Season Detail API] Fetching season ${seasonId} for league: ${leagueId}`);

    // Validate input parameters
    if (!leagueId || !seasonId) {
      return NextResponse.json(
        { success: false, error: 'League ID and Season ID are required' },
        { status: 400 }
      );
    }

    // Validate UUID format for both IDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(leagueId) || !uuidRegex.test(seasonId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    // Get season details with league context
    const { data: season, error: seasonError } = await supabase
      .from('seasons')
      .select(`
        *,
        league:leagues (
          id,
          name,
          description,
          sport_type,
          league_type,
          location
        )
      `)
      .eq('id', seasonId)
      .eq('league_id', leagueId)
      .single();

    if (seasonError) {
      if (seasonError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Season not found' },
          { status: 404 }
        );
      }
      console.error(`[Admin Season Detail API] Season query error:`, seasonError);
      return NextResponse.json(
        { success: false, error: 'Database error', details: seasonError.message },
        { status: 500 }
      );
    }

    // Get teams registered for this season
    let registeredTeams = [];
    try {
      const { data: seasonTeams, error: teamsError } = await supabase
        .from('season_teams')
        .select(`
          id,
          status,
          registered_at,
          team:teams (
            id,
            name,
            team_color,
            description,
            team_members (
              id,
              user_id,
              position,
              jersey_number,
              is_active,
              joined_at
            )
          )
        `)
        .eq('season_id', seasonId)
        .in('status', ['registered', 'confirmed', 'pending']);

      if (teamsError) {
        console.warn(`[Admin Season Detail API] Teams query warning:`, teamsError);
      } else {
        registeredTeams = (seasonTeams || []).map(st => ({
          ...st.team,
          registration_status: st.status,
          registered_at: st.registered_at,
          active_members: st.team?.team_members?.filter(m => m.is_active)?.length || 0,
          total_members: st.team?.team_members?.length || 0
        }));
      }
    } catch (error) {
      console.warn(`[Admin Season Detail API] Teams fetch failed:`, error);
    }

    // Get pending join requests for this season
    let pendingRequests = [];
    try {
      const { data: joinRequests, error: requestsError } = await supabase
        .from('season_join_requests')
        .select(`
          id,
          team_id,
          requested_by,
          request_message,
          status,
          created_at,
          team:teams (
            id,
            name,
            team_color,
            description
          ),
          requester:user_profiles (
            id,
            display_name
          )
        `)
        .eq('season_id', seasonId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (requestsError) {
        console.warn(`[Admin Season Detail API] Join requests query warning:`, requestsError);
      } else {
        pendingRequests = joinRequests || [];
      }
    } catch (error) {
      console.warn(`[Admin Season Detail API] Join requests fetch failed:`, error);
    }

    // Get season statistics
    const teamCount = registeredTeams.length;
    const totalPlayers = registeredTeams.reduce((sum, team) => sum + (team.active_members || 0), 0);
    const pendingRequestsCount = pendingRequests.length;

    // Calculate available spots
    const maxTeams = season.max_teams || 16;
    const availableSpots = Math.max(0, maxTeams - teamCount);

    // Get matches for this season (if matches table exists)
    let matches = [];
    let matchStats = { total: 0, completed: 0, upcoming: 0 };
    try {
      const { data: seasonMatches, error: matchesError } = await supabase
        .from('matches')
        .select(`
          id,
          home_team_id,
          away_team_id,
          match_date,
          status,
          home_score,
          away_score,
          home_team:teams!matches_home_team_id_fkey (
            id,
            name,
            team_color
          ),
          away_team:teams!matches_away_team_id_fkey (
            id,
            name,
            team_color
          )
        `)
        .eq('season_id', seasonId)
        .order('match_date', { ascending: true });

      if (matchesError) {
        console.warn(`[Admin Season Detail API] Matches query warning:`, matchesError);
      } else {
        matches = seasonMatches || [];
        matchStats = {
          total: matches.length,
          completed: matches.filter(m => m.status === 'completed').length,
          upcoming: matches.filter(m => m.status === 'scheduled' || m.status === 'pending').length
        };
      }
    } catch (error) {
      console.warn(`[Admin Season Detail API] Matches fetch failed:`, error);
    }

    const seasonDetails = {
      season: {
        ...season,
        league: season.league
      },
      teams: registeredTeams,
      pendingRequests,
      matches,
      statistics: {
        teamCount,
        totalPlayers,
        pendingRequestsCount,
        availableSpots,
        maxTeams,
        matchStats,
        registrationOpen: season.status === 'registration',
        seasonActive: season.status === 'active',
        averagePlayersPerTeam: teamCount > 0 ? Math.round(totalPlayers / teamCount * 10) / 10 : 0
      }
    };

    console.log(`[Admin Season Detail API] Successfully fetched season details:`, {
      seasonId,
      seasonName: season.display_name || season.name,
      teamCount,
      pendingRequestsCount,
      matchCount: matches.length
    });

    const jsonResponse = NextResponse.json({
      success: true,
      data: seasonDetails,
      message: 'Season details retrieved successfully'
    });

    // Add CORS headers
    jsonResponse.headers.set('Access-Control-Allow-Origin', '*');
    jsonResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    jsonResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return jsonResponse;

  } catch (error) {
    console.error(`[Admin Season Detail API] Exception:`, error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/leagues/[id]/seasons/[seasonId]
 * Update season details (admin only)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: leagueId, seasonId } = await params;
    const body = await request.json();

    // Validate input parameters
    if (!leagueId || !seasonId) {
      return NextResponse.json(
        { success: false, error: 'League ID and Season ID are required' },
        { status: 400 }
      );
    }

    const {
      name,
      description,
      start_date,
      end_date,
      registration_start,
      registration_end,
      max_teams,
      min_teams,
      status,
      format,
      rules,
      prize_structure,
      is_active
    } = body;

    // Prepare update object (only include defined values)
    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (start_date !== undefined) updateData.start_date = start_date;
    if (end_date !== undefined) updateData.end_date = end_date;
    if (registration_start !== undefined) updateData.registration_start = registration_start;
    if (registration_end !== undefined) updateData.registration_end = registration_end;
    if (max_teams !== undefined) updateData.max_teams = max_teams;
    if (min_teams !== undefined) updateData.min_teams = min_teams;
    if (status !== undefined) updateData.status = status;
    if (format !== undefined) updateData.format = format;
    if (rules !== undefined) updateData.rules = rules;
    if (prize_structure !== undefined) updateData.prize_structure = prize_structure;
    if (is_active !== undefined) updateData.is_active = is_active;

    updateData.updated_at = new Date().toISOString();

    const { data: updatedSeason, error } = await supabase
      .from('seasons')
      .update(updateData)
      .eq('id', seasonId)
      .eq('league_id', leagueId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Season not found' },
          { status: 404 }
        );
      }
      console.error(`[Admin Season Detail API] Update error:`, error);
      return NextResponse.json(
        { success: false, error: 'Database error', details: error.message },
        { status: 500 }
      );
    }

    const jsonResponse = NextResponse.json({
      success: true,
      data: updatedSeason,
      message: 'Season updated successfully'
    });

    // Add CORS headers
    jsonResponse.headers.set('Access-Control-Allow-Origin', '*');
    jsonResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    jsonResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return jsonResponse;

  } catch (error) {
    console.error(`[Admin Season Detail API] PUT Exception:`, error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
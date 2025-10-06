/**
 * Division Teams API Routes
 * 
 * Handles team management within divisions:
 * - GET /api/divisions/[divisionId]/teams - Get all teams in a division
 * - POST /api/divisions/[divisionId]/teams - Add existing team to division or create new team
 * - DELETE /api/divisions/[divisionId]/teams/[teamId] - Remove team from division
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server-client';

interface RouteParams {
  params: Promise<{ divisionId: string }>;
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

/**
 * GET /api/divisions/[divisionId]/teams
 * Get all teams in a specific division with detailed information
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { divisionId } = await params;
    const { searchParams } = new URL(request.url);
    const includeMembers = searchParams.get('includeMembers') === 'true';
    const includeStandings = searchParams.get('includeStandings') === 'true';
    const includeStats = searchParams.get('includeStats') === 'true';

    if (!divisionId) {
      return NextResponse.json(
        { success: false, error: 'Division ID is required' },
        { status: 400 }
      );
    }

    // Validate divisionId format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(divisionId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid division ID format' },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();

    // First verify the division exists
    const { data: division, error: divisionError } = await supabase
      .from('divisions')
      .select('id, name, league_id, max_teams, current_teams')
      .eq('id', divisionId)
      .single();

    if (divisionError) {
      if (divisionError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Division not found' },
          { status: 404 }
        );
      }
      throw divisionError;
    }

    // Get teams in the division
    let teamSelect = `
      id,
      name,
      captain_id,
      max_players,
      min_players,
      is_recruiting,
      is_active,
      team_bio,
      location,
      founded_year,
      created_at
    `;

    if (includeMembers) {
      teamSelect += `,
      team_members (
        id,
        user_id,
        position,
        jersey_number,
        joined_at,
        is_active,
        users (
          id,
          display_name,
          email,
          preferred_position
        )
      )`;
    } else {
      // Just get count of active members
      teamSelect += `,
      team_members!inner (
        id,
        is_active
      )`;
    }

    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select(teamSelect)
      .eq('division_id', divisionId)
      .eq('is_active', true)
      .order('name');

    if (teamsError) {
      console.error('Supabase error fetching teams:', teamsError);
      return NextResponse.json(
        { success: false, error: 'Database error', message: teamsError.message },
        { status: 500 }
      );
    }

    // Get division standings if requested
    let standingsMap = new Map();
    if (includeStandings) {
      const { data: standings } = await supabase
        .from('division_standings')
        .select('*')
        .eq('division_id', divisionId)
        .order('position');

      (standings || []).forEach(standing => {
        standingsMap.set(standing.team_id, standing);
      });
    }

    // Get team statistics if requested
    let teamStatsMap = new Map();
    if (includeStats) {
      const teamIds = teams?.map(team => team.id) || [];
      if (teamIds.length > 0) {
        // Get match statistics for teams
        const { data: matchStats } = await supabase
          .from('matches')
          .select(`
            id,
            status,
            home_team_id,
            away_team_id,
            home_score,
            away_score,
            match_date
          `)
          .eq('division_id', divisionId)
          .or(`home_team_id.in.(${teamIds.join(',')}),away_team_id.in.(${teamIds.join(',')})`)
          .eq('status', 'completed');

        // Calculate stats for each team
        teamIds.forEach(teamId => {
          const teamMatches = (matchStats || []).filter(match => 
            match.home_team_id === teamId || match.away_team_id === teamId
          );

          const stats = {
            matchesPlayed: teamMatches.length,
            wins: 0,
            draws: 0,
            losses: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            recentForm: [] // Last 5 matches
          };

          teamMatches.forEach(match => {
            const isHome = match.home_team_id === teamId;
            const teamScore = isHome ? match.home_score : match.away_score;
            const opponentScore = isHome ? match.away_score : match.home_score;

            stats.goalsFor += teamScore;
            stats.goalsAgainst += opponentScore;

            if (teamScore > opponentScore) {
              stats.wins++;
              stats.recentForm.push('W');
            } else if (teamScore === opponentScore) {
              stats.draws++;
              stats.recentForm.push('D');
            } else {
              stats.losses++;
              stats.recentForm.push('L');
            }
          });

          // Keep only last 5 results and reverse to show most recent first
          stats.recentForm = stats.recentForm.slice(-5).reverse();
          
          teamStatsMap.set(teamId, stats);
        });
      }
    }

    // Process teams data
    const processedTeams = (teams || []).map(team => {
      let processedTeam: any = {
        id: team.id,
        name: team.name,
        captain_id: team.captain_id,
        max_players: team.max_players,
        min_players: team.min_players,
        is_recruiting: team.is_recruiting,
        is_active: team.is_active,
        team_bio: team.team_bio,
        location: team.location,
        founded_year: team.founded_year,
        created_at: team.created_at
      };

      // Calculate member count
      if (includeMembers) {
        const activeMembers = team.team_members?.filter(member => member.is_active) || [];
        processedTeam.currentPlayers = activeMembers.length;
        processedTeam.availableSpots = Math.max(0, (team.max_players || 22) - activeMembers.length);
        processedTeam.members = activeMembers.map(member => ({
          id: member.id,
          user_id: member.user_id,
          position: member.position,
          jersey_number: member.jersey_number,
          joined_at: member.joined_at,
          player_name: member.users?.display_name,
          player_email: member.users?.email,
          preferred_position: member.users?.preferred_position
        }));
      } else {
        const activeMembers = team.team_members?.filter(member => member.is_active) || [];
        processedTeam.currentPlayers = activeMembers.length;
        processedTeam.availableSpots = Math.max(0, (team.max_players || 22) - activeMembers.length);
      }

      // Add standings information
      if (includeStandings && standingsMap.has(team.id)) {
        processedTeam.standings = standingsMap.get(team.id);
      }

      // Add statistics
      if (includeStats && teamStatsMap.has(team.id)) {
        processedTeam.statistics = teamStatsMap.get(team.id);
      }

      return processedTeam;
    });

    // Calculate division summary
    const totalPlayers = processedTeams.reduce((sum, team) => sum + team.currentPlayers, 0);
    const totalAvailableSpots = processedTeams.reduce((sum, team) => sum + team.availableSpots, 0);
    const recruitingTeams = processedTeams.filter(team => team.is_recruiting);

    const response = {
      division: {
        id: division.id,
        name: division.name,
        league_id: division.league_id,
        max_teams: division.max_teams,
        current_teams: division.current_teams,
        spots_remaining: Math.max(0, division.max_teams - division.current_teams)
      },
      teams: processedTeams,
      summary: {
        teamCount: processedTeams.length,
        totalPlayers,
        totalAvailableSpots,
        recruitingTeamsCount: recruitingTeams.length,
        averagePlayersPerTeam: processedTeams.length > 0 ? 
          Math.round(totalPlayers / processedTeams.length * 10) / 10 : 0,
        divisionCapacity: {
          used: processedTeams.length,
          total: division.max_teams,
          percentage: Math.round((processedTeams.length / division.max_teams) * 100)
        }
      }
    };

    const jsonResponse = NextResponse.json({
      success: true,
      data: response,
      message: `Retrieved ${processedTeams.length} team(s) from division "${division.name}"`
    });

    // Add CORS headers
    jsonResponse.headers.set('Access-Control-Allow-Origin', '*');
    jsonResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    jsonResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return jsonResponse;

  } catch (error) {
    console.error('Error in GET /api/divisions/[divisionId]/teams:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/divisions/[divisionId]/teams
 * Add existing team to division or create new team in division
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { divisionId } = await params;
    const body = await request.json();

    // Validate divisionId format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(divisionId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid division ID format' },
        { status: 400 }
      );
    }

    const {
      team_id, // For adding existing team
      // For creating new team
      name,
      captain_id,
      team_bio,
      location,
      max_players = 22,
      min_players = 11,
      is_recruiting = true
    } = body;

    const supabase = createAdminSupabaseClient();

    // Get division details and verify capacity
    const { data: division, error: divisionError } = await supabase
      .from('divisions')
      .select('id, name, league_id, max_teams, current_teams, registration_open')
      .eq('id', divisionId)
      .single();

    if (divisionError) {
      if (divisionError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Division not found' },
          { status: 404 }
        );
      }
      throw divisionError;
    }

    // Check if division is open for registration
    if (!division.registration_open) {
      return NextResponse.json(
        { success: false, error: 'Division registration is closed' },
        { status: 400 }
      );
    }

    // Check if division has capacity
    if (division.current_teams >= division.max_teams) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Division is at full capacity',
          message: `Division "${division.name}" already has ${division.current_teams}/${division.max_teams} teams` 
        },
        { status: 400 }
      );
    }

    if (team_id) {
      // Adding existing team to division
      
      // Verify team exists and is not already in a division
      const { data: existingTeam, error: teamError } = await supabase
        .from('teams')
        .select('id, name, division_id, league_id, is_active')
        .eq('id', team_id)
        .single();

      if (teamError) {
        if (teamError.code === 'PGRST116') {
          return NextResponse.json(
            { success: false, error: 'Team not found' },
            { status: 404 }
          );
        }
        throw teamError;
      }

      if (!existingTeam.is_active) {
        return NextResponse.json(
          { success: false, error: 'Cannot add inactive team to division' },
          { status: 400 }
        );
      }

      if (existingTeam.division_id) {
        return NextResponse.json(
          { success: false, error: 'Team is already assigned to a division' },
          { status: 400 }
        );
      }

      // Verify team belongs to the same league as the division
      if (existingTeam.league_id && existingTeam.league_id !== division.league_id) {
        return NextResponse.json(
          { success: false, error: 'Team must belong to the same league as the division' },
          { status: 400 }
        );
      }

      // Update team to add to division
      const { data: updatedTeam, error: updateError } = await supabase
        .from('teams')
        .update({ 
          division_id: divisionId,
          league_id: division.league_id // Ensure league_id is set
        })
        .eq('id', team_id)
        .select('*')
        .single();

      if (updateError) {
        console.error('Error updating team:', updateError);
        return NextResponse.json(
          { success: false, error: 'Database error', message: updateError.message },
          { status: 500 }
        );
      }

      // Initialize standings for the team
      await supabase
        .from('division_standings')
        .insert({
          division_id: divisionId,
          team_id: team_id
        });

      return NextResponse.json({
        success: true,
        data: updatedTeam,
        message: `Team "${existingTeam.name}" added to division "${division.name}"`
      });

    } else {
      // Creating new team in division
      
      if (!name || !captain_id) {
        return NextResponse.json(
          { success: false, error: 'Team name and captain_id are required for new team creation' },
          { status: 400 }
        );
      }

      // Validate captain exists
      const { data: captain, error: captainError } = await supabase
        .from('users')
        .select('id, display_name')
        .eq('id', captain_id)
        .single();

      if (captainError) {
        return NextResponse.json(
          { success: false, error: 'Captain not found' },
          { status: 404 }
        );
      }

      // Check if team name is unique in the division
      const { data: existingTeamName } = await supabase
        .from('teams')
        .select('id')
        .eq('name', name)
        .eq('division_id', divisionId)
        .single();

      if (existingTeamName) {
        return NextResponse.json(
          { success: false, error: 'Team name already exists in this division' },
          { status: 409 }
        );
      }

      // Create new team
      const { data: newTeam, error: createError } = await supabase
        .from('teams')
        .insert({
          name,
          captain_id,
          team_bio,
          location,
          max_players,
          min_players,
          is_recruiting,
          division_id: divisionId,
          league_id: division.league_id,
          is_active: true
        })
        .select('*')
        .single();

      if (createError) {
        console.error('Error creating team:', createError);
        return NextResponse.json(
          { success: false, error: 'Database error', message: createError.message },
          { status: 500 }
        );
      }

      // Add captain as team member
      await supabase
        .from('team_members')
        .insert({
          team_id: newTeam.id,
          user_id: captain_id,
          is_active: true
        });

      // Initialize standings for the new team
      await supabase
        .from('division_standings')
        .insert({
          division_id: divisionId,
          team_id: newTeam.id
        });

      return NextResponse.json({
        success: true,
        data: newTeam,
        message: `New team "${name}" created and added to division "${division.name}"`
      }, { status: 201 });
    }

  } catch (error) {
    console.error('Error in POST /api/divisions/[divisionId]/teams:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
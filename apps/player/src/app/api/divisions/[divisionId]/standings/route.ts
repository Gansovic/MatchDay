/**
 * Division Standings API Routes
 * 
 * Handles division standings management:
 * - GET /api/divisions/[divisionId]/standings - Get current standings
 * - PUT /api/divisions/[divisionId]/standings - Recalculate standings from matches
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server-client';

interface RouteParams {
  params: Promise<{ divisionId: string }>;
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

/**
 * GET /api/divisions/[divisionId]/standings
 * Get current division standings with optional team details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { divisionId } = await params;
    const { searchParams } = new URL(request.url);
    const includeTeamDetails = searchParams.get('includeTeamDetails') === 'true';
    const includeRecentForm = searchParams.get('includeRecentForm') === 'true';

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

    // Verify division exists
    const { data: division, error: divisionError } = await supabase
      .from('divisions')
      .select('id, name, league_id, current_teams')
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

    // Get standings with team information
    let standingsSelect = `
      *,
      team:teams!division_standings_team_id_fkey (
        id,
        name,
        captain_id
      )
    `;

    if (includeTeamDetails) {
      standingsSelect = `
        *,
        team:teams!division_standings_team_id_fkey (
          id,
          name,
          captain_id,
          team_bio,
          location,
          founded_year,
          team_members!inner (
            id,
            is_active
          )
        )
      `;
    }

    const { data: standings, error: standingsError } = await supabase
      .from('division_standings')
      .select(standingsSelect)
      .eq('division_id', divisionId)
      .order('position', { ascending: true, nullsLast: true })
      .order('points', { ascending: false })
      .order('goal_difference', { ascending: false })
      .order('goals_for', { ascending: false });

    if (standingsError) {
      console.error('Error fetching standings:', standingsError);
      return NextResponse.json(
        { success: false, error: 'Database error', message: standingsError.message },
        { status: 500 }
      );
    }

    // Get recent form if requested
    let recentFormMap = new Map();
    if (includeRecentForm && standings) {
      const teamIds = standings.map(s => s.team_id);
      
      if (teamIds.length > 0) {
        // Get last 5 matches for each team
        const { data: recentMatches } = await supabase
          .from('matches')
          .select('id, home_team_id, away_team_id, home_score, away_score, match_date, status')
          .eq('division_id', divisionId)
          .eq('status', 'completed')
          .or(`home_team_id.in.(${teamIds.join(',')}),away_team_id.in.(${teamIds.join(',')})`)
          .order('match_date', { ascending: false })
          .limit(teamIds.length * 10); // Get more matches to ensure we have enough for each team

        // Process recent form for each team
        teamIds.forEach(teamId => {
          const teamMatches = (recentMatches || [])
            .filter(match => match.home_team_id === teamId || match.away_team_id === teamId)
            .slice(0, 5) // Last 5 matches
            .reverse(); // Oldest to newest

          const form = teamMatches.map(match => {
            const isHome = match.home_team_id === teamId;
            const teamScore = isHome ? match.home_score : match.away_score;
            const opponentScore = isHome ? match.away_score : match.home_score;

            if (teamScore > opponentScore) return 'W';
            if (teamScore === opponentScore) return 'D';
            return 'L';
          });

          recentFormMap.set(teamId, form);
        });
      }
    }

    // Process standings
    const processedStandings = (standings || []).map((standing, index) => {
      let processedStanding = {
        position: standing.position || index + 1, // Auto-assign position if null
        team: {
          id: standing.team.id,
          name: standing.team.name,
          captain_id: standing.team.captain_id
        },
        points: standing.points,
        matches_played: standing.matches_played,
        wins: standing.wins,
        draws: standing.draws,
        losses: standing.losses,
        goals_for: standing.goals_for,
        goals_against: standing.goals_against,
        goal_difference: standing.goal_difference,
        last_updated: standing.last_updated,
        // Calculated stats
        points_per_game: standing.matches_played > 0 ? 
          Math.round((standing.points / standing.matches_played) * 100) / 100 : 0,
        win_percentage: standing.matches_played > 0 ? 
          Math.round((standing.wins / standing.matches_played) * 100) : 0,
        goals_per_game: standing.matches_played > 0 ?
          Math.round((standing.goals_for / standing.matches_played) * 100) / 100 : 0
      };

      // Add team details if requested
      if (includeTeamDetails) {
        processedStanding.team = {
          ...processedStanding.team,
          team_bio: standing.team.team_bio,
          location: standing.team.location,
          founded_year: standing.team.founded_year,
          current_players: standing.team.team_members?.filter(m => m.is_active).length || 0
        };
      }

      // Add recent form if requested
      if (includeRecentForm) {
        processedStanding.recent_form = recentFormMap.get(standing.team_id) || [];
      }

      return processedStanding;
    });

    // Calculate division statistics
    const totalMatches = processedStandings.reduce((sum, team) => sum + team.matches_played, 0);
    const totalGoals = processedStandings.reduce((sum, team) => sum + team.goals_for, 0);
    const averageGoalsPerMatch = totalMatches > 0 ? 
      Math.round((totalGoals / totalMatches) * 100) / 100 : 0;
    
    // Find leaders
    const topScorer = processedStandings.reduce((top, team) => 
      team.goals_for > (top?.goals_for || 0) ? team : top, null);
    
    const mostWins = processedStandings.reduce((top, team) => 
      team.wins > (top?.wins || 0) ? team : top, null);

    const response = {
      division: {
        id: division.id,
        name: division.name,
        league_id: division.league_id,
        current_teams: division.current_teams
      },
      standings: processedStandings,
      statistics: {
        total_teams: processedStandings.length,
        total_matches_played: Math.floor(totalMatches / 2), // Each match involves 2 teams
        total_goals: totalGoals,
        average_goals_per_match: averageGoalsPerMatch,
        leaders: {
          top_scorer: topScorer ? {
            team: topScorer.team.name,
            goals: topScorer.goals_for
          } : null,
          most_wins: mostWins ? {
            team: mostWins.team.name,
            wins: mostWins.wins
          } : null
        }
      }
    };

    const jsonResponse = NextResponse.json({
      success: true,
      data: response,
      message: `Retrieved standings for division "${division.name}"`
    });

    // Add CORS headers
    jsonResponse.headers.set('Access-Control-Allow-Origin', '*');
    jsonResponse.headers.set('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
    jsonResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return jsonResponse;

  } catch (error) {
    console.error('Error in GET /api/divisions/[divisionId]/standings:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/divisions/[divisionId]/standings
 * Recalculate standings from completed matches
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { divisionId } = await params;

    // Validate divisionId format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(divisionId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid division ID format' },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();

    // Verify division exists
    const { data: division, error: divisionError } = await supabase
      .from('divisions')
      .select('id, name')
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

    // Get all teams in the division
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id, name')
      .eq('division_id', divisionId)
      .eq('is_active', true);

    if (teamsError) {
      console.error('Error fetching teams:', teamsError);
      return NextResponse.json(
        { success: false, error: 'Database error', message: teamsError.message },
        { status: 500 }
      );
    }

    if (!teams || teams.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No active teams found in this division' },
        { status: 400 }
      );
    }

    // Get all completed matches for this division
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('id, home_team_id, away_team_id, home_score, away_score')
      .eq('division_id', divisionId)
      .eq('status', 'completed')
      .not('home_score', 'is', null)
      .not('away_score', 'is', null);

    if (matchesError) {
      console.error('Error fetching matches:', matchesError);
      return NextResponse.json(
        { success: false, error: 'Database error', message: matchesError.message },
        { status: 500 }
      );
    }

    // Calculate standings for each team
    const standingsData: Record<string, any> = {};
    
    // Initialize all teams with zero stats
    teams.forEach(team => {
      standingsData[team.id] = {
        team_id: team.id,
        points: 0,
        matches_played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goals_for: 0,
        goals_against: 0
      };
    });

    // Process matches to calculate statistics
    (matches || []).forEach(match => {
      const homeTeamId = match.home_team_id;
      const awayTeamId = match.away_team_id;
      const homeScore = match.home_score;
      const awayScore = match.away_score;

      // Skip if either team is not in our standings (shouldn't happen)
      if (!standingsData[homeTeamId] || !standingsData[awayTeamId]) {
        return;
      }

      // Update matches played
      standingsData[homeTeamId].matches_played++;
      standingsData[awayTeamId].matches_played++;

      // Update goals
      standingsData[homeTeamId].goals_for += homeScore;
      standingsData[homeTeamId].goals_against += awayScore;
      standingsData[awayTeamId].goals_for += awayScore;
      standingsData[awayTeamId].goals_against += homeScore;

      // Update wins, draws, losses and points
      if (homeScore > awayScore) {
        // Home win
        standingsData[homeTeamId].wins++;
        standingsData[homeTeamId].points += 3;
        standingsData[awayTeamId].losses++;
      } else if (homeScore < awayScore) {
        // Away win
        standingsData[awayTeamId].wins++;
        standingsData[awayTeamId].points += 3;
        standingsData[homeTeamId].losses++;
      } else {
        // Draw
        standingsData[homeTeamId].draws++;
        standingsData[homeTeamId].points += 1;
        standingsData[awayTeamId].draws++;
        standingsData[awayTeamId].points += 1;
      }
    });

    // Sort teams by points, goal difference, goals for
    const sortedStandings = Object.values(standingsData).sort((a: any, b: any) => {
      const aGoalDiff = a.goals_for - a.goals_against;
      const bGoalDiff = b.goals_for - b.goals_against;
      
      if (b.points !== a.points) return b.points - a.points;
      if (bGoalDiff !== aGoalDiff) return bGoalDiff - aGoalDiff;
      return b.goals_for - a.goals_for;
    });

    // Assign positions
    sortedStandings.forEach((team: any, index) => {
      team.position = index + 1;
    });

    // Update the database with new standings
    // First, delete existing standings
    await supabase
      .from('division_standings')
      .delete()
      .eq('division_id', divisionId);

    // Insert updated standings
    const standingsToInsert = sortedStandings.map((team: any) => ({
      division_id: divisionId,
      team_id: team.team_id,
      position: team.position,
      points: team.points,
      matches_played: team.matches_played,
      wins: team.wins,
      draws: team.draws,
      losses: team.losses,
      goals_for: team.goals_for,
      goals_against: team.goals_against,
      last_updated: new Date().toISOString()
    }));

    const { data: insertedStandings, error: insertError } = await supabase
      .from('division_standings')
      .insert(standingsToInsert)
      .select(`
        *,
        team:teams!division_standings_team_id_fkey (
          id,
          name
        )
      `);

    if (insertError) {
      console.error('Error inserting standings:', insertError);
      return NextResponse.json(
        { success: false, error: 'Database error', message: insertError.message },
        { status: 500 }
      );
    }

    // Calculate summary statistics
    const totalMatchesAnalyzed = matches?.length || 0;
    const totalGoals = sortedStandings.reduce((sum, team: any) => sum + team.goals_for, 0);
    
    const jsonResponse = NextResponse.json({
      success: true,
      data: {
        division: {
          id: division.id,
          name: division.name
        },
        standings: insertedStandings,
        calculation_summary: {
          teams_processed: teams.length,
          matches_analyzed: totalMatchesAnalyzed,
          total_goals: totalGoals,
          calculation_time: new Date().toISOString()
        }
      },
      message: `Standings recalculated for division "${division.name}" based on ${totalMatchesAnalyzed} completed matches`
    });

    // Add CORS headers
    jsonResponse.headers.set('Access-Control-Allow-Origin', '*');
    jsonResponse.headers.set('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
    jsonResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return jsonResponse;

  } catch (error) {
    console.error('Error in PUT /api/divisions/[divisionId]/standings:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
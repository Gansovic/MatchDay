/**
 * Season Standings API Route
 *
 * GET /api/seasons/[seasonId]/standings
 * Calculate and return league standings for a season based on match results
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server-client';

interface RouteParams {
  params: Promise<{ seasonId: string }>;
}

interface TeamStats {
  team_id: string;
  team_name: string;
  team_color?: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
  form: ('W' | 'D' | 'L')[];
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

/**
 * GET /api/seasons/[seasonId]/standings
 * Calculate standings from match results
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { seasonId } = await params;

    if (!seasonId) {
      return NextResponse.json(
        { success: false, error: 'Season ID is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();

    // Get all completed matches for the season with team info
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select(`
        id,
        home_team_id,
        away_team_id,
        home_score,
        away_score,
        status,
        match_date,
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
      .eq('status', 'completed')
      .order('match_date', { ascending: true });

    if (matchesError) {
      console.error('Error fetching matches:', matchesError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch matches' },
        { status: 500 }
      );
    }

    // Get all teams registered for the season
    const { data: seasonTeams, error: teamsError } = await supabase
      .from('season_teams')
      .select(`
        team_id,
        team:teams (
          id,
          name,
          team_color
        )
      `)
      .eq('season_id', seasonId)
      .in('status', ['registered', 'confirmed']);

    if (teamsError) {
      console.error('Error fetching teams:', teamsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch teams' },
        { status: 500 }
      );
    }

    // Initialize stats for all teams
    const teamStats: Map<string, TeamStats> = new Map();

    seasonTeams?.forEach((st: any) => {
      if (st.team) {
        teamStats.set(st.team_id, {
          team_id: st.team_id,
          team_name: st.team.name,
          team_color: st.team.team_color,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goals_for: 0,
          goals_against: 0,
          goal_difference: 0,
          points: 0,
          form: []
        });
      }
    });

    // Calculate stats from matches
    matches?.forEach((match: any) => {
      if (match.home_score == null || match.away_score == null) return;

      const homeStats = teamStats.get(match.home_team_id);
      const awayStats = teamStats.get(match.away_team_id);

      if (!homeStats || !awayStats) return;

      // Update played
      homeStats.played++;
      awayStats.played++;

      // Update goals
      homeStats.goals_for += match.home_score;
      homeStats.goals_against += match.away_score;
      awayStats.goals_for += match.away_score;
      awayStats.goals_against += match.home_score;

      // Determine result and update stats
      if (match.home_score > match.away_score) {
        // Home win
        homeStats.won++;
        homeStats.points += 3;
        homeStats.form.push('W');

        awayStats.lost++;
        awayStats.form.push('L');
      } else if (match.home_score < match.away_score) {
        // Away win
        awayStats.won++;
        awayStats.points += 3;
        awayStats.form.push('W');

        homeStats.lost++;
        homeStats.form.push('L');
      } else {
        // Draw
        homeStats.drawn++;
        homeStats.points += 1;
        homeStats.form.push('D');

        awayStats.drawn++;
        awayStats.points += 1;
        awayStats.form.push('D');
      }

      // Update goal difference
      homeStats.goal_difference = homeStats.goals_for - homeStats.goals_against;
      awayStats.goal_difference = awayStats.goals_for - awayStats.goals_against;
    });

    // Convert to array and sort by points, then goal difference, then goals for
    const standings = Array.from(teamStats.values())
      .sort((a, b) => {
        // Sort by points (descending)
        if (b.points !== a.points) return b.points - a.points;

        // If points equal, sort by goal difference (descending)
        if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference;

        // If goal difference equal, sort by goals for (descending)
        if (b.goals_for !== a.goals_for) return b.goals_for - a.goals_for;

        // If all equal, sort by team name alphabetically
        return a.team_name.localeCompare(b.team_name);
      })
      .map((team, index) => ({
        ...team,
        position: index + 1
      }));

    const jsonResponse = NextResponse.json({
      success: true,
      data: standings,
      message: 'Standings calculated successfully'
    });

    // Add CORS headers
    jsonResponse.headers.set('Access-Control-Allow-Origin', '*');
    jsonResponse.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    jsonResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return jsonResponse;

  } catch (error) {
    console.error('Error in GET /api/seasons/[seasonId]/standings:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

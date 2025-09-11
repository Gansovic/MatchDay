import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server-client';

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ leagueId: string; seasonId: string }> }
) {
  try {
    const { leagueId, seasonId } = await params;
    
    if (!leagueId || !seasonId) {
      return NextResponse.json(
        { 
          success: false,
          data: null,
          error: 'League ID and Season ID are required' 
        },
        { status: 400 }
      );
    }

    // Validate UUID formats
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(leagueId) || !uuidRegex.test(seasonId)) {
      return NextResponse.json(
        { 
          success: false,
          data: null,
          error: 'Invalid league ID or season ID format. Expected UUIDs.' 
        },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();
    
    try {
      // Verify season exists and belongs to league
      const { data: season, error: seasonError } = await supabase
        .from('seasons')
        .select('id')
        .eq('id', seasonId)
        .eq('league_id', leagueId)
        .single();

      if (seasonError || !season) {
        return NextResponse.json(
          { 
            success: false,
            data: null,
            error: 'Season not found or does not belong to the specified league' 
          },
          { status: 404 }
        );
      }

      // Get season statistics from matches table
      const { data: allMatches, error: matchesError } = await supabase
        .from('matches')
        .select('id, status, home_score, away_score')
        .eq('season_id', seasonId)
        .eq('league_id', leagueId);

      if (matchesError) throw new Error(`Season matches query failed: ${matchesError.message}`);

      // Calculate season statistics
      const totalMatches = allMatches?.length || 0;
      const completedMatches = allMatches?.filter(m => m.status === 'completed').length || 0;
      const totalGoals = allMatches
        ?.filter(m => m.status === 'completed')
        .reduce((sum, m) => sum + (m.home_score || 0) + (m.away_score || 0), 0) || 0;
      const avgGoalsPerMatch = completedMatches > 0 ? totalGoals / completedMatches : 0;

      // For now, return mock player stats data since player_stats table schema is not ready
      const topScorers = [
        { id: '1', name: 'Player One', team: 'adminTeam', team_color: '#3B82F6', value: 8, matches_played: 4, position: 'Forward' },
        { id: '2', name: 'Player Two', team: 'playerTeam', team_color: '#10B981', value: 6, matches_played: 5, position: 'Forward' },
        { id: '3', name: 'Player Three', team: 'two', team_color: '#F59E0B', value: 4, matches_played: 3, position: 'Midfielder' }
      ];

      const topAssists = [
        { id: '4', name: 'Player Four', team: 'botTeam', team_color: '#EF4444', value: 5, matches_played: 4, position: 'Midfielder' },
        { id: '5', name: 'Player Five', team: 'bot2Team', team_color: '#8B5CF6', value: 3, matches_played: 3, position: 'Midfielder' },
        { id: '6', name: 'Player Six', team: 'adminTeam', team_color: '#3B82F6', value: 2, matches_played: 4, position: 'Forward' }
      ];

      const cleanSheets = [
        { id: '7', name: 'Player Seven', team: 'playerTeam', team_color: '#10B981', value: 3, matches_played: 4, position: 'Goalkeeper' },
        { id: '8', name: 'Player Eight', team: 'two', team_color: '#F59E0B', value: 2, matches_played: 3, position: 'Goalkeeper' }
      ];

      const seasonStats = {
        total_matches: totalMatches,
        completed_matches: completedMatches,
        total_goals: totalGoals,
        total_players: 15, // Mock value
        avg_goals_per_match: avgGoalsPerMatch
      };

      const response = NextResponse.json({
        success: true,
        data: {
          topScorers,
          topAssists,
          cleanSheets,
          seasonStats: {
            total_matches: seasonStats.total_matches,
            completed_matches: seasonStats.completed_matches,
            total_goals: seasonStats.total_goals,
            total_players: seasonStats.total_players,
            avg_goals_per_match: Math.round(seasonStats.avg_goals_per_match * 100) / 100
          }
        },
        error: null
      });
      
      // Add CORS headers
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      return response;
  } catch (error) {
    console.error('Database query error:', error);
    return NextResponse.json(
      { 
        success: false,
        data: null,
        error: 'Failed to fetch player statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
  } catch (error) {
    console.error('API request error:', error);
    return NextResponse.json(
      { 
        success: false,
        data: null,
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
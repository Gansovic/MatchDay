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

      // Get top scorers using Supabase query
      const { data: topScorersData, error: topScorersError } = await supabase
        .from('player_stats')
        .select(`
          user_id,
          goals,
          match_id,
          team_id,
          users!inner(id, full_name),
          teams!inner(id, name, team_color),
          matches!inner(id, season_id, league_id)
        `)
        .eq('matches.season_id', seasonId)
        .eq('matches.league_id', leagueId)
        .gt('goals', 0);

      if (topScorersError) throw new Error(`Top scorers query failed: ${topScorersError.message}`);

      // Get top assists using Supabase query
      const { data: topAssistsData, error: topAssistsError } = await supabase
        .from('player_stats')
        .select(`
          user_id,
          assists,
          match_id,
          team_id,
          users!inner(id, full_name),
          teams!inner(id, name, team_color),
          matches!inner(id, season_id, league_id)
        `)
        .eq('matches.season_id', seasonId)
        .eq('matches.league_id', leagueId)
        .gt('assists', 0);

      if (topAssistsError) throw new Error(`Top assists query failed: ${topAssistsError.message}`);

      // Get clean sheets (goalkeepers) using Supabase query
      const { data: cleanSheetsData, error: cleanSheetsError } = await supabase
        .from('player_stats')
        .select(`
          user_id,
          clean_sheets,
          match_id,
          team_id,
          users!inner(id, full_name, position),
          teams!inner(id, name, team_color),
          matches!inner(id, season_id, league_id)
        `)
        .eq('matches.season_id', seasonId)
        .eq('matches.league_id', leagueId)
        .eq('users.position', 'goalkeeper')
        .gt('clean_sheets', 0);

      if (cleanSheetsError) throw new Error(`Clean sheets query failed: ${cleanSheetsError.message}`);

      // Process and aggregate the data
      const processPlayerStats = (data: any[], statField: string, defaultPosition: string) => {
        const playerMap = new Map();
        
        data?.forEach((stat: any) => {
          const playerId = stat.user_id;
          if (!playerMap.has(playerId)) {
            playerMap.set(playerId, {
              id: playerId,
              name: stat.users.full_name,
              team: stat.teams.name,
              team_color: stat.teams.team_color,
              value: 0,
              matches: new Set(),
              position: stat.users.position || defaultPosition
            });
          }
          
          const player = playerMap.get(playerId);
          player.value += stat[statField] || 0;
          player.matches.add(stat.match_id);
        });
        
        return Array.from(playerMap.values())
          .map(player => ({
            ...player,
            matches_played: player.matches.size
          }))
          .filter(player => player.value > 0)
          .sort((a, b) => b.value - a.value || a.matches_played - b.matches_played)
          .slice(0, 10);
      };

      const topScorers = processPlayerStats(topScorersData, 'goals', 'Forward');
      const topAssists = processPlayerStats(topAssistsData, 'assists', 'Midfielder');
      const cleanSheets = processPlayerStats(cleanSheetsData, 'clean_sheets', 'Goalkeeper');

      // Get overall season statistics using Supabase queries
      const { data: allMatches, error: matchesError } = await supabase
        .from('matches')
        .select('id, status, home_score, away_score')
        .eq('season_id', seasonId)
        .eq('league_id', leagueId);

      if (matchesError) throw new Error(`Season matches query failed: ${matchesError.message}`);

      const { data: allPlayerStats, error: playerStatsError } = await supabase
        .from('player_stats')
        .select('user_id, matches!inner(season_id, league_id)')
        .eq('matches.season_id', seasonId)
        .eq('matches.league_id', leagueId);

      if (playerStatsError) throw new Error(`Player stats query failed: ${playerStatsError.message}`);

      // Calculate season statistics
      const totalMatches = allMatches?.length || 0;
      const completedMatches = allMatches?.filter(m => m.status === 'completed').length || 0;
      const totalGoals = allMatches
        ?.filter(m => m.status === 'completed')
        .reduce((sum, m) => sum + (m.home_score || 0) + (m.away_score || 0), 0) || 0;
      const totalPlayers = new Set(allPlayerStats?.map(ps => ps.user_id)).size || 0;
      const avgGoalsPerMatch = completedMatches > 0 ? totalGoals / completedMatches : 0;

      const seasonStats = {
        total_matches: totalMatches,
        completed_matches: completedMatches,
        total_goals: totalGoals,
        total_players: totalPlayers,
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
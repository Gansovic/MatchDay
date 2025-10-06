import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server-client';
import { SampleDataGenerator } from '@/lib/utils/sample-data-generator';

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leagueId, overwrite = false } = body;
    
    if (!leagueId) {
      return NextResponse.json(
        { 
          success: false,
          data: null,
          error: 'League ID is required' 
        },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(leagueId)) {
      return NextResponse.json(
        { 
          success: false,
          data: null,
          error: 'Invalid league ID format. Expected UUID.' 
        },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();
    
    try {
      // Verify league exists
      const { data: league, error: leagueError } = await supabase
        .from('leagues')
        .select('id, name')
        .eq('id', leagueId)
        .single();

      if (leagueError || !league) {
        return NextResponse.json(
          { 
            success: false,
            data: null,
            error: 'League not found' 
          },
          { status: 404 }
        );
      }

      const leagueName = league.name;

      // Check if sample season already exists
      const existingSeasonCheck = await client.query(
        'SELECT id FROM seasons WHERE league_id = $1 AND name = $2',
        [leagueId, 'Sample Season 2024']
      );

      if (existingSeasonCheck.rows.length > 0 && !overwrite) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { 
            success: false,
            data: null,
            error: 'Sample season already exists. Use overwrite=true to replace it.' 
          },
          { status: 409 }
        );
      }

      // Generate sample data
      const sampleData = SampleDataGenerator.generateSampleSeason();

      // If overwriting, delete existing sample data
      if (overwrite && existingSeasonCheck.rows.length > 0) {
        const existingSeasonId = existingSeasonCheck.rows[0].id;
        
        // Delete in correct order due to foreign key constraints
        await client.query('DELETE FROM player_stats WHERE match_id IN (SELECT id FROM matches WHERE season_id = $1)', [existingSeasonId]);
        await client.query('DELETE FROM matches WHERE season_id = $1', [existingSeasonId]);
        await client.query('DELETE FROM season_teams WHERE season_id = $1', [existingSeasonId]);
        await client.query('DELETE FROM team_members WHERE team_id IN (SELECT id FROM teams WHERE league_id = $1 AND name LIKE \'%Sample%\')', [leagueId]);
        await client.query('DELETE FROM teams WHERE league_id = $1 AND name IN (\'Arsenal FC\', \'Chelsea FC\', \'Liverpool FC\', \'Manchester United\')', [leagueId]);
        await client.query('DELETE FROM seasons WHERE id = $1', [existingSeasonId]);
      }

      // Create season
      const seasonResult = await client.query(
        `INSERT INTO seasons (name, display_name, league_id, season_year, start_date, end_date, status, is_current, is_active, description, max_teams)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING id`,
        [
          sampleData.seasonInfo.name,
          sampleData.seasonInfo.display_name,
          leagueId,
          sampleData.seasonInfo.season_year,
          sampleData.seasonInfo.start_date,
          sampleData.seasonInfo.end_date,
          sampleData.seasonInfo.status,
          false, // is_current
          true,  // is_active
          `Demonstration season for ${leagueName} with 4 teams and complete match results`,
          4
        ]
      );
      
      const seasonId = seasonResult.rows[0].id;

      // Create teams
      const teamIds: { [key: string]: string } = {};
      
      for (const team of sampleData.teams) {
        const teamResult = await client.query(
          `INSERT INTO teams (name, league_id, team_color, max_players, min_players, is_recruiting, team_bio)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id`,
          [
            team.name,
            leagueId,
            team.team_color,
            22,
            11,
            false,
            `Sample team ${team.name} for demonstration purposes`
          ]
        );
        
        teamIds[team.id] = teamResult.rows[0].id;
        
        // Add team to season
        await client.query(
          `INSERT INTO season_teams (season_id, team_id, registration_date, is_active)
           VALUES ($1, $2, $3, $4)`,
          [seasonId, teamResult.rows[0].id, sampleData.seasonInfo.start_date, true]
        );
      }

      // Create sample users for players
      const playerIds: { [key: string]: string } = {};
      
      for (const player of sampleData.players) {
        // Create user profile
        const userResult = await client.query(
          `INSERT INTO users (email, full_name, position, role)
           VALUES ($1, $2, $3, $4)
           RETURNING id`,
          [
            `${player.name.toLowerCase().replace(/ /g, '.')}@sample.com`,
            player.name,
            player.position,
            'player'
          ]
        );
        
        playerIds[player.id] = userResult.rows[0].id;
        
        // Add to team
        await client.query(
          `INSERT INTO team_members (team_id, user_id, position, jersey_number, is_active)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            teamIds[player.team_id],
            userResult.rows[0].id,
            player.position,
            player.jersey_number,
            true
          ]
        );
      }

      // Create matches
      const matchIds: { [key: string]: string } = {};
      
      for (const match of sampleData.matches) {
        const matchResult = await client.query(
          `INSERT INTO matches (season_id, league_id, home_team_id, away_team_id, match_date, venue, status, home_score, away_score)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING id`,
          [
            seasonId,
            leagueId,
            teamIds[match.home_team_id],
            teamIds[match.away_team_id],
            match.match_date,
            match.venue,
            match.status,
            match.home_score,
            match.away_score
          ]
        );
        
        matchIds[match.id] = matchResult.rows[0].id;
      }

      // Create player statistics
      for (const stat of sampleData.playerStats) {
        await client.query(
          `INSERT INTO player_stats (user_id, team_id, match_id, goals, assists, yellow_cards, red_cards, minutes_played, clean_sheets)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            playerIds[stat.player_id],
            teamIds[sampleData.players.find(p => p.id === stat.player_id)?.team_id || ''],
            matchIds[stat.match_id],
            stat.goals,
            stat.assists,
            stat.yellow_cards,
            stat.red_cards,
            stat.minutes_played,
            stat.clean_sheets
          ]
        );
      }

      // Commit transaction
      await client.query('COMMIT');

      const response = NextResponse.json({
        success: true,
        data: {
          seasonId,
          leagueId,
          teamsCreated: sampleData.teams.length,
          matchesCreated: sampleData.matches.length,
          playersCreated: sampleData.players.length,
          statsRecordsCreated: sampleData.playerStats.length,
          seasonInfo: sampleData.seasonInfo
        },
        error: null,
        message: `Sample season created successfully for league: ${leagueName}`
      });
      
      // Add CORS headers
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      return response;
      
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database seeding error:', error);
    return NextResponse.json(
      { 
        success: false,
        data: null,
        error: 'Failed to create sample season',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
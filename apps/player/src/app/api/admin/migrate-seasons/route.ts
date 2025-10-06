import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server-client';

export async function POST() {
  try {
    const supabase = createAdminSupabaseClient();
    const results = [];
    
    console.log('Starting seasons migration via data insertion...');
    
    // First, let's create some sample data to insert into seasons table
    // This will create the table if it doesn't exist via RLS policies
    const myLeagueId = '261f251e-aee8-4153-a4c7-537b565e7e3f';
    
    // Try to insert a basic season record - this will fail if table doesn't exist
    // and show us what we need to do
    try {
      const { error: selectError } = await (supabase as any)
        .from('seasons')
        .select('id')
        .limit(1);
        
      if (selectError) {
        console.log('Seasons table does not exist yet. Need to create via SQL.');
        results.push({ step: 'check_table', status: 'table_missing', error: selectError });
        
        // Return instruction for user
        return NextResponse.json({
          success: false,
          message: 'The seasons table does not exist in your production database.',
          instruction: 'You need to run the SQL migration script in your Supabase SQL Editor.',
          sql_file: 'production_seasons_migration.sql',
          next_steps: [
            '1. Go to https://supabase.com/dashboard/project/twkipeacdamypppxmmhe',
            '2. Navigate to SQL Editor',
            '3. Copy and paste the contents of production_seasons_migration.sql',
            '4. Execute the script',
            '5. Then call this API again to seed the data'
          ]
        }, { status: 400 });
      } else {
        console.log('Seasons table already exists');
        results.push({ step: 'check_table', status: 'exists' });
      }
    } catch (error) {
      console.error('Error checking seasons table:', error);
      return NextResponse.json({
        success: false,
        error: 'Could not check if seasons table exists',
        details: error
      }, { status: 500 });
    }
    
    // If we get here, the table exists, so let's seed data
    const seasonsToInsert = [
      {
        name: '2024-2025',
        display_name: '2024/25 myLeague Season',
        league_id: myLeagueId,
        season_year: 2024,
        start_date: '2024-09-01',
        end_date: '2025-06-30',
        is_current: true,
        is_active: true,
        status: 'active',
        description: 'Current myLeague season featuring botTeam and bot2Team competing for the championship.',
        tournament_format: 'league',
        registration_deadline: '2024-08-20',
        match_frequency: 1,
        min_teams: 2,
        max_teams: 10,
        points_for_win: 3,
        points_for_draw: 1,
        points_for_loss: 0,
        allow_draws: true,
        home_away_balance: true,
        fixtures_status: 'pending',
        rules: {},
        settings: {},
        metadata: {}
      },
      {
        name: '2023-2024',
        display_name: '2023/24 myLeague Season',
        league_id: myLeagueId,
        season_year: 2023,
        start_date: '2023-09-01',
        end_date: '2024-06-30',
        is_current: false,
        is_active: false,
        status: 'completed',
        description: 'Previous myLeague season - completed championship.',
        tournament_format: 'league',
        registration_deadline: '2023-08-20',
        match_frequency: 1,
        min_teams: 2,
        max_teams: 10,
        points_for_win: 3,
        points_for_draw: 1,
        points_for_loss: 0,
        allow_draws: true,
        home_away_balance: true,
        fixtures_status: 'completed',
        rules: {},
        settings: {},
        metadata: {}
      },
      {
        name: '2025-2026',
        display_name: '2025/26 myLeague Season (Draft)',
        league_id: myLeagueId,
        season_year: 2025,
        start_date: '2025-09-01',
        end_date: '2026-06-30',
        is_current: false,
        is_active: true,
        status: 'draft',
        description: 'Upcoming myLeague season - registration opens soon!',
        tournament_format: 'league',
        registration_deadline: '2025-08-20',
        match_frequency: 1,
        min_teams: 2,
        max_teams: 10,
        points_for_win: 3,
        points_for_draw: 1,
        points_for_loss: 0,
        allow_draws: true,
        home_away_balance: true,
        fixtures_status: 'pending',
        rules: {},
        settings: {},
        metadata: {}
      }
    ];
    
    // Insert seasons - use any type because seasons table may not exist in types yet
    const { data: insertedSeasons, error: insertError } = await (supabase as any)
      .from('seasons')
      .upsert(seasonsToInsert, { onConflict: 'name,league_id' })
      .select();
      
    if (insertError) {
      console.error('Insert seasons error:', insertError);
      return NextResponse.json({
        success: false,
        error: insertError,
        step: 'insert_seasons'
      }, { status: 500 });
    }
    
    results.push({ step: 'insert_seasons', status: 'success', count: insertedSeasons?.length });
    
    // Get current season for team registration
    const currentSeason = insertedSeasons?.find((s: any) => s.is_current);
    if (currentSeason) {
      // Register teams for current season (if season_teams table exists)
      const teamIds = [
        'a4f112f8-6bad-421f-8b50-77e4d4b7e81e', // botTeam
        'f9142db6-e738-4f9c-91ca-d7786c904283'  // bot2Team
      ];
      
      try {
        const seasonTeamsToInsert = teamIds.map(teamId => ({
          season_id: currentSeason.id,
          team_id: teamId,
          status: 'confirmed',
          registration_date: new Date().toISOString()
        }));
        
        const { error: teamRegError } = await (supabase as any)
          .from('season_teams')
          .upsert(seasonTeamsToInsert, { onConflict: 'season_id,team_id' });
          
        if (teamRegError) {
          console.error('Team registration error:', teamRegError);
          results.push({ step: 'register_teams', status: 'error', error: teamRegError });
        } else {
          results.push({ step: 'register_teams', status: 'success', count: teamIds.length });
        }
      } catch {
        results.push({ step: 'register_teams', status: 'skipped', reason: 'season_teams table might not exist' });
      }
    }
    
    console.log('Seasons data seeded successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Seasons data seeded successfully',
      seasons_created: insertedSeasons?.length || 0,
      results
    });
    
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
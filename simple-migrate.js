/**
 * Simple automated migration - insert seasons directly via Supabase client
 * This bypasses the need for raw SQL execution
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create admin client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const myLeagueId = '261f251e-aee8-4153-a4c7-537b565e7e3f';
const botTeamId = 'a4f112f8-6bad-421f-8b50-77e4d4b7e81e';
const bot2TeamId = 'f9142db6-e738-4f9c-91ca-d7786c904283';

console.log('🎯 Attempting direct seasons creation...');

// Try to create seasons directly
const seasons = [
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
    description: 'Current myLeague season featuring botTeam and bot2Team.',
    max_teams: 10,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Test if we can insert into seasons (this will tell us if table exists)
supabase
  .from('seasons')
  .insert(seasons)
  .select()
  .then(({ data, error }) => {
    if (error) {
      console.log('❌ Error (expected if table doesn\'t exist):', error.message);
      console.log('\n📋 MANUAL MIGRATION REQUIRED:');
      console.log('================================');
      console.log('Since I cannot create tables programmatically, you need to:');
      console.log('');
      console.log('1. 📂 Open: production_seasons_migration.sql');
      console.log('2. 📋 Copy the entire file contents');
      console.log('3. 🌐 Go to: https://supabase.com/dashboard/project/twkipeacdamypppxmmhe');
      console.log('4. 🔧 Navigate to: SQL Editor');
      console.log('5. 📝 Paste and execute the migration');
      console.log('6. ✅ Then run: node simple-migrate.js again');
      console.log('');
      console.log('This will create all the necessary tables and seed your data.');
    } else {
      console.log('✅ Success! Seasons created:', data.length);
      
      // Register teams for the season
      const seasonId = data[0].id;
      const teamRegs = [
        { season_id: seasonId, team_id: botTeamId, status: 'confirmed' },
        { season_id: seasonId, team_id: bot2TeamId, status: 'confirmed' }
      ];
      
      return supabase
        .from('season_teams')
        .insert(teamRegs)
        .then(({ error: teamError }) => {
          if (teamError) {
            console.log('⚠️ Could not register teams (season_teams table may not exist)');
          } else {
            console.log('✅ Teams registered for season');
          }
          
          console.log('\n🎉 Migration completed!');
          console.log('Check your Supabase dashboard - seasons should now be visible.');
        });
    }
  })
  .catch(console.error);
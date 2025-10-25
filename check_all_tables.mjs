import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve('apps/admin/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔍 Checking all tables with player/team/member in name...\n');

// List of possible table names
const tablesToCheck = [
  'team_members',
  'team_member',
  'player_teams',
  'player_team',
  'players_teams',
  'season_players',
  'season_team_players',
  'team_rosters',
  'roster',
  'squad',
  'team_squad'
];

for (const tableName of tablesToCheck) {
  try {
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (!error) {
      console.log(`✅ ${tableName}: ${count || 0} rows`);
    }
  } catch (e) {
    // Table doesn't exist
  }
}

// Also check what columns exist in teams table
console.log('\n📋 Teams table columns:');
const { data: sampleTeam } = await supabase
  .from('teams')
  .select('*')
  .limit(1)
  .single();

if (sampleTeam) {
  console.log('  Columns:', Object.keys(sampleTeam).join(', '));
}

// Check if there's a player_id or similar in teams
console.log('\n🔍 Sample team data:');
const { data: teams } = await supabase
  .from('teams')
  .select('*')
  .limit(3);

teams?.forEach(team => {
  console.log(`\n  Team: ${team.name} (${team.id})`);
  console.log(`    League ID: ${team.league_id}`);
  console.log(`    Captain ID: ${team.captain_id}`);
  console.log(`    Max Players: ${team.max_players}`);
});

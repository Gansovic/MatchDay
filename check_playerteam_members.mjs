import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve('apps/admin/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const playerTeamId = '39a9f0fb-517b-4f34-934e-9a280d206989';

console.log('🔍 Checking playerTeam members...\n');

// Get all team_members
const { data: allMembers } = await supabase
  .from('team_members')
  .select('*');

console.log(`📊 Total team_members in database: ${allMembers?.length || 0}\n`);

// Group by team
const byTeam = {};
allMembers?.forEach(member => {
  if (!byTeam[member.team_id]) {
    byTeam[member.team_id] = [];
  }
  byTeam[member.team_id].push(member);
});

console.log('📋 Team members grouped by team:\n');
Object.entries(byTeam).forEach(([teamId, members]) => {
  console.log(`  Team ID: ${teamId}`);
  console.log(`    Members: ${members.length}`);
  console.log(`    Sample:`, members[0]);
  console.log();
});

// Check playerTeam specifically
console.log('\n👥 PlayerTeam members:');
const { data: playerTeamMembers, error } = await supabase
  .from('team_members')
  .select('*')
  .eq('team_id', playerTeamId);

console.log('  Query result:', { count: playerTeamMembers?.length, error });
if (playerTeamMembers) {
  playerTeamMembers.forEach(m => console.log('  Member:', m));
}

// Check with the exact query from MatchService
console.log('\n🔍 Testing MatchService query structure:');
const { data: testQuery, error: testError } = await supabase
  .from('team_members')
  .select(`
    id,
    player_id,
    user_profile:user_profiles(id, full_name, display_name, avatar_url)
  `)
  .eq('team_id', playerTeamId)
  .eq('status', 'active');

console.log('  Result:', { count: testQuery?.length, error: testError });
if (testQuery) {
  testQuery.forEach(m => console.log('  Member:', m));
}

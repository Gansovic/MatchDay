import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve('apps/admin/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔍 Finding teams with members...\n');

// Get all team members with team info
const { data: members } = await supabase
  .from('team_members')
  .select(`
    *,
    team:teams(id, name, league_id),
    user_profile:user_profiles(id, full_name, display_name, email)
  `);

console.log(`📊 Total team members: ${members?.length || 0}\n`);

// Group by team
const teamMap = {};
members?.forEach(member => {
  const teamId = member.team?.id;
  if (!teamMap[teamId]) {
    teamMap[teamId] = {
      name: member.team?.name,
      league_id: member.team?.league_id,
      members: []
    };
  }
  teamMap[teamId].members.push({
    player: member.user_profile?.full_name || member.user_profile?.email,
    status: member.status
  });
});

console.log('👥 Teams with members:\n');
Object.entries(teamMap).forEach(([teamId, team]) => {
  console.log(`  ${team.name} (${teamId})`);
  console.log(`    League: ${team.league_id}`);
  console.log(`    Members: ${team.members.length}`);
  team.members.forEach(m => {
    console.log(`      - ${m.player} (${m.status})`);
  });
  console.log();
});

// Now check matches for the season
const { data: seasons } = await supabase
  .from('seasons')
  .select('id, name, league_id');

console.log('\n🏆 Checking seasons...\n');
for (const season of seasons || []) {
  console.log(`Season: ${season.name} (${season.id})`);
  console.log(`  League: ${season.league_id}`);

  const { data: matches } = await supabase
    .from('matches')
    .select('id, home_team_id, away_team_id')
    .eq('season_id', season.id);

  console.log(`  Matches: ${matches?.length || 0}`);

  if (matches && matches.length > 0) {
    const match = matches[0];
    console.log(`  Sample match teams:`);
    console.log(`    Home: ${match.home_team_id}`);
    console.log(`    Away: ${match.away_team_id}`);
  }
  console.log();
}

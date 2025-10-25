import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve('apps/admin/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Get a fixture ID from the console log
console.log('🔍 Checking team members and match data...\n');

// First, let's get any match
const { data: matches } = await supabase
  .from('matches')
  .select('*')
  .limit(5);

console.log('📋 Sample matches:', matches?.length || 0);
if (matches && matches[0]) {
  const match = matches[0];
  console.log('\n🎮 Match Details:');
  console.log('  ID:', match.id);
  console.log('  Home Team ID:', match.home_team_id);
  console.log('  Away Team ID:', match.away_team_id);
  console.log('  Status:', match.status);

  // Check team_members for home team
  const { data: homeMembers } = await supabase
    .from('team_members')
    .select('*')
    .eq('team_id', match.home_team_id);

  console.log('\n👥 Home Team Members:', homeMembers?.length || 0);
  if (homeMembers && homeMembers.length > 0) {
    console.log('  Sample member:', homeMembers[0]);
  }

  // Check team_members for away team
  const { data: awayMembers } = await supabase
    .from('team_members')
    .select('*')
    .eq('team_id', match.away_team_id);

  console.log('\n👥 Away Team Members:', awayMembers?.length || 0);
  if (awayMembers && awayMembers.length > 0) {
    console.log('  Sample member:', awayMembers[0]);
  }

  // Check if teams exist
  const { data: homeTeam } = await supabase
    .from('teams')
    .select('*')
    .eq('id', match.home_team_id)
    .single();

  console.log('\n🏠 Home Team:', homeTeam?.name);

  const { data: awayTeam } = await supabase
    .from('teams')
    .select('*')
    .eq('id', match.away_team_id)
    .single();

  console.log('✈️  Away Team:', awayTeam?.name);

  // Check all team_members
  const { data: allMembers } = await supabase
    .from('team_members')
    .select('*');

  console.log('\n📊 Total team_members in database:', allMembers?.length || 0);
}

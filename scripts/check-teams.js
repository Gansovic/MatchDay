#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTeams() {
  console.log('🔍 Checking all teams in database...');
  
  // Get all teams
  const { data: allTeams, error: allError } = await supabase
    .from('teams')
    .select('id, name')
    .order('name');
    
  if (allError) {
    console.error('Error fetching all teams:', allError);
    return;
  }
  
  console.log('\n📋 All teams in database:');
  allTeams.forEach(team => {
    console.log(`   • ${team.name} (${team.id})`);
  });
  
  // Check specific team IDs from environment
  const TEAM_IDS = [
    process.env.PLAYER_TEAM_ID,
    process.env.ADMIN_TEAM_ID,
    process.env.BOT_TEAM_ID,
    process.env.BOT2_TEAM_ID
  ];
  
  console.log('\n🎯 Environment team IDs:');
  TEAM_IDS.forEach((id, index) => {
    const teamNames = ['PLAYER_TEAM_ID', 'ADMIN_TEAM_ID', 'BOT_TEAM_ID', 'BOT2_TEAM_ID'];
    console.log(`   • ${teamNames[index]}: ${id}`);
  });
  
  const { data: envTeams, error: envError } = await supabase
    .from('teams')
    .select('id, name')
    .in('id', TEAM_IDS.filter(id => id)); // Filter out undefined IDs
    
  if (envError) {
    console.error('Error fetching env teams:', envError);
    return;
  }
  
  console.log('\n✅ Teams found from environment IDs:');
  envTeams.forEach(team => {
    console.log(`   • ${team.name} (${team.id})`);
  });
  
  console.log('\n❌ Missing teams:');
  const foundIds = envTeams.map(t => t.id);
  TEAM_IDS.forEach((id, index) => {
    const teamNames = ['PLAYER_TEAM_ID', 'ADMIN_TEAM_ID', 'BOT_TEAM_ID', 'BOT2_TEAM_ID'];
    if (id && !foundIds.includes(id)) {
      console.log(`   • ${teamNames[index]}: ${id}`);
    }
  });
}

checkTeams();
#!/usr/bin/env node

/**
 * Script to fix double round-robin tournament by removing duplicate fixtures
 * Converts from 20-match double round-robin to 10-match single round-robin
 * Removes matches where home_team_name > away_team_name alphabetically
 */

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

const LEAGUE_ID = '261f251e-aee8-4153-a4c7-537b565e7e3f';
const SEASON_ID = '58effe43-682c-480f-8ddc-62e03e9d70e6';

async function getCurrentMatches() {
  console.log('🔍 Fetching current matches...');
  
  const { data: matches, error } = await supabase
    .from('matches')
    .select(`
      id,
      home_team_id,
      away_team_id,
      home_score,
      away_score,
      home_team:teams!matches_home_team_id_fkey(name),
      away_team:teams!matches_away_team_id_fkey(name)
    `)
    .eq('season_id', SEASON_ID);
    
  if (error) {
    console.error('Error fetching matches:', error);
    return [];
  }
  
  console.log(`✅ Found ${matches.length} total matches`);
  return matches;
}

async function identifyDuplicateMatches(matches) {
  console.log('🔍 Identifying duplicate matches...');
  
  // Find matches where home_team_name > away_team_name alphabetically
  const duplicateMatches = matches.filter(match => {
    const homeTeamName = match.home_team?.name || '';
    const awayTeamName = match.away_team?.name || '';
    return homeTeamName > awayTeamName;
  });
  
  console.log(`📊 Duplicate matches to remove: ${duplicateMatches.length}`);
  duplicateMatches.forEach(match => {
    console.log(`   • ${match.id}: ${match.home_team?.name} vs ${match.away_team?.name}`);
  });
  
  return duplicateMatches;
}

async function removeDuplicateMatches(duplicateMatches) {
  console.log('🗑️ Removing duplicate matches...');
  
  const matchIds = duplicateMatches.map(match => match.id);
  
  const { error } = await supabase
    .from('matches')
    .delete()
    .in('id', matchIds);
    
  if (error) {
    console.error('Error removing matches:', error);
    throw error;
  }
  
  console.log(`✅ Successfully removed ${matchIds.length} duplicate matches`);
  return matchIds.length;
}

async function verifyCorrection() {
  console.log('✅ Verifying correction...');
  
  // Get remaining matches
  const { data: remainingMatches, error } = await supabase
    .from('matches')
    .select(`
      id,
      home_team:teams!matches_home_team_id_fkey(name),
      away_team:teams!matches_away_team_id_fkey(name)
    `)
    .eq('season_id', SEASON_ID);
    
  if (error) {
    console.error('Error verifying matches:', error);
    return false;
  }
  
  console.log(`📊 Total matches after fix: ${remainingMatches.length}`);
  
  // Count matches per team
  const teamMatchCounts = {};
  remainingMatches.forEach(match => {
    const homeTeam = match.home_team?.name;
    const awayTeam = match.away_team?.name;
    
    teamMatchCounts[homeTeam] = (teamMatchCounts[homeTeam] || 0) + 1;
    teamMatchCounts[awayTeam] = (teamMatchCounts[awayTeam] || 0) + 1;
  });
  
  console.log('📊 Matches per team:');
  Object.entries(teamMatchCounts).forEach(([team, count]) => {
    console.log(`   • ${team}: ${count} matches`);
  });
  
  // Verify each team has exactly 4 matches
  const expectedMatchesPerTeam = 4;
  const allTeamsCorrect = Object.values(teamMatchCounts).every(count => count === expectedMatchesPerTeam);
  
  if (allTeamsCorrect) {
    console.log('✅ Perfect! Each team plays exactly 4 matches (single round-robin)');
  } else {
    console.log('❌ ERROR: Teams have unequal match counts');
  }
  
  return allTeamsCorrect;
}

async function fixDoubleRoundRobin() {
  try {
    console.log('🚀 Starting double round-robin fix...');
    console.log('📝 Converting 20-match double round-robin to 10-match single round-robin');
    
    // Get current matches
    const matches = await getCurrentMatches();
    if (matches.length === 0) {
      console.log('❌ No matches found');
      return;
    }
    
    // Identify duplicates
    const duplicateMatches = await identifyDuplicateMatches(matches);
    if (duplicateMatches.length === 0) {
      console.log('✅ No duplicate matches found - tournament is already single round-robin');
      return;
    }
    
    // Remove duplicates
    const removedCount = await removeDuplicateMatches(duplicateMatches);
    
    // Verify correction
    const isCorrect = await verifyCorrection();
    
    if (isCorrect) {
      console.log('\n🎉 Double round-robin successfully fixed!');
      console.log(`📊 Summary:`);
      console.log(`   • Matches removed: ${removedCount}`);
      console.log(`   • Tournament format: Single round-robin`);
      console.log(`   • Matches per team: 4`);
      console.log(`   • Total matches: 10`);
      console.log(`   • Season: 2024 (completed)`);
      
      console.log('\n🔗 Dashboard URL:');
      console.log(`   http://localhost:3000/leagues/${LEAGUE_ID}/seasons/${SEASON_ID}/dashboard/completed`);
    } else {
      console.log('\n❌ Fix verification failed - check tournament structure');
    }
    
  } catch (error) {
    console.error('❌ Error fixing double round-robin:', error);
    process.exit(1);
  }
}

fixDoubleRoundRobin();
#!/usr/bin/env node

/**
 * Script to check production match data and identify issues
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

async function checkProductionMatches() {
  try {
    console.log('🔍 Checking production matches...');
    
    const { data: matches, error } = await supabase
      .from('matches')
      .select(`
        id,
        home_team_id,
        away_team_id,
        home_score,
        away_score,
        match_date,
        status,
        venue,
        home_team:teams!matches_home_team_id_fkey(name),
        away_team:teams!matches_away_team_id_fkey(name)
      `)
      .eq('season_id', SEASON_ID)
      .order('match_date');
      
    if (error) {
      console.error('Error fetching matches:', error);
      return;
    }
    
    console.log(`✅ Found ${matches.length} total matches\n`);
    
    // Check each match for missing scores
    const matchesWithoutScores = [];
    const matchesByTeam = {};
    
    console.log('📊 Match Details:');
    console.log('═'.repeat(80));
    
    matches.forEach((match, index) => {
      const homeTeam = match.home_team?.name || 'Unknown';
      const awayTeam = match.away_team?.name || 'Unknown';
      const homeScore = match.home_score;
      const awayScore = match.away_score;
      const hasScores = homeScore !== null && awayScore !== null;
      
      console.log(`${index + 1}. ${homeTeam} vs ${awayTeam}`);
      console.log(`   Score: ${hasScores ? `${homeScore} - ${awayScore}` : 'NO SCORE'}`);
      console.log(`   Status: ${match.status}`);
      console.log(`   Date: ${new Date(match.match_date).toDateString()}`);
      console.log(`   Venue: ${match.venue || 'TBD'}`);
      console.log();
      
      if (!hasScores) {
        matchesWithoutScores.push({
          id: match.id,
          homeTeam,
          awayTeam,
          status: match.status
        });
      }
      
      // Count matches per team
      matchesByTeam[homeTeam] = (matchesByTeam[homeTeam] || 0) + 1;
      matchesByTeam[awayTeam] = (matchesByTeam[awayTeam] || 0) + 1;
    });
    
    // Show matches without scores
    if (matchesWithoutScores.length > 0) {
      console.log('❌ Matches without scores:');
      matchesWithoutScores.forEach(match => {
        console.log(`   • ${match.homeTeam} vs ${match.awayTeam} (${match.status})`);
      });
      console.log();
    } else {
      console.log('✅ All matches have scores!\n');
    }
    
    // Show match distribution per team
    console.log('📊 Matches per team:');
    Object.entries(matchesByTeam)
      .sort(([,a], [,b]) => b - a)
      .forEach(([team, count]) => {
        console.log(`   • ${team}: ${count} matches`);
      });
    
    // Check if distribution is equal
    const matchCounts = Object.values(matchesByTeam);
    const minMatches = Math.min(...matchCounts);
    const maxMatches = Math.max(...matchCounts);
    const isEqual = minMatches === maxMatches;
    
    console.log();
    if (isEqual) {
      console.log(`✅ Equal distribution: Each team plays ${minMatches} matches`);
    } else {
      console.log(`❌ Unequal distribution: ${minMatches} to ${maxMatches} matches per team`);
    }
    
    // Summary
    console.log('\n📈 Season Summary:');
    console.log(`   • Total matches: ${matches.length}`);
    console.log(`   • Matches without scores: ${matchesWithoutScores.length}`);
    console.log(`   • Teams: ${Object.keys(matchesByTeam).length}`);
    console.log(`   • Expected matches for ${Object.keys(matchesByTeam).length} teams: ${Object.keys(matchesByTeam).length * (Object.keys(matchesByTeam).length - 1) / 2}`);
    
    return {
      matches,
      matchesWithoutScores,
      matchesByTeam
    };
    
  } catch (error) {
    console.error('❌ Error checking matches:', error);
  }
}

checkProductionMatches();
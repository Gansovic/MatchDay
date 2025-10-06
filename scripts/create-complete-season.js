#!/usr/bin/env node

/**
 * Script to create a complete season with proper match distribution
 * Creates single round-robin tournament for 4 teams with realistic scores
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const LEAGUE_ID = '261f251e-aee8-4153-a4c7-537b565e7e3f';
const SEASON_ID = '58effe43-682c-480f-8ddc-62e03e9d70e6';

// 4 existing teams
const TEAM_IDS = [
  '425d8961-057e-49c3-a5a5-fade06e785cc', // adminTeam
  '39a9f0fb-517b-4f34-934e-9a280d206989', // playerTeam
  'a4f112f8-6bad-421f-8b50-77e4d4b7e81e', // botTeam
  'f9142db6-e738-4f9c-91ca-d7786c904283'  // bot2Team
];

async function getTeamData() {
  console.log('🔍 Fetching team data...');
  
  const { data: teams, error } = await supabase
    .from('teams')
    .select('id, name')
    .in('id', TEAM_IDS);
    
  if (error) {
    console.error('Error fetching teams:', error);
    return [];
  }
  
  console.log('✅ Found teams:', teams.map(t => `${t.name} (${t.id.substr(0,8)}...)`));
  return teams;
}

function generateRealisticScore() {
  // Generate realistic football scores with appropriate distribution
  const outcomes = [
    [0, 0], [0, 1], [0, 2], [0, 3],
    [1, 0], [1, 1], [1, 2], [1, 3], 
    [2, 0], [2, 1], [2, 2], [2, 3],
    [3, 0], [3, 1], [3, 2], [3, 3],
    [4, 0], [4, 1], [4, 2],
    [5, 0], [5, 1]
  ];
  
  // Weighted towards lower scores (more realistic)
  const weights = [
    3, 4, 3, 1,     // 0-x scores
    4, 5, 4, 2,     // 1-x scores  
    3, 4, 3, 2,     // 2-x scores
    2, 3, 2, 1,     // 3-x scores
    1, 2, 1,        // 4-x scores
    1, 1            // 5-x scores
  ];
  
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;
  
  for (let i = 0; i < outcomes.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return outcomes[i];
    }
  }
  
  return [1, 1]; // fallback
}

function generateMatchDates(totalMatches) {
  const dates = [];
  const startDate = new Date('2024-01-15');
  
  for (let i = 0; i < totalMatches; i++) {
    const matchDate = new Date(startDate);
    // Spread matches over 2-3 months with some variation
    const daysToAdd = (i * 7) + Math.floor(Math.random() * 4) + 1;
    matchDate.setDate(startDate.getDate() + daysToAdd);
    dates.push(matchDate.toISOString());
  }
  
  return dates;
}

function generateSingleRoundRobinFixtures(teams) {
  const fixtures = [];
  const venues = ['Stadium A', 'Football Ground', 'Sports Complex', 'City Arena', 'Olympic Stadium', 'Municipal Field'];
  
  // Single round-robin: each team plays each other team once
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      fixtures.push({
        home_team_id: teams[i].id,
        home_team_name: teams[i].name,
        away_team_id: teams[j].id,
        away_team_name: teams[j].name,
        venue: venues[Math.floor(Math.random() * venues.length)]
      });
    }
  }
  
  return fixtures;
}

async function clearExistingMatches() {
  console.log('🗑️ Clearing existing matches for season...');
  
  const { error } = await supabase
    .from('matches')
    .delete()
    .eq('season_id', SEASON_ID);
    
  if (error) {
    console.error('Error clearing matches:', error);
    throw error;
  }
  
  console.log('✅ Cleared existing matches');
}

async function createCompleteSeasonMatches() {
  try {
    console.log('🚀 Creating complete season with proper match distribution...');
    
    // Get team data
    const teams = await getTeamData();
    if (teams.length !== 4) {
      console.error(`❌ Expected 4 teams, found ${teams.length}`);
      return;
    }
    
    // Clear existing matches first
    await clearExistingMatches();
    
    // Generate single round-robin fixtures
    const fixtures = generateSingleRoundRobinFixtures(teams);
    const matchDates = generateMatchDates(fixtures.length);
    
    console.log(`📅 Generating ${fixtures.length} matches for 4-team single round-robin...`);
    console.log('📊 Expected: Each team plays 3 matches, 6 total matches');
    
    // Create match data with results
    const matchData = fixtures.map((fixture, index) => {
      const [homeScore, awayScore] = generateRealisticScore();
      
      return {
        id: crypto.randomUUID(),
        league_id: LEAGUE_ID,
        season_id: SEASON_ID,
        home_team_id: fixture.home_team_id,
        away_team_id: fixture.away_team_id,
        match_date: matchDates[index],
        venue: fixture.venue,
        status: 'completed',
        home_score: homeScore,
        away_score: awayScore,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });
    
    // Insert matches
    const { data, error } = await supabase
      .from('matches')
      .insert(matchData);
      
    if (error) {
      console.error('❌ Error inserting matches:', error);
      return;
    }
    
    console.log(`✅ Inserted ${matchData.length} matches`);
    
    // Verify match distribution
    const teamMatchCounts = {};
    matchData.forEach(match => {
      const homeTeamId = match.home_team_id;
      const awayTeamId = match.away_team_id;
      
      teamMatchCounts[homeTeamId] = (teamMatchCounts[homeTeamId] || 0) + 1;
      teamMatchCounts[awayTeamId] = (teamMatchCounts[awayTeamId] || 0) + 1;
    });
    
    console.log('\n📊 Match distribution per team:');
    teams.forEach(team => {
      const count = teamMatchCounts[team.id] || 0;
      console.log(`   • ${team.name}: ${count} matches`);
    });
    
    // Calculate statistics
    const totalGoals = matchData.reduce((sum, match) => sum + match.home_score + match.away_score, 0);
    const avgGoals = (totalGoals / matchData.length).toFixed(2);
    
    console.log('\n🎉 Successfully created complete season!')
    console.log(`📊 Season Summary:`)
    console.log(`   • Total matches: ${matchData.length}`)
    console.log(`   • Total goals: ${totalGoals}`)
    console.log(`   • Average goals per match: ${avgGoals}`)
    console.log(`   • Teams: ${teams.length}`)
    console.log(`   • Tournament format: Single round-robin`)
    console.log(`   • Season: 2024 (completed)`)
    
    console.log('\n🔗 Dashboard URL:')
    console.log(`   http://localhost:3000/leagues/${LEAGUE_ID}/seasons/${SEASON_ID}/dashboard/completed`)
    
  } catch (error) {
    console.error('❌ Error creating season:', error)
    process.exit(1)
  }
}

createCompleteSeasonMatches();
#!/usr/bin/env node

/**
 * Script to add match data to existing completed season
 * League ID: 261f251e-aee8-4153-a4c7-537b565e7e3f
 * Season ID: 58effe43-682c-480f-8ddc-62e03e9d70e6
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

// Team IDs from environment
const TEAM_IDS = [
  process.env.PLAYER_TEAM_ID, // playerTeam
  process.env.ADMIN_TEAM_ID,  // adminTeam  
  process.env.BOT_TEAM_ID,    // bot team 1
  process.env.BOT2_TEAM_ID    // bot team 2
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
  
  console.log('✅ Found teams:', teams.map(t => `${t.name} (${t.id})`));
  return teams;
}

function generateMatches(teams) {
  const matches = [];
  const venues = ['Stadium A', 'Football Ground', 'Sports Complex', 'City Arena'];
  
  // Generate round-robin fixtures (each team plays each other twice)
  for (let i = 0; i < teams.length; i++) {
    for (let j = 0; j < teams.length; j++) {
      if (i !== j) {
        // Home match
        matches.push({
          home_team_id: teams[i].id,
          away_team_id: teams[j].id,
          home_team_name: teams[i].name,
          away_team_name: teams[j].name,
          venue: venues[Math.floor(Math.random() * venues.length)]
        });
      }
    }
  }
  
  return matches;
}

function generateRealisticScore() {
  // Generate realistic football scores
  const outcomes = [
    [0, 0], [0, 1], [0, 2], [0, 3],
    [1, 0], [1, 1], [1, 2], [1, 3], [1, 4],
    [2, 0], [2, 1], [2, 2], [2, 3],
    [3, 0], [3, 1], [3, 2], [3, 3],
    [4, 0], [4, 1], [4, 2]
  ];
  
  return outcomes[Math.floor(Math.random() * outcomes.length)];
}

function generateMatchDates(totalMatches) {
  const dates = [];
  const startDate = new Date('2024-01-15'); // Start season in January
  const daysBetweenMatches = 7; // Weekly matches
  
  for (let i = 0; i < totalMatches; i++) {
    const matchDate = new Date(startDate);
    matchDate.setDate(startDate.getDate() + (i * daysBetweenMatches));
    dates.push(matchDate.toISOString());
  }
  
  return dates;
}

async function addMatches() {
  try {
    console.log('🚀 Starting to add matches for completed season...');
    
    // Get team data
    const teams = await getTeamData();
    if (teams.length < 2) {
      console.error('❌ Need at least 2 teams to create matches');
      return;
    }
    
    // Generate fixtures
    const fixtures = generateMatches(teams);
    const matchDates = generateMatchDates(fixtures.length);
    
    console.log(`📅 Generating ${fixtures.length} matches...`);
    
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
    
    // Insert matches in batches
    const batchSize = 10;
    for (let i = 0; i < matchData.length; i += batchSize) {
      const batch = matchData.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('matches')
        .insert(batch);
        
      if (error) {
        console.error(`❌ Error inserting batch ${Math.floor(i/batchSize) + 1}:`, error);
        return;
      }
      
      console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(matchData.length/batchSize)} (${batch.length} matches)`);
    }
    
    // Summary
    const totalGoals = matchData.reduce((sum, match) => sum + match.home_score + match.away_score, 0);
    const avgGoals = (totalGoals / matchData.length).toFixed(2);
    
    console.log('\n🎉 Successfully added matches to completed season!');
    console.log(`📊 Summary:`);
    console.log(`   • Total matches: ${matchData.length}`);
    console.log(`   • Total goals: ${totalGoals}`);
    console.log(`   • Average goals per match: ${avgGoals}`);
    console.log(`   • Season: 2024 (completed)`);
    console.log(`   • Teams: ${teams.length}`);
    
    console.log('\n🔗 Dashboard URL:');
    console.log(`   http://localhost:3000/leagues/${LEAGUE_ID}/seasons/${SEASON_ID}/dashboard/completed`);
    
  } catch (error) {
    console.error('❌ Error adding matches:', error);
    process.exit(1);
  }
}

addMatches();
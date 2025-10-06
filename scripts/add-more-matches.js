#!/usr/bin/env node

/**
 * Script to add more match data using all existing teams
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

// Using actual team IDs found in database
const ACTUAL_TEAM_IDS = [
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
    .in('id', ACTUAL_TEAM_IDS);
    
  if (error) {
    console.error('Error fetching teams:', error);
    return [];
  }
  
  console.log('✅ Found teams:', teams.map(t => `${t.name} (${t.id.substr(0,8)}...)`));
  return teams;
}

async function checkExistingMatches() {
  console.log('🔍 Checking existing matches...');
  
  const { data: matches, error } = await supabase
    .from('matches')
    .select('id, home_team_id, away_team_id, home_score, away_score')
    .eq('season_id', SEASON_ID);
    
  if (error) {
    console.error('Error fetching existing matches:', error);
    return [];
  }
  
  console.log(`✅ Found ${matches.length} existing matches`);
  return matches;
}

function generateMatches(teams, existingMatches) {
  const matches = [];
  const venues = ['Stadium A', 'Football Ground', 'Sports Complex', 'City Arena', 'Olympic Stadium', 'Municipal Field'];
  
  // Create set of existing fixtures
  const existingFixtures = new Set();
  existingMatches.forEach(match => {
    existingFixtures.add(`${match.home_team_id}-${match.away_team_id}`);
  });
  
  // Generate round-robin fixtures (each team plays each other twice - home and away)
  for (let i = 0; i < teams.length; i++) {
    for (let j = 0; j < teams.length; j++) {
      if (i !== j) {
        const fixtureKey = `${teams[i].id}-${teams[j].id}`;
        
        // Only add if this fixture doesn't already exist
        if (!existingFixtures.has(fixtureKey)) {
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
  }
  
  return matches;
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
  const startDate = new Date('2024-01-15'); // Start season in January
  
  // Distribute matches over several months with some variation
  for (let i = 0; i < totalMatches; i++) {
    const matchDate = new Date(startDate);
    // Add some variation - not exactly weekly
    const daysToAdd = (i * 5) + Math.floor(Math.random() * 4) + 1;
    matchDate.setDate(startDate.getDate() + daysToAdd);
    dates.push(matchDate.toISOString());
  }
  
  return dates;
}

async function addMatches() {
  try {
    console.log('🚀 Starting to add additional matches for completed season...');
    
    // Get team data
    const teams = await getTeamData();
    if (teams.length < 2) {
      console.error('❌ Need at least 2 teams to create matches');
      return;
    }
    
    // Check existing matches
    const existingMatches = await checkExistingMatches();
    
    // Generate new fixtures
    const newFixtures = generateMatches(teams, existingMatches);
    
    if (newFixtures.length === 0) {
      console.log('✅ All possible matches already exist!');
      return;
    }
    
    const matchDates = generateMatchDates(newFixtures.length);
    
    console.log(`📅 Generating ${newFixtures.length} additional matches...`);
    
    // Create match data with results
    const matchData = newFixtures.map((fixture, index) => {
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
    
    // Get total statistics
    const allMatchData = [...existingMatches, ...matchData];
    const totalGoals = allMatchData.reduce((sum, match) => sum + (match.home_score || 0) + (match.away_score || 0), 0);
    const avgGoals = (totalGoals / allMatchData.length).toFixed(2);
    
    console.log('\n🎉 Successfully added additional matches to completed season!');
    console.log(`📊 Season Summary:`);
    console.log(`   • Total matches: ${allMatchData.length}`);
    console.log(`   • Matches added: ${matchData.length}`);
    console.log(`   • Total goals: ${totalGoals}`);
    console.log(`   • Average goals per match: ${avgGoals}`);
    console.log(`   • Teams: ${teams.length}`);
    console.log(`   • Season: 2024 (completed)`);
    
    console.log('\n🔗 Dashboard URL:');
    console.log(`   http://localhost:3000/leagues/${LEAGUE_ID}/seasons/${SEASON_ID}/dashboard/completed`);
    
  } catch (error) {
    console.error('❌ Error adding matches:', error);
    process.exit(1);
  }
}

addMatches();
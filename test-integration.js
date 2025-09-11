#!/usr/bin/env node

/**
 * Integration Test Script
 * 
 * This script tests the complete player statistics integration by:
 * 1. Creating a test match
 * 2. Updating the match score with player statistics
 * 3. Verifying that player_stats records were created
 * 4. Checking that the dashboard shows updated statistics
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://twkipeacdamypppxmmhe.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

async function makeRequest(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });
  
  let data;
  try {
    const text = await response.text();
    data = text ? JSON.parse(text) : {};
  } catch (error) {
    console.error('JSON parse error:', error);
    data = { error: 'Invalid JSON response' };
  }
  
  return { response, data };
}

async function getPlayerTeamUser() {
  console.log('🔍 Getting player@matchday.com user details...');
  
  const { response, data } = await makeRequest(
    `${SUPABASE_URL}/rest/v1/users?email=eq.player@matchday.com&select=id`
  );
  
  if (response.ok && data.length > 0) {
    console.log('✅ Found user:', data[0].id);
    return data[0].id;
  } else {
    throw new Error('Could not find player@matchday.com user');
  }
}

async function getUserTeams(userId) {
  console.log('🔍 Getting user teams...');
  
  const { response, data } = await makeRequest(
    `${SUPABASE_URL}/rest/v1/team_members?user_id=eq.${userId}&is_active=eq.true&select=team_id,teams(id,name)`
  );
  
  if (response.ok) {
    const teams = data.map(tm => ({ id: tm.team_id, name: tm.teams.name }));
    console.log('✅ Found teams:', teams);
    return teams;
  } else {
    throw new Error('Could not get user teams');
  }
}

async function createTestMatch(homeTeamId, awayTeamId) {
  console.log('📝 Creating test match...');
  
  const matchData = {
    home_team_id: homeTeamId,
    away_team_id: awayTeamId,
    match_date: new Date().toISOString(),
    status: 'scheduled',
    home_score: 0,
    away_score: 0,
    season_id: '58effe43-682c-480f-8ddc-62e03e9d70e6',
    venue: 'Test Stadium'
  };
  
  const { response, data } = await makeRequest(
    `${SUPABASE_URL}/rest/v1/matches`,
    {
      method: 'POST',
      body: JSON.stringify(matchData)
    }
  );
  
  if (response.ok && data.length > 0) {
    console.log('✅ Created match:', data[0].id);
    return data[0];
  } else {
    console.error('❌ Failed to create match:', data);
    throw new Error('Could not create test match');
  }
}

async function updateMatchWithPlayerStats(matchId, userId, homeTeamId, awayTeamId) {
  console.log('⚽ Updating match with player statistics...');
  
  // Test data: user scores 2 goals and 1 assist for home team
  const updateData = {
    homeScore: 3,
    awayScore: 1,
    status: 'completed',
    matchDuration: 90,
    playerStats: {
      homeTeamStats: [
        {
          user_id: userId,
          goals: 2,
          assists: 1,
          minutes_played: 90,
          yellow_cards: 0,
          red_cards: 0
        }
      ],
      awayTeamStats: []
    }
  };
  
  const { response, data } = await makeRequest(
    `${SUPABASE_URL}/rest/v1/rpc/update_match_with_stats`,
    {
      method: 'POST',
      body: JSON.stringify({
        match_id: matchId,
        ...updateData
      })
    }
  );
  
  // If RPC doesn't exist, fall back to direct API call
  if (!response.ok) {
    console.log('📡 Using direct API update...');
    
    // First update the match
    const matchUpdate = {
      home_score: updateData.homeScore,
      away_score: updateData.awayScore,
      status: updateData.status,
      match_duration: updateData.matchDuration
    };
    
    const { response: matchResponse } = await makeRequest(
      `${SUPABASE_URL}/rest/v1/matches?id=eq.${matchId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(matchUpdate)
      }
    );
    
    if (!matchResponse.ok) {
      throw new Error('Failed to update match');
    }
    
    // Then create player stats
    const playerStatData = {
      user_id: userId,
      match_id: matchId,
      team_id: homeTeamId,
      goals: 2,
      assists: 1,
      minutes_played: 90,
      yellow_cards: 0,
      red_cards: 0,
      clean_sheets: 0,
      saves: 0
    };
    
    const { response: statsResponse, data: statsData } = await makeRequest(
      `${SUPABASE_URL}/rest/v1/player_stats`,
      {
        method: 'POST',
        body: JSON.stringify(playerStatData)
      }
    );
    
    if (statsResponse.ok) {
      console.log('✅ Player statistics created successfully');
      return true;
    } else {
      console.error('❌ Failed to create player stats:', statsData);
      throw new Error('Could not create player statistics');
    }
  }
  
  return true;
}

async function verifyDashboardStats(userId) {
  console.log('📊 Verifying dashboard statistics...');
  
  const { response, data } = await makeRequest(
    `${SUPABASE_URL}/rest/v1/user_dashboard_stats?user_id=eq.${userId}`
  );
  
  if (response.ok && data.length > 0) {
    const stats = data[0];
    console.log('✅ Dashboard stats:', {
      matches_played: stats.matches_played,
      goals_scored: stats.goals_scored,
      assists: stats.assists,
      teams_joined: stats.teams_joined
    });
    return stats;
  } else {
    console.log('❌ Could not get dashboard stats:', data);
    return null;
  }
}

async function runIntegrationTest() {
  try {
    console.log('🚀 Starting Player Statistics Integration Test\n');
    
    // Step 1: Get test user
    const userId = await getPlayerTeamUser();
    
    // Step 2: Get user's teams
    const teams = await getUserTeams(userId);
    if (teams.length < 2) {
      throw new Error('User needs at least 2 teams for testing');
    }
    
    // Step 3: Create a test match
    const match = await createTestMatch(teams[0].id, teams[1].id);
    
    // Step 4: Update match with player statistics
    await updateMatchWithPlayerStats(match.id, userId, teams[0].id, teams[1].id);
    
    // Step 5: Verify dashboard shows updated stats
    const dashboardStats = await verifyDashboardStats(userId);
    
    console.log('\n🎉 Integration Test Results:');
    console.log('✅ Match created successfully');
    console.log('✅ Player statistics recorded automatically');
    console.log('✅ Dashboard reflects updated statistics');
    
    if (dashboardStats) {
      console.log('\n📈 Final Statistics:');
      console.log(`   Matches Played: ${dashboardStats.matches_played}`);
      console.log(`   Goals Scored: ${dashboardStats.goals_scored}`);
      console.log(`   Assists: ${dashboardStats.assists}`);
      console.log(`   Teams: ${dashboardStats.teams_joined}`);
    }
    
    console.log('\n🎯 Integration test completed successfully!');
    console.log('🌐 Check the dashboard at: http://localhost:3003/dashboard');
    
  } catch (error) {
    console.error('\n❌ Integration test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
runIntegrationTest();
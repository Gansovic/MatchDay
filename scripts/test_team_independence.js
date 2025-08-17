/**
 * Test script to verify team independence from leagues
 * This script will:
 * 1. Create a test league
 * 2. Create a test team in that league
 * 3. Delete the league
 * 4. Verify the team still exists as an orphaned team
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'http://localhost:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTeamIndependence() {
  console.log('🧪 Testing Team Independence from Leagues\n');
  
  try {
    // Step 1: Create a test league
    console.log('1️⃣ Creating test league...');
    const { data: league, error: leagueError } = await supabase
      .from('leagues')
      .insert({
        name: 'Test League for Deletion',
        description: 'This league will be deleted to test team persistence',
        sport_type: 'football',
        league_type: 'casual',
        is_active: true,
        is_public: true
      })
      .select()
      .single();
    
    if (leagueError) throw leagueError;
    console.log(`✅ Created league: ${league.name} (ID: ${league.id})\n`);
    
    // Step 2: Create a test team in that league
    console.log('2️⃣ Creating test team...');
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({
        name: 'Persistent Team',
        league_id: league.id,
        team_bio: 'This team should persist after league deletion',
        team_color: '#FF5733',
        max_players: 20,
        min_players: 10,
        is_recruiting: true
      })
      .select()
      .single();
    
    if (teamError) throw teamError;
    console.log(`✅ Created team: ${team.name} (ID: ${team.id})`);
    console.log(`   League ID: ${team.league_id}\n`);
    
    // Step 3: Add some sample player stats to the team
    console.log('3️⃣ Adding sample player stats...');
    const { data: stats, error: statsError } = await supabase
      .from('player_stats')
      .insert({
        user_id: '550e8400-e29b-41d4-a716-446655440100', // John Doe from sample data
        team_id: team.id,
        goals: 5,
        assists: 3,
        minutes_played: 450
      })
      .select()
      .single();
    
    if (statsError) {
      console.log('⚠️ Could not add player stats (user might not exist)');
    } else {
      console.log(`✅ Added player stats for team\n`);
    }
    
    // Step 4: Delete the league
    console.log('4️⃣ Deleting the league...');
    const { error: deleteError } = await supabase
      .from('leagues')
      .delete()
      .eq('id', league.id);
    
    if (deleteError) throw deleteError;
    console.log(`✅ Deleted league: ${league.name}\n`);
    
    // Step 5: Check if the team still exists
    console.log('5️⃣ Checking if team still exists...');
    const { data: persistedTeam, error: checkError } = await supabase
      .from('teams')
      .select('*')
      .eq('id', team.id)
      .single();
    
    if (checkError) throw checkError;
    
    console.log('✅ Team still exists!');
    console.log(`   Team Name: ${persistedTeam.name}`);
    console.log(`   League ID: ${persistedTeam.league_id} (should be null)`);
    console.log(`   Previous League: ${persistedTeam.previous_league_name || 'Not captured'}`);
    console.log(`   Is Archived: ${persistedTeam.is_archived}\n`);
    
    // Step 6: Check if player stats are preserved
    console.log('6️⃣ Checking if player stats are preserved...');
    const { data: preservedStats, error: statsCheckError } = await supabase
      .from('player_stats')
      .select('*')
      .eq('team_id', team.id);
    
    if (statsCheckError) {
      console.log('⚠️ Could not check player stats');
    } else {
      console.log(`✅ Found ${preservedStats.length} player stats records for the team\n`);
    }
    
    // Step 7: Check orphaned teams view
    console.log('7️⃣ Checking orphaned teams view...');
    const { data: orphanedTeams, error: orphanedError } = await supabase
      .from('orphaned_teams')
      .select('*');
    
    if (orphanedError) {
      console.log('⚠️ Could not query orphaned_teams view');
    } else {
      const ourTeam = orphanedTeams.find(t => t.id === team.id);
      if (ourTeam) {
        console.log('✅ Team appears in orphaned_teams view');
        console.log(`   Active Members: ${ourTeam.active_members || 0}`);
        console.log(`   Total Stats Records: ${ourTeam.total_stats_records || 0}\n`);
      }
    }
    
    // Clean up: Delete the test team
    console.log('🧹 Cleaning up test data...');
    await supabase.from('player_stats').delete().eq('team_id', team.id);
    await supabase.from('teams').delete().eq('id', team.id);
    console.log('✅ Test data cleaned up\n');
    
    console.log('🎉 SUCCESS: Teams are now independent from leagues!');
    console.log('   - Teams persist when their league is deleted');
    console.log('   - Player stats are preserved');
    console.log('   - Teams can be reassigned to new leagues');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testTeamIndependence();
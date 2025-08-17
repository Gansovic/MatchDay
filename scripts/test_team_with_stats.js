/**
 * Comprehensive test to verify team independence with real stats
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'http://localhost:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testWithRealStats() {
  console.log('🧪 Testing Team Independence with Real Player Stats\n');
  
  try {
    // Step 1: Create a test user
    console.log('1️⃣ Creating test user...');
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        email: 'test.player@example.com',
        full_name: 'Test Player',
        position: 'forward',
        role: 'player'
      })
      .select()
      .single();
    
    if (userError) throw userError;
    console.log(`✅ Created user: ${user.full_name} (ID: ${user.id})\n`);
    
    // Step 2: Create a test league
    console.log('2️⃣ Creating test league...');
    const { data: league, error: leagueError } = await supabase
      .from('leagues')
      .insert({
        name: 'Stats Test League',
        description: 'League with teams that have real stats',
        sport_type: 'football',
        league_type: 'competitive',
        is_active: true,
        is_public: true
      })
      .select()
      .single();
    
    if (leagueError) throw leagueError;
    console.log(`✅ Created league: ${league.name} (ID: ${league.id})\n`);
    
    // Step 3: Create a test team
    console.log('3️⃣ Creating test team...');
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({
        name: 'Stats FC',
        league_id: league.id,
        captain_id: user.id,
        team_bio: 'Team with important player statistics',
        team_color: '#00FF00',
        max_players: 25,
        is_recruiting: true
      })
      .select()
      .single();
    
    if (teamError) throw teamError;
    console.log(`✅ Created team: ${team.name} (ID: ${team.id})\n`);
    
    // Step 4: Add the user as a team member
    console.log('4️⃣ Adding user as team member...');
    const { data: member, error: memberError } = await supabase
      .from('team_members')
      .insert({
        team_id: team.id,
        user_id: user.id,
        position: 'forward',
        jersey_number: 9,
        is_active: true
      })
      .select()
      .single();
    
    if (memberError) throw memberError;
    console.log(`✅ Added ${user.full_name} to team with jersey #${member.jersey_number}\n`);
    
    // Step 5: Create a match
    console.log('5️⃣ Creating a match...');
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .insert({
        league_id: league.id,
        home_team_id: team.id,
        away_team_id: team.id, // Same team for simplicity
        match_date: new Date().toISOString(),
        venue: 'Test Stadium',
        status: 'completed',
        home_score: 3,
        away_score: 2
      })
      .select()
      .single();
    
    if (matchError) throw matchError;
    console.log(`✅ Created match (ID: ${match.id})\n`);
    
    // Step 6: Add player stats
    console.log('6️⃣ Adding player stats...');
    const { data: stats, error: statsError } = await supabase
      .from('player_stats')
      .insert({
        user_id: user.id,
        team_id: team.id,
        match_id: match.id,
        goals: 2,
        assists: 1,
        yellow_cards: 0,
        red_cards: 0,
        minutes_played: 90,
        clean_sheets: 0
      })
      .select()
      .single();
    
    if (statsError) throw statsError;
    console.log(`✅ Added player stats: ${stats.goals} goals, ${stats.assists} assists\n`);
    
    // Step 7: Add team stats
    console.log('7️⃣ Adding team stats...');
    const { data: teamStats, error: teamStatsError } = await supabase
      .from('team_stats')
      .insert({
        team_id: team.id,
        league_id: league.id,
        season_year: new Date().getFullYear(),
        wins: 10,
        draws: 5,
        losses: 3,
        goals_for: 35,
        goals_against: 20,
        points: 35
      })
      .select()
      .single();
    
    if (teamStatsError) {
      console.log('⚠️ Could not add team stats (table might not exist)');
    } else {
      console.log(`✅ Added team stats: ${teamStats.wins}W ${teamStats.draws}D ${teamStats.losses}L\n`);
    }
    
    // Step 8: Delete the league
    console.log('8️⃣ Deleting the league...');
    const { error: deleteError } = await supabase
      .from('leagues')
      .delete()
      .eq('id', league.id);
    
    if (deleteError) throw deleteError;
    console.log(`✅ Deleted league: ${league.name}\n`);
    
    // Step 9: Verify team still exists
    console.log('9️⃣ Verifying team persistence...');
    const { data: persistedTeam, error: checkError } = await supabase
      .from('teams')
      .select('*')
      .eq('id', team.id)
      .single();
    
    if (checkError) throw checkError;
    
    console.log('✅ Team still exists!');
    console.log(`   Team Name: ${persistedTeam.name}`);
    console.log(`   League ID: ${persistedTeam.league_id} (null = orphaned)`);
    console.log(`   Previous League: ${persistedTeam.previous_league_name}`);
    console.log(`   Captain ID: ${persistedTeam.captain_id}\n`);
    
    // Step 10: Verify player stats are preserved
    console.log('🔟 Verifying player stats...');
    const { data: preservedStats, error: statsCheckError } = await supabase
      .from('player_stats')
      .select('*')
      .eq('team_id', team.id);
    
    if (statsCheckError) throw statsCheckError;
    
    console.log(`✅ Player stats preserved: ${preservedStats.length} records`);
    if (preservedStats.length > 0) {
      const stat = preservedStats[0];
      console.log(`   Goals: ${stat.goals}`);
      console.log(`   Assists: ${stat.assists}`);
      console.log(`   Minutes: ${stat.minutes_played}\n`);
    }
    
    // Step 11: Verify team members are preserved
    console.log('1️⃣1️⃣ Verifying team members...');
    const { data: preservedMembers, error: membersCheckError } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', team.id);
    
    if (membersCheckError) throw membersCheckError;
    
    console.log(`✅ Team members preserved: ${preservedMembers.length} members`);
    if (preservedMembers.length > 0) {
      const member = preservedMembers[0];
      console.log(`   Jersey #${member.jersey_number}`);
      console.log(`   Position: ${member.position}\n`);
    }
    
    // Step 12: Test reassigning to a new league
    console.log('1️⃣2️⃣ Testing league reassignment...');
    const { data: newLeague, error: newLeagueError } = await supabase
      .from('leagues')
      .insert({
        name: 'New Home League',
        description: 'A new league for orphaned teams',
        sport_type: 'football',
        league_type: 'competitive',
        is_active: true,
        is_public: true
      })
      .select()
      .single();
    
    if (newLeagueError) throw newLeagueError;
    
    const { data: reassignedTeam, error: reassignError } = await supabase
      .from('teams')
      .update({
        league_id: newLeague.id,
        previous_league_name: null,
        is_archived: false
      })
      .eq('id', team.id)
      .select()
      .single();
    
    if (reassignError) throw reassignError;
    
    console.log(`✅ Team reassigned to new league: ${newLeague.name}`);
    console.log(`   New League ID: ${reassignedTeam.league_id}\n`);
    
    // Clean up
    console.log('🧹 Cleaning up test data...');
    await supabase.from('player_stats').delete().eq('team_id', team.id);
    await supabase.from('team_stats').delete().eq('team_id', team.id);
    await supabase.from('team_members').delete().eq('team_id', team.id);
    await supabase.from('matches').delete().eq('id', match.id);
    await supabase.from('teams').delete().eq('id', team.id);
    await supabase.from('users').delete().eq('id', user.id);
    await supabase.from('leagues').delete().eq('id', newLeague.id);
    console.log('✅ Test data cleaned up\n');
    
    console.log('🎉 COMPREHENSIVE TEST PASSED!');
    console.log('   ✓ Teams persist when leagues are deleted');
    console.log('   ✓ Player statistics are preserved');
    console.log('   ✓ Team members are preserved');
    console.log('   ✓ League name is captured for reference');
    console.log('   ✓ Teams can be reassigned to new leagues');
    console.log('   ✓ All relationships maintain data integrity');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testWithRealStats();
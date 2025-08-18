/**
 * Reset Test Scenario
 * 
 * This script resets the test scenario to allow repeated testing:
 * - Removes test team from any league
 * - Deletes all test team's league requests
 * - Preserves user and team data for reuse
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, serviceKey);

async function resetTestScenario() {
  console.log('🔄 Resetting test scenario...\\n');

  try {
    // 1. Get player user
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }

    const playerUser = users.users.find(u => u.email === 'player@matchday.com');
    if (!playerUser) {
      console.error('❌ Player user not found');
      return;
    }

    console.log('👤 Player user found:', playerUser.email);

    // 2. Get test team
    const { data: testTeams, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .eq('captain_id', playerUser.id)
      .eq('name', 'Test Thunder FC');

    if (teamsError) {
      console.error('❌ Error fetching test team:', teamsError);
      return;
    }

    if (testTeams.length === 0) {
      console.log('⚠️  Test team "Test Thunder FC" not found. Nothing to reset.');
      return;
    }

    const testTeam = testTeams[0];
    console.log('⚽ Test team found:', testTeam.name);

    // 3. Remove team from any league
    if (testTeam.league_id) {
      console.log('🔄 Removing team from league...');
      const { error: updateError } = await supabase
        .from('teams')
        .update({ league_id: null })
        .eq('id', testTeam.id);

      if (updateError) {
        console.error('❌ Error removing team from league:', updateError);
        return;
      }
      console.log('✅ Team removed from league');
    } else {
      console.log('✅ Team already not in any league');
    }

    // 4. Delete all league requests for this team
    console.log('🔄 Deleting test team league requests...');
    const { data: deletedRequests, error: deleteError } = await supabase
      .from('team_league_requests')
      .delete()
      .eq('team_id', testTeam.id)
      .select();

    if (deleteError) {
      console.error('❌ Error deleting league requests:', deleteError);
      return;
    }

    console.log(`✅ Deleted ${deletedRequests?.length || 0} league requests`);

    // 5. Summary
    console.log('\\n🎯 Reset Complete!');
    console.log('=====================');
    console.log('✅ Test team removed from any league');
    console.log('✅ All test league requests deleted');
    console.log('✅ Ready for fresh testing');
    console.log('\\n📋 Next Steps:');
    console.log('1. Login to player app as: player@matchday.com / player123!');
    console.log('2. Create a new league join request');
    console.log('3. Test admin approval/rejection workflow');
    console.log('\\n🔧 Useful Commands:');
    console.log('- "node verify_test_scenario.js" to check current state');
    console.log('- "node create_test_scenario.js" to recreate test data if needed');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

resetTestScenario();
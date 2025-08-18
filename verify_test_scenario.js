/**
 * Verify Test Scenario Status
 * 
 * This script checks the current state of the test scenario:
 * - Shows team league requests and their status
 * - Shows team league assignments
 * - Verifies data integrity
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, serviceKey);

async function verifyTestScenario() {
  console.log('🔍 Verifying Test Scenario Status...\\n');

  try {
    // 1. Get test users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }

    const adminUser = users.users.find(u => u.email === 'admin@matchday.com');
    const playerUser = users.users.find(u => u.email === 'player@matchday.com');

    if (!adminUser || !playerUser) {
      console.error('❌ Test users not found');
      return;
    }

    console.log('👤 Test Users:');
    console.log(`   Admin: ${adminUser.email} (${adminUser.id})`);
    console.log(`   Player: ${playerUser.email} (${playerUser.id})`);

    // 2. Get admin leagues
    console.log('\\n🏆 Admin Leagues:');
    const { data: leagues, error: leaguesError } = await supabase
      .from('leagues')
      .select('*')
      .eq('created_by', adminUser.id);

    if (leaguesError) {
      console.error('❌ Error fetching leagues:', leaguesError);
      return;
    }

    if (leagues.length === 0) {
      console.log('   ❌ No leagues found for admin');
      return;
    }

    leagues.forEach(league => {
      console.log(`   - ${league.name} (ID: ${league.id}, ${league.sport_type})`);
    });

    // 3. Get player's teams
    console.log('\\n⚽ Player Teams:');
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select(`
        id,
        name,
        league_id,
        captain_id,
        team_color,
        team_bio,
        leagues:league_id (
          name,
          sport_type
        )
      `)
      .eq('captain_id', playerUser.id);

    if (teamsError) {
      console.error('❌ Error fetching teams:', teamsError);
      return;
    }

    if (teams.length === 0) {
      console.log('   ❌ No teams found for player');
      return;
    }

    teams.forEach(team => {
      const leagueInfo = team.league_id && team.leagues 
        ? `in ${team.leagues.name}` 
        : 'NOT in any league';
      console.log(`   - ${team.name} (ID: ${team.id}) - ${leagueInfo}`);
    });

    // 4. Get team league requests
    console.log('\\n📋 Team League Requests:');
    const { data: requests, error: requestsError } = await supabase
      .from('team_league_requests')
      .select(`
        id,
        status,
        message,
        created_at,
        reviewed_at,
        response_message,
        teams:team_id (
          name
        ),
        leagues:league_id (
          name
        ),
        requested_by_profile:requested_by (
          display_name,
          full_name
        ),
        requested_by_auth:requested_by (
          email
        ),
        reviewed_by_profile:reviewed_by (
          display_name,
          full_name
        )
      `)
      .order('created_at', { ascending: false });

    if (requestsError) {
      console.error('❌ Error fetching requests:', requestsError);
      return;
    }

    if (requests.length === 0) {
      console.log('   ✅ No league requests found');
    } else {
      requests.forEach(request => {
        const teamName = request.teams?.name || 'Unknown Team';
        const leagueName = request.leagues?.name || 'Unknown League';
        const requesterName = request.requested_by_profile?.display_name || 
                             request.requested_by_profile?.full_name || 
                             request.requested_by_auth?.email || 'Unknown';
        const reviewerName = request.reviewed_by_profile?.display_name || 
                           request.reviewed_by_profile?.full_name || 
                           'Not reviewed';
        
        console.log(`   📄 Request ID: ${request.id}`);
        console.log(`      Team: ${teamName} → League: ${leagueName}`);
        console.log(`      Status: ${request.status.toUpperCase()}`);
        console.log(`      Requested by: ${requesterName}`);
        console.log(`      Created: ${new Date(request.created_at).toLocaleString()}`);
        
        if (request.message) {
          console.log(`      Message: "${request.message}"`);
        }
        
        if (request.reviewed_at) {
          console.log(`      Reviewed: ${new Date(request.reviewed_at).toLocaleString()} by ${reviewerName}`);
          if (request.response_message) {
            console.log(`      Response: "${request.response_message}"`);
          }
        }
        console.log('');
      });
    }

    // 5. Data integrity check
    console.log('🔍 Data Integrity Check:');
    
    // Check for approved requests where team should be in league
    const approvedRequests = requests.filter(r => r.status === 'approved');
    let integrityIssues = 0;
    
    for (const request of approvedRequests) {
      const team = teams.find(t => t.id === request.team_id);
      if (team && team.league_id !== request.league_id) {
        console.log(`   ❌ ISSUE: Approved request ${request.id} but team ${team.name} not in league`);
        integrityIssues++;
      }
    }

    if (integrityIssues === 0) {
      console.log('   ✅ No data integrity issues found');
    } else {
      console.log(`   ❌ Found ${integrityIssues} data integrity issues`);
    }

    // 6. Summary
    console.log('\\n📊 Summary:');
    console.log(`   Teams: ${teams.length}`);
    console.log(`   Total Requests: ${requests.length}`);
    console.log(`   Pending: ${requests.filter(r => r.status === 'pending').length}`);
    console.log(`   Approved: ${requests.filter(r => r.status === 'approved').length}`);
    console.log(`   Rejected: ${requests.filter(r => r.status === 'rejected').length}`);
    
    const teamsInLeagues = teams.filter(t => t.league_id).length;
    console.log(`   Teams in Leagues: ${teamsInLeagues}/${teams.length}`);

    // 7. Next steps
    console.log('\\n🎯 Testing Status:');
    const testTeam = teams.find(t => t.name === 'Test Thunder FC');
    const testRequests = requests.filter(r => r.teams?.name === 'Test Thunder FC');
    
    if (!testTeam) {
      console.log('   ❌ Test team "Test Thunder FC" not found. Run create_test_scenario.js');
    } else if (testTeam.league_id) {
      console.log('   ⚠️  Test team is already in a league. Run reset_test_scenario.js to reset');
    } else if (testRequests.filter(r => r.status === 'pending').length > 0) {
      console.log('   🟡 Test scenario has pending requests. Ready for admin testing!');
    } else {
      console.log('   ✅ Test team ready. Create a league request in player app to test!');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

verifyTestScenario();
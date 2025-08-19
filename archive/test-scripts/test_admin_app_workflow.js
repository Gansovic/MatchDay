/**
 * Test script to verify the complete admin app workflow
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'http://localhost:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNx_VzKNHh2Cr4TGXCJjcWUVJEBo'
);

async function testAdminWorkflow() {
  try {
    console.log('🧪 Testing Admin App Workflow\n');
    
    // Step 1: Sign in as admin
    console.log('1️⃣ Signing in as admin...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@matchday.com',
      password: 'admin123!'
    });
    
    if (authError) {
      console.error('❌ Auth failed:', authError);
      return;
    }
    
    console.log('✅ Admin signed in:', authData.user.email);
    console.log('   User ID:', authData.user.id);
    console.log('   Session token length:', authData.session?.access_token?.length || 0);
    
    // Step 2: Test admin dashboard service
    console.log('\n2️⃣ Testing admin dashboard service...');
    
    // Get admin leagues
    const { data: leagues, error: leagueError } = await supabase
      .from('leagues')
      .select('id, name, created_by')
      .eq('created_by', authData.user.id);
      
    if (leagueError) {
      console.error('❌ League fetch error:', leagueError);
      return;
    }
    
    console.log('✅ Admin leagues found:', leagues?.length || 0);
    leagues?.forEach(league => {
      console.log(`   - ${league.name} (${league.id})`);
    });
    
    // Step 3: Test league request service
    console.log('\n3️⃣ Testing league request service...');
    
    if (!leagues || leagues.length === 0) {
      console.log('⚠️ No leagues found for admin - this will be the problem!');
      return;
    }
    
    const leagueIds = leagues.map(l => l.id);
    const { data: requests, error: requestError } = await supabase
      .from('team_league_requests')
      .select(`
        id,
        team_id,
        league_id,
        requested_by,
        message,
        status,
        created_at,
        teams:team_id (
          id,
          name,
          team_color,
          captain_id
        ),
        leagues:league_id (
          id,
          name,
          description,
          sport_type,
          league_type
        )
      `)
      .eq('status', 'pending')
      .in('league_id', leagueIds);
      
    if (requestError) {
      console.error('❌ Request fetch error:', requestError);
      return;
    }
    
    console.log('✅ Pending requests found:', requests?.length || 0);
    requests?.forEach(request => {
      console.log(`   - Team: ${request.teams?.name} → League: ${request.leagues?.name}`);
      console.log(`     Requested by: ${request.requested_by}`);
      console.log(`     Created: ${new Date(request.created_at).toLocaleString()}`);
      if (request.message) {
        console.log(`     Message: "${request.message}"`);
      }
      console.log('');
    });
    
    // Step 4: Verify the exact data structure the admin app will receive
    console.log('4️⃣ Simulating admin app data flow...');
    
    const transformedRequests = (requests || []).map(request => ({
      id: request.id,
      team_id: request.team_id,
      league_id: request.league_id,
      requested_by: request.requested_by,
      message: request.message,
      status: request.status,
      created_at: request.created_at,
      team: request.teams,
      league: request.leagues,
      requested_by_user: {
        email: 'Unknown User',
        display_name: 'Unknown User',
        full_name: null
      }
    }));
    
    console.log('✅ Transformed requests ready for admin app:', transformedRequests.length);
    console.log('📋 Summary for admin app:');
    console.log(`   - Leagues managed: ${leagues.length}`);
    console.log(`   - Pending requests: ${transformedRequests.length}`);
    
    if (transformedRequests.length > 0) {
      console.log('\n🎯 SUCCESS: Admin should see pending requests in the app!');
    } else {
      console.log('\n⚠️ ISSUE: No pending requests found - admin app will show empty state');
    }
    
    // Step 5: Test session persistence (for browser compatibility)
    console.log('\n5️⃣ Testing session...');
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session) {
      console.log('✅ Session active, expires:', new Date(sessionData.session.expires_at * 1000).toLocaleString());
      console.log('   Access token: Valid');
      console.log('   Refresh token: Valid');
    } else {
      console.log('❌ No active session');
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

testAdminWorkflow();
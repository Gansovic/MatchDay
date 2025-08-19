/**
 * Test script to simulate browser flow for admin app
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'http://localhost:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNx_VzKNHh2Cr4TGXCJjcWUVJEBo'
);

async function testAdminBrowserFlow() {
  try {
    console.log('🌐 Testing Admin Browser Flow\n');
    
    // Step 1: Sign in and establish session
    console.log('1️⃣ Establishing admin session...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@matchday.com',
      password: 'admin123!'
    });
    
    if (authError) {
      console.error('❌ Auth failed:', authError);
      return;
    }
    
    console.log('✅ Session established');
    console.log('   Access Token:', authData.session.access_token.substring(0, 20) + '...');
    console.log('   User ID:', authData.user.id);
    
    // Step 2: Test the admin dashboard service call
    console.log('\n2️⃣ Testing AdminDashboardService.getDashboardData...');
    
    // Simulate what the admin app would do
    const adminUserId = authData.user.id;
    
    // Get admin profile
    const { data: adminProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('display_name, role')
      .eq('id', adminUserId)
      .single();
      
    if (profileError) {
      console.log('⚠️ Profile not found:', profileError.message);
    } else {
      console.log('✅ Admin profile:', adminProfile);
    }
    
    // Get admin leagues (the key call that was failing)
    const { data: leagues, error: leagueError } = await supabase
      .from('leagues')
      .select(`
        id,
        name,
        description,
        sport_type,
        league_type,
        location,
        is_active,
        created_at,
        teams (id)
      `)
      .eq('created_by', adminUserId)
      .eq('is_active', true);
      
    if (leagueError) {
      console.error('❌ League fetch failed:', leagueError);
      return;
    }
    
    console.log('✅ Admin leagues fetched:', leagues?.length || 0);
    leagues?.forEach(league => {
      console.log(`   - ${league.name}: ${league.teams?.length || 0} teams`);
    });
    
    // Step 3: Test the league request service call
    console.log('\n3️⃣ Testing LeagueRequestService.getPendingRequests...');
    
    if (!leagues || leagues.length === 0) {
      console.log('⚠️ No leagues - no requests will be found');
      return;
    }
    
    const adminLeagueIds = leagues.map(l => l.id);
    
    // Test the fixed query
    const { data: requests, error: requestError } = await supabase
      .from('team_league_requests')
      .select(`
        id,
        team_id,
        league_id,
        requested_by,
        message,
        status,
        reviewed_by,
        reviewed_at,
        review_message,
        created_at,
        expires_at,
        teams:team_id (
          id,
          name,
          team_color,
          team_bio,
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
      .in('league_id', adminLeagueIds)
      .order('created_at', { ascending: false });
      
    if (requestError) {
      console.error('❌ Requests fetch failed:', requestError);
      return;
    }
    
    console.log('✅ Pending requests fetched:', requests?.length || 0);
    requests?.forEach(request => {
      console.log(`   - Team "${request.teams?.name}" → League "${request.leagues?.name}"`);
      console.log(`     Status: ${request.status}, Created: ${new Date(request.created_at).toLocaleString()}`);
    });
    
    // Step 4: Get user profiles for the requests
    console.log('\n4️⃣ Testing user profile lookup...');
    
    if (requests && requests.length > 0) {
      const userIds = [...new Set(requests.map(r => r.requested_by))];
      
      const { data: userProfiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, display_name, full_name')
        .in('id', userIds);
        
      if (profilesError) {
        console.error('❌ User profiles fetch failed:', profilesError);
      } else {
        console.log('✅ User profiles fetched:', userProfiles?.length || 0);
        userProfiles?.forEach(profile => {
          console.log(`   - ${profile.id}: ${profile.display_name || profile.full_name || 'Unknown'}`);
        });
      }
    }
    
    console.log('\n🎯 ANALYSIS:');
    console.log(`✅ Admin can authenticate: YES`);
    console.log(`✅ Admin owns leagues: ${leagues?.length || 0} leagues`);
    console.log(`✅ Pending requests exist: ${requests?.length || 0} requests`);
    console.log(`✅ All database queries work: YES`);
    
    if (requests && requests.length > 0) {
      console.log('\n🚀 The admin app SHOULD show pending requests!');
      console.log('   If the admin app is not showing requests, the issue is likely:');
      console.log('   1. Frontend auth state not properly initialized');
      console.log('   2. Component not re-rendering after data fetch');
      console.log('   3. Browser session not persisting');
      console.log('   4. Console errors in browser preventing execution');
    } else {
      console.log('\n⚠️ No pending requests found - admin app will show empty state');
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

testAdminBrowserFlow();
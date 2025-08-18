/**
 * Debug script to test admin login and check database access
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'http://localhost:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNx_VzKNHh2Cr4TGXCJjcWUVJEBo'
);

async function testAdminLogin() {
  try {
    console.log('🔐 Attempting to sign in as admin...');
    
    // Sign in as admin
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@matchday.com',
      password: 'admin123!'
    });
    
    if (authError) {
      console.error('❌ Auth error:', authError);
      return;
    }
    
    console.log('✅ Signed in successfully');
    console.log('User ID:', authData.user.id);
    console.log('User email:', authData.user.email);
    
    // Wait a moment for session to be established
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test accessing leagues
    console.log('\n🏆 Testing league access...');
    const { data: leagues, error: leagueError } = await supabase
      .from('leagues')
      .select('id, name, created_by');
      
    if (leagueError) {
      console.error('❌ League access error:', leagueError);
    } else {
      console.log('✅ Leagues accessible:', leagues);
    }
    
    // Test accessing team league requests
    console.log('\n📋 Testing team league requests access...');
    const { data: requests, error: reqError } = await supabase
      .from('team_league_requests')
      .select('*');
      
    if (reqError) {
      console.error('❌ Requests access error:', reqError);
    } else {
      console.log('✅ Requests accessible:', requests);
    }
    
    // Test the specific query from the league request service
    console.log('\n🔍 Testing specific admin query...');
    const { data: adminLeagues, error: adminError } = await supabase
      .from('leagues')
      .select('id, name, created_by')
      .eq('created_by', authData.user.id);
      
    if (adminError) {
      console.error('❌ Admin leagues error:', adminError);
    } else {
      console.log('✅ Admin leagues:', adminLeagues);
    }
    
    // Test the request query with subquery - fix the syntax
    console.log('\n📑 Testing request query with manual league IDs...');
    const adminLeagueIds = adminLeagues.map(l => l.id);
    console.log('Admin league IDs:', adminLeagueIds);
    
    const { data: filteredRequests, error: filterError } = await supabase
      .from('team_league_requests')
      .select('*')
      .eq('status', 'pending')
      .in('league_id', adminLeagueIds);
      
    if (filterError) {
      console.error('❌ Filtered requests error:', filterError);
    } else {
      console.log('✅ Filtered requests:', filteredRequests);
    }
    
    // Test if admin can see ALL requests (in case ownership is wrong)
    console.log('\n🌐 Testing ALL requests access...');
    const { data: allRequests, error: allError } = await supabase
      .from('team_league_requests')
      .select('*');
      
    if (allError) {
      console.error('❌ All requests error:', allError);
    } else {
      console.log('✅ All requests count:', allRequests?.length);
      allRequests?.forEach(req => {
        console.log('  - Request:', req.id, 'Team:', req.team_id, 'League:', req.league_id, 'Status:', req.status);
      });
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

testAdminLogin();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://localhost:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

async function testTeamCreation() {
  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Sign in as admin user
    console.log('Signing in as admin...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@matchday.com',
      password: 'password123'
    });
    
    if (authError) {
      console.error('Authentication error:', authError);
      return;
    }
    
    console.log('Successfully authenticated as:', authData.user.email);
    console.log('User ID:', authData.user.id);
    
    // Get the session token
    const session = authData.session;
    if (!session?.access_token) {
      console.error('No access token found');
      return;
    }
    
    // Test 1: Create team in League1
    console.log('\n--- Testing team creation in League1 ---');
    const team1Data = {
      name: 'Test Team League1',
      league: 'League1',
      description: 'A test team for League1',
      maxMembers: 22,
      color: '#FF5733'
    };
    
    const response1 = await fetch('http://localhost:3001/api/teams', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify(team1Data)
    });
    
    const result1 = await response1.json();
    console.log('League1 Response Status:', response1.status);
    console.log('League1 Response:', JSON.stringify(result1, null, 2));
    
    // Test 2: Create team in LaLiga
    console.log('\n--- Testing team creation in LaLiga ---');
    const team2Data = {
      name: 'Test Team LaLiga',
      league: 'LaLiga',
      description: 'A test team for LaLiga',
      maxMembers: 22,
      color: '#3366FF'
    };
    
    const response2 = await fetch('http://localhost:3001/api/teams', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify(team2Data)
    });
    
    const result2 = await response2.json();
    console.log('LaLiga Response Status:', response2.status);
    console.log('LaLiga Response:', JSON.stringify(result2, null, 2));
    
    // Test 3: Get user's teams
    console.log('\n--- Testing get user teams ---');
    const teamsResponse = await fetch('http://localhost:3001/api/teams', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });
    
    const teamsResult = await teamsResponse.json();
    console.log('Get Teams Response Status:', teamsResponse.status);
    console.log('Get Teams Response:', JSON.stringify(teamsResult, null, 2));
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testTeamCreation();
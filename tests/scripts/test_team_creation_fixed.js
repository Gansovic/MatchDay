const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://localhost:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

async function testTeamCreationFixed() {
  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // First, let's create a new test user
    console.log('Creating a new test user...');
    const testEmail = `testuser_${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test User',
          role: 'player'
        }
      }
    });
    
    if (signUpError) {
      console.error('Sign up error:', signUpError);
      return;
    }
    
    console.log('Successfully created user:', signUpData.user.email);
    console.log('User ID:', signUpData.user.id);
    
    // Get the session token
    const session = signUpData.session;
    if (!session?.access_token) {
      console.error('No access token found');
      return;
    }
    
    // Wait a moment for the trigger to create the user profile
    console.log('Waiting for user profile creation...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verify user exists in public.users table
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', signUpData.user.id)
      .single();
    
    if (profileError) {
      console.error('Profile lookup error:', profileError);
      console.log('User may not exist in public.users table yet');
    } else {
      console.log('User profile found:', userProfile);
    }
    
    // Test 1: Create team in League1
    console.log('\n--- Testing team creation in League1 ---');
    const team1Data = {
      name: `Test Team ${Date.now()}`,
      league: 'League1',
      description: 'A test team for League1',
      maxMembers: 22,
      color: '#FF5733'
    };
    
    const response1 = await fetch('http://localhost:3000/api/teams', {
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
    
    if (response1.ok && result1.data) {
      console.log('\n✅ Team created successfully!');
      console.log('Team ID:', result1.data.id);
      console.log('Team Name:', result1.data.name);
      console.log('Captain ID:', result1.data.captain_id);
      
      // Verify team members
      const { data: members, error: membersError } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', result1.data.id);
      
      if (!membersError) {
        console.log('Team members:', members);
      }
    } else {
      console.log('\n❌ Team creation failed');
    }
    
    // Test 2: Get user's teams
    console.log('\n--- Testing get user teams ---');
    const teamsResponse = await fetch('http://localhost:3000/api/teams', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });
    
    const teamsResult = await teamsResponse.json();
    console.log('Get Teams Response Status:', teamsResponse.status);
    console.log('Number of teams:', teamsResult.data?.length || 0);
    
    // Clean up - sign out
    await supabase.auth.signOut();
    console.log('\n✅ Test completed successfully');
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testTeamCreationFixed();
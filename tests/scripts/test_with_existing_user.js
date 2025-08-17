const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://localhost:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

async function testWithExistingUser() {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    console.log('Signing in as admin user...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@matchday.com',
      password: 'password123'
    });
    
    if (authError) {
      console.error('Authentication error:', authError);
      return;
    }
    
    console.log('Successfully authenticated as:', authData.user.email);
    console.log('Auth User ID:', authData.user.id);
    
    // Check if this user exists in public.users
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id);
    
    console.log('Profile lookup result:');
    console.log('Error:', profileError);
    console.log('Data:', userProfile);
    
    // If user doesn't exist, manually insert
    if (!userProfile || userProfile.length === 0) {
      console.log('Creating user profile manually...');
      const { data: insertData, error: insertError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: authData.user.email,
          full_name: 'Admin User',
          role: 'admin'
        })
        .select();
      
      console.log('Insert result:');
      console.log('Error:', insertError);
      console.log('Data:', insertData);
    }
    
    // Now test team creation
    const session = authData.session;
    if (!session?.access_token) {
      console.error('No access token found');
      return;
    }
    
    console.log('\n--- Testing team creation ---');
    const teamData = {
      name: `Test Team ${Date.now()}`,
      league: 'League1',
      description: 'A test team',
      maxMembers: 22,
      color: '#FF5733'
    };
    
    const response = await fetch('http://localhost:3000/api/teams', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify(teamData)
    });
    
    const result = await response.json();
    console.log('Response Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testWithExistingUser();
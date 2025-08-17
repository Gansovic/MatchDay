const { createClient } = require('@supabase/supabase-js');

// Use service role key for admin access to bypass auth issues
const supabaseUrl = 'http://localhost:54321';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

async function testTeamServiceDirectly() {
  console.log('Testing Team Service directly with database...');
  
  try {
    // Create client with service role for admin access
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    console.log('✓ Supabase client created');
    
    // Test 1: Check if leagues exist
    console.log('\n--- Testing league queries ---');
    const { data: leagues, error: leagueError } = await supabase
      .from('leagues')
      .select('id, name, sport_type, is_active')
      .eq('is_active', true);
    
    if (leagueError) {
      console.error('League query error:', leagueError);
      return;
    }
    
    console.log('Available leagues:', leagues);
    
    // Test 2: Check if admin user profile exists
    console.log('\n--- Testing user profile ---');
    const adminUserId = '14dc794d-a769-4b96-8a79-5c05484f493e';
    const { data: userProfile, error: userError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', adminUserId)
      .single();
    
    if (userError) {
      console.error('User profile error:', userError);
      // Try to create a user profile
      console.log('Creating admin user profile...');
      const { data: newProfile, error: createError } = await supabase
        .from('user_profiles')
        .insert({
          id: adminUserId,
          full_name: 'Admin User',
          display_name: 'Admin',
          bio: 'Test admin user'
        })
        .select()
        .single();
      
      if (createError) {
        console.error('Failed to create user profile:', createError);
        return;
      }
      console.log('✓ User profile created:', newProfile);
    } else {
      console.log('✓ User profile exists:', userProfile);
    }
    
    // Test 3: Find League1 by name
    console.log('\n--- Testing league lookup ---');
    const { data: league1, error: league1Error } = await supabase
      .from('leagues')
      .select('*')
      .eq('sport_type', 'football')
      .eq('name', 'League1')
      .eq('is_active', true)
      .eq('is_public', true)
      .single();
    
    if (league1Error) {
      console.error('League1 lookup error:', league1Error);
      return;
    }
    console.log('✓ League1 found:', league1);
    
    // Test 4: Create a test team in League1
    console.log('\n--- Testing team creation ---');
    const teamData = {
      league_id: league1.id,
      name: 'Test Team Direct',
      team_color: '#FF5733',
      captain_id: adminUserId,
      max_players: 22,
      min_players: 7,
      is_recruiting: true,
      team_bio: 'Test team created directly'
    };
    
    const { data: newTeam, error: teamError } = await supabase
      .from('teams')
      .insert(teamData)
      .select()
      .single();
    
    if (teamError) {
      console.error('Team creation error:', teamError);
      return;
    }
    console.log('✓ Team created:', newTeam);
    
    // Test 5: Add admin as team member
    console.log('\n--- Testing team member creation ---');
    const { data: teamMember, error: memberError } = await supabase
      .from('team_members')
      .insert({
        team_id: newTeam.id,
        user_id: adminUserId,
        position: 'midfielder',
        jersey_number: 10,
        is_active: true,
        is_starter: true
      })
      .select()
      .single();
    
    if (memberError) {
      console.error('Team member creation error:', memberError);
      return;
    }
    console.log('✓ Team member added:', teamMember);
    
    // Test 6: Query the complete team with details
    console.log('\n--- Testing team details query ---');
    const { data: teamDetails, error: detailsError } = await supabase
      .from('teams')
      .select(`
        *,
        league:leagues!inner(*),
        team_members(
          *,
          user_profile:user_profiles!inner(*)
        )
      `)
      .eq('id', newTeam.id)
      .single();
    
    if (detailsError) {
      console.error('Team details query error:', detailsError);
      return;
    }
    console.log('✓ Team with details:', JSON.stringify(teamDetails, null, 2));
    
    console.log('\n🎉 All tests passed! Team creation workflow is working properly.');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testTeamServiceDirectly();
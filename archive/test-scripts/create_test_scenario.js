/**
 * Create Test Scenario for Phase 1 Testing
 * 
 * This script creates the necessary test data to test the team league request workflow:
 * - Ensures test player user exists
 * - Creates a test team owned by the player (not in any league)
 * - Verifies admin user and leagues exist
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, serviceKey);

async function createTestScenario() {
  console.log('🚀 Creating test scenario for Phase 1 testing...\\n');

  try {
    // 1. Verify admin user exists
    console.log('1️⃣ Verifying admin user...');
    const { data: adminAuth, error: adminAuthError } = await supabase.auth.admin.listUsers();
    
    if (adminAuthError) {
      console.error('❌ Error fetching users:', adminAuthError);
      return;
    }

    const adminUser = adminAuth.users.find(u => u.email === 'admin@matchday.com');
    if (!adminUser) {
      console.error('❌ Admin user not found. Please run create_simple_admin.js first');
      return;
    }
    console.log('✅ Admin user found:', adminUser.email, `(${adminUser.id})`);

    // 2. Verify player user exists
    console.log('\\n2️⃣ Verifying player user...');
    const playerUser = adminAuth.users.find(u => u.email === 'player@matchday.com');
    if (!playerUser) {
      console.log('⚠️  Player user not found. Creating player user...');
      
      const { data: newPlayerAuth, error: createPlayerError } = await supabase.auth.admin.createUser({
        email: 'player@matchday.com',
        password: 'player123!',
        email_confirm: true,
        user_metadata: {
          full_name: 'Test Player',
          display_name: 'Test Player'
        }
      });

      if (createPlayerError) {
        console.error('❌ Error creating player user:', createPlayerError);
        return;
      }

      console.log('✅ Player user created:', newPlayerAuth.user.email);

      // Create player profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          id: newPlayerAuth.user.id,
          full_name: 'Test Player',
          display_name: 'Test Player',
          role: 'player',
          preferred_position: 'Forward'
        });

      if (profileError) {
        console.error('❌ Error creating player profile:', profileError);
        return;
      }
      console.log('✅ Player profile created');
    } else {
      console.log('✅ Player user found:', playerUser.email, `(${playerUser.id})`);
    }

    // Get the final player user (either existing or newly created)
    const { data: finalAdminAuth, error: finalAuthError } = await supabase.auth.admin.listUsers();
    if (finalAuthError) {
      console.error('❌ Error re-fetching users:', finalAuthError);
      return;
    }
    
    const finalPlayerUser = finalAdminAuth.users.find(u => u.email === 'player@matchday.com');
    if (!finalPlayerUser) {
      console.error('❌ Could not find player user after creation');
      return;
    }

    // 3. Check admin's leagues
    console.log('\\n3️⃣ Checking admin leagues...');
    const { data: adminLeagues, error: leaguesError } = await supabase
      .from('leagues')
      .select('*')
      .eq('created_by', adminUser.id);

    if (leaguesError) {
      console.error('❌ Error fetching admin leagues:', leaguesError);
      return;
    }

    if (adminLeagues.length === 0) {
      console.error('❌ Admin has no leagues. Please run assign-leagues-to-admin.js first');
      return;
    }

    console.log(`✅ Admin manages ${adminLeagues.length} leagues:`);
    adminLeagues.forEach(league => {
      console.log(`   - ${league.name} (${league.sport_type}, ${league.location || 'No location'})`);
    });

    // 4. Create test team for player (not in any league)
    console.log('\\n4️⃣ Creating test team for player...');
    
    // First, check if test team already exists
    const { data: existingTeams, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .ilike('name', 'Test Thunder FC');

    if (teamsError) {
      console.error('❌ Error checking existing teams:', teamsError);
      return;
    }

    let testTeam;
    if (existingTeams.length > 0) {
      testTeam = existingTeams[0];
      console.log('✅ Test team already exists:', testTeam.name);
      
      // Update the captain to be our player user
      const { error: updateCaptainError } = await supabase
        .from('teams')
        .update({ 
          captain_id: finalPlayerUser.id,
          league_id: null // Ensure not in any league
        })
        .eq('id', testTeam.id);

      if (updateCaptainError) {
        console.error('❌ Error updating team captain:', updateCaptainError);
        return;
      }
      console.log('✅ Updated team captain and removed from any league');
    } else {
      // Try to use the database function to create team safely
      console.log('Creating test team using database function...');
      const { data: functionResult, error: functionError } = await supabase
        .rpc('create_team_deferred', {
          p_team_name: 'Test Thunder FC',
          p_league_id: null,
          p_captain_id: finalPlayerUser.id,
          p_team_color: '#1E40AF',
          p_team_bio: 'Test team for Phase 1 league request testing',
          p_max_players: 15,
          p_min_players: 8
        });

      if (functionError) {
        console.log('⚠️  Database function not available, trying direct insert...');
        
        // Fallback: Create team without captain first, then update
        const { data: newTeam, error: createTeamError } = await supabase
          .from('teams')
          .insert({
            name: 'Test Thunder FC',
            captain_id: null, // Start without captain
            team_color: '#1E40AF',
            team_bio: 'Test team for Phase 1 league request testing',
            max_players: 15,
            min_players: 8,
            is_recruiting: true,
            league_id: null
          })
          .select()
          .single();

        if (createTeamError) {
          console.error('❌ Error creating test team:', createTeamError);
          return;
        }

        testTeam = newTeam;
        console.log('✅ Test team created (without captain):', testTeam.name);

        // Add player as team member first
        const { error: memberError } = await supabase
          .from('team_members')
          .insert({
            team_id: testTeam.id,
            user_id: finalPlayerUser.id,
            position: 'Forward',
            jersey_number: 10,
            is_active: true
          });

        if (memberError) {
          console.error('❌ Error adding player to team:', memberError);
          return;
        }
        console.log('✅ Player added as team member');

        // Now update team to set captain
        const { error: updateCaptainError } = await supabase
          .from('teams')
          .update({ captain_id: finalPlayerUser.id })
          .eq('id', testTeam.id);

        if (updateCaptainError) {
          console.error('❌ Error setting team captain:', updateCaptainError);
          return;
        }
        console.log('✅ Team captain set');

      } else if (functionResult && functionResult[0]?.success) {
        // Function worked
        const teamId = functionResult[0].team_id;
        const { data: createdTeam, error: fetchError } = await supabase
          .from('teams')
          .select('*')
          .eq('id', teamId)
          .single();

        if (fetchError) {
          console.error('❌ Error fetching created team:', fetchError);
          return;
        }

        testTeam = createdTeam;
        console.log('✅ Test team created via function:', testTeam.name);
      } else {
        console.error('❌ Team creation function failed:', functionResult?.[0]?.error_message);
        return;
      }
    }

    // 5. Clean up any existing test requests
    console.log('\\n5️⃣ Cleaning up existing test requests...');
    const { error: deleteError } = await supabase
      .from('team_league_requests')
      .delete()
      .eq('team_id', testTeam.id);

    if (deleteError) {
      console.error('❌ Error cleaning up old requests:', deleteError);
      return;
    }
    console.log('✅ Cleaned up any existing test requests');

    // 6. Summary
    console.log('\\n🎯 Test Scenario Ready!');
    console.log('=====================================');
    console.log('👤 Admin User:', adminUser.email);
    console.log('🏆 Admin Leagues:', adminLeagues.map(l => l.name).join(', '));
    console.log('👤 Player User:', finalPlayerUser.email);
    console.log('⚽ Test Team:', testTeam.name, '(NOT in any league)');
    console.log('\\n📋 Testing Steps:');
    console.log('1. Login to player app as: player@matchday.com / player123!');
    console.log('2. Go to league discovery and request to join one of the admin leagues');
    console.log('3. Login to admin app as: admin@matchday.com / admin123!');
    console.log('4. Check dashboard for pending requests and approve/reject');
    console.log('\\n🔧 Verification Scripts:');
    console.log('- Run "node verify_test_scenario.js" to check current state');
    console.log('- Run "node reset_test_scenario.js" to reset for another test');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

createTestScenario();
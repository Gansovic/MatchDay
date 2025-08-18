#!/usr/bin/env node

/**
 * Script to verify that the admin user can access and manage all leagues
 * This tests the actual application logic to ensure everything is properly configured
 * 
 * Usage: node scripts/verify-admin-league-access.js
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase connection details for local development
const SUPABASE_URL = 'http://localhost:54321';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

// Admin credentials
const ADMIN_EMAIL = 'admin@matchday.com';
const ADMIN_PASSWORD = 'admin123!';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function verifyAdminAccess() {
  console.log('🔍 Verifying admin league access...\n');
  
  try {
    // Step 1: Sign in as admin
    console.log('1️⃣ Signing in as admin...');
    const { data: session, error: loginError } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    
    if (loginError) {
      console.error('❌ Login failed:', loginError.message);
      return;
    }
    
    console.log('✅ Admin logged in successfully');
    console.log(`   User ID: ${session.user.id}`);
    console.log(`   Email: ${session.user.email}`);
    
    // Step 2: Get admin profile
    console.log('\n2️⃣ Fetching admin profile...');
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Error fetching profile:', profileError.message);
      return;
    }
    
    console.log('✅ Admin profile:');
    console.log(`   Display Name: ${profile.display_name}`);
    console.log(`   Role: ${profile.role}`);
    console.log(`   Location: ${profile.location || 'Not set'}`);
    
    // Step 3: Query leagues owned by admin
    console.log('\n3️⃣ Fetching leagues owned by admin...');
    const { data: ownedLeagues, error: ownedError, count: ownedCount } = await supabase
      .from('leagues')
      .select('*', { count: 'exact' })
      .eq('created_by', session.user.id)
      .order('created_at', { ascending: false });
    
    if (ownedError) {
      console.error('❌ Error fetching owned leagues:', ownedError.message);
      return;
    }
    
    console.log(`✅ Admin owns ${ownedCount} league(s):`);
    if (ownedLeagues && ownedLeagues.length > 0) {
      ownedLeagues.forEach(league => {
        console.log(`\n   📍 ${league.name}`);
        console.log(`      - ID: ${league.id}`);
        console.log(`      - Type: ${league.sport_type} / ${league.league_type}`);
        console.log(`      - Location: ${league.location || 'Not specified'}`);
        console.log(`      - Active: ${league.is_active ? 'Yes' : 'No'}`);
        console.log(`      - Public: ${league.is_public ? 'Yes' : 'No'}`);
        console.log(`      - Max Teams: ${league.max_teams || 'Unlimited'}`);
        console.log(`      - Entry Fee: ${league.entry_fee ? `$${league.entry_fee}` : 'Free'}`);
      });
    }
    
    // Step 4: Test league management capabilities
    console.log('\n4️⃣ Testing league management capabilities...');
    
    // Test read access to all leagues (admin should see all)
    const { data: allLeagues, count: totalCount } = await supabase
      .from('leagues')
      .select('*', { count: 'exact' });
    
    console.log(`✅ Total leagues in database: ${totalCount}`);
    console.log(`   Admin can manage: ${ownedCount} league(s)`);
    
    // Test update capability on one league
    if (ownedLeagues && ownedLeagues.length > 0) {
      const testLeague = ownedLeagues[0];
      console.log(`\n5️⃣ Testing update capability on "${testLeague.name}"...`);
      
      const originalDescription = testLeague.description;
      const testDescription = `[Admin Test ${new Date().toISOString()}] ${originalDescription || 'Test description'}`;
      
      const { error: updateError } = await supabase
        .from('leagues')
        .update({ 
          description: testDescription,
          updated_at: new Date().toISOString()
        })
        .eq('id', testLeague.id)
        .eq('created_by', session.user.id); // Ensure admin owns it
      
      if (updateError) {
        console.error('❌ Update failed:', updateError.message);
      } else {
        console.log('✅ Successfully updated league description');
        
        // Restore original description
        await supabase
          .from('leagues')
          .update({ 
            description: originalDescription,
            updated_at: new Date().toISOString()
          })
          .eq('id', testLeague.id);
        console.log('   (Description restored to original)');
      }
    }
    
    // Step 5: Check teams in admin's leagues
    console.log('\n6️⃣ Checking teams in admin\'s leagues...');
    if (ownedLeagues && ownedLeagues.length > 0) {
      for (const league of ownedLeagues) {
        const { data: teams, error: teamsError } = await supabase
          .from('teams')
          .select('id, name, captain_id, max_players')
          .eq('league_id', league.id);
        
        if (!teamsError && teams) {
          console.log(`\n   League: ${league.name}`);
          console.log(`   Teams: ${teams.length}`);
          if (teams.length > 0) {
            teams.forEach(team => {
              console.log(`      - ${team.name} (Max players: ${team.max_players || 11})`);
            });
          }
        }
      }
    }
    
    // Step 6: Check for any leagues without owners
    console.log('\n7️⃣ Checking for unassigned leagues...');
    const { data: unassignedLeagues, error: unassignedError } = await supabase
      .from('leagues')
      .select('id, name')
      .is('created_by', null);
    
    if (!unassignedError) {
      if (unassignedLeagues && unassignedLeagues.length > 0) {
        console.warn(`⚠️  Found ${unassignedLeagues.length} league(s) without owners:`);
        unassignedLeagues.forEach(league => {
          console.log(`   - ${league.name} (ID: ${league.id})`);
        });
        console.log('   Run assign-leagues-to-admin.js to fix this.');
      } else {
        console.log('✅ All leagues have owners assigned');
      }
    }
    
    // Sign out
    await supabase.auth.signOut();
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ VERIFICATION COMPLETE');
    console.log('='.repeat(60));
    console.log(`Admin Email: ${ADMIN_EMAIL}`);
    console.log(`Admin ID: ${session.user.id}`);
    console.log(`Role: ${profile.role}`);
    console.log(`Leagues Owned: ${ownedCount}`);
    console.log(`Total Leagues: ${totalCount}`);
    console.log('='.repeat(60));
    
    if (ownedCount === totalCount) {
      console.log('\n🎉 SUCCESS: Admin has access to ALL leagues!');
    } else if (ownedCount > 0) {
      console.log(`\n⚠️  Admin owns ${ownedCount} out of ${totalCount} leagues.`);
      console.log('   Run assign-leagues-to-admin.js to assign remaining leagues.');
    } else {
      console.log('\n❌ Admin does not own any leagues!');
      console.log('   Run assign-leagues-to-admin.js to fix this.');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the verification
verifyAdminAccess();
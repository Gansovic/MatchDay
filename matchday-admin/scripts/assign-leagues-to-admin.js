#!/usr/bin/env node

/**
 * Script to assign all existing leagues to the admin user
 * This will update the created_by field for all leagues to the admin user's ID
 * 
 * Usage: node scripts/assign-leagues-to-admin.js
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase connection details for local development
const SUPABASE_URL = 'http://localhost:54321';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

// Admin user email
const ADMIN_EMAIL = 'admin@matchday.com';

// Create Supabase client with service role (admin) privileges
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function assignLeaguesToAdmin() {
  console.log('🏆 Assigning all leagues to admin user...\n');
  
  try {
    // Step 1: Find the admin user
    console.log('1️⃣ Finding admin user...');
    const { data: adminUsers, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('❌ Error fetching users:', userError.message);
      return;
    }
    
    const adminUser = adminUsers?.users?.find(u => u.email === ADMIN_EMAIL);
    
    if (!adminUser) {
      console.error(`❌ Admin user with email ${ADMIN_EMAIL} not found!`);
      console.log('   Please ensure the admin user exists first.');
      return;
    }
    
    console.log(`✅ Found admin user:`);
    console.log(`   ID: ${adminUser.id}`);
    console.log(`   Email: ${adminUser.email}`);
    
    // Step 2: Verify admin has league_admin role in profile
    console.log('\n2️⃣ Verifying admin profile...');
    const { data: adminProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', adminUser.id)
      .single();
    
    if (profileError) {
      console.error('❌ Error fetching admin profile:', profileError.message);
      return;
    }
    
    if (!adminProfile) {
      console.error('❌ Admin profile not found!');
      return;
    }
    
    console.log('✅ Admin profile found:');
    console.log(`   Display Name: ${adminProfile.display_name || 'N/A'}`);
    console.log(`   Role: ${adminProfile.role}`);
    
    if (adminProfile.role !== 'league_admin' && adminProfile.role !== 'app_admin') {
      console.warn('⚠️  Warning: Admin user does not have league_admin or app_admin role!');
      console.log('   Current role:', adminProfile.role);
      console.log('   Updating role to league_admin...');
      
      const { error: updateRoleError } = await supabase
        .from('user_profiles')
        .update({ role: 'league_admin' })
        .eq('id', adminUser.id);
      
      if (updateRoleError) {
        console.error('❌ Error updating admin role:', updateRoleError.message);
        return;
      }
      console.log('✅ Admin role updated to league_admin');
    }
    
    // Step 3: Get all existing leagues
    console.log('\n3️⃣ Fetching all leagues...');
    const { data: leagues, error: leaguesError } = await supabase
      .from('leagues')
      .select('id, name, created_by, sport_type, league_type, location');
    
    if (leaguesError) {
      console.error('❌ Error fetching leagues:', leaguesError.message);
      return;
    }
    
    if (!leagues || leagues.length === 0) {
      console.log('ℹ️  No leagues found in the database.');
      return;
    }
    
    console.log(`✅ Found ${leagues.length} league(s):`);
    leagues.forEach(league => {
      console.log(`   - ${league.name} (${league.sport_type}, ${league.league_type})`);
      console.log(`     Current owner: ${league.created_by || 'None'}`);
    });
    
    // Step 4: Count leagues that need updating
    const leaguesToUpdate = leagues.filter(league => league.created_by !== adminUser.id);
    
    if (leaguesToUpdate.length === 0) {
      console.log('\n✅ All leagues are already assigned to the admin user!');
      return;
    }
    
    console.log(`\n4️⃣ Updating ${leaguesToUpdate.length} league(s) to assign to admin...`);
    
    // Step 5: Update all leagues to be owned by admin
    const { error: updateError } = await supabase
      .from('leagues')
      .update({ 
        created_by: adminUser.id,
        updated_at: new Date().toISOString()
      })
      .in('id', leaguesToUpdate.map(l => l.id));
    
    if (updateError) {
      console.error('❌ Error updating leagues:', updateError.message);
      return;
    }
    
    console.log(`✅ Successfully updated ${leaguesToUpdate.length} league(s)!`);
    
    // Step 6: Verify the update
    console.log('\n5️⃣ Verifying updates...');
    const { data: updatedLeagues, error: verifyError } = await supabase
      .from('leagues')
      .select('id, name, created_by')
      .eq('created_by', adminUser.id);
    
    if (verifyError) {
      console.error('❌ Error verifying updates:', verifyError.message);
      return;
    }
    
    console.log(`✅ Verification complete:`);
    console.log(`   Admin now owns ${updatedLeagues?.length || 0} league(s)`);
    
    // Step 7: Test that admin can query their leagues
    console.log('\n6️⃣ Testing admin access to leagues...');
    const { data: session, error: loginError } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: 'admin123!' // Using the default password from your setup
    });
    
    if (loginError) {
      console.warn('⚠️  Could not test login (password may be different):', loginError.message);
    } else {
      console.log('✅ Admin login successful!');
      
      // Query leagues as the admin user
      const { data: adminLeagues, error: queryError } = await supabase
        .from('leagues')
        .select('*')
        .eq('created_by', session.user.id);
      
      if (queryError) {
        console.error('❌ Error querying leagues as admin:', queryError.message);
      } else {
        console.log(`✅ Admin can access ${adminLeagues?.length || 0} league(s)`);
      }
      
      // Sign out
      await supabase.auth.signOut();
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 ASSIGNMENT COMPLETE!');
    console.log('='.repeat(60));
    console.log(`✅ Admin user: ${ADMIN_EMAIL}`);
    console.log(`✅ Admin ID: ${adminUser.id}`);
    console.log(`✅ Total leagues assigned: ${updatedLeagues?.length || 0}`);
    console.log('='.repeat(60));
    console.log('\nThe admin can now manage all leagues through the admin portal!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
assignLeaguesToAdmin();
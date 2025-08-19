/**
 * Test Admin Portal Login
 * Quick test to verify admin credentials work with the admin portal
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://localhost:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAdminPortalLogin() {
  console.log('🔐 Testing Admin Portal Login...\n');
  
  try {
    // Test login
    console.log('1️⃣ Attempting login with admin credentials...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@matchday.com',
      password: 'AdminMatch2025!'
    });

    if (authError) {
      console.error('❌ Login failed:', authError.message);
      return;
    }

    if (!authData.user) {
      console.error('❌ No user data returned');
      return;
    }

    console.log('✅ Login successful!');
    console.log(`   User ID: ${authData.user.id}`);
    console.log(`   Email: ${authData.user.email}`);
    console.log(`   Email Confirmed: ${authData.user.email_confirmed_at ? 'Yes' : 'No'}`);
    
    // Get user profile with role
    console.log('\n2️⃣ Checking user profile and role...');
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.error('❌ Profile fetch failed:', profileError.message);
      return;
    }

    if (!profile) {
      console.error('❌ No profile found');
      return;
    }

    console.log('✅ Profile found!');
    console.log(`   Display Name: ${profile.display_name}`);
    console.log(`   Role: ${profile.role}`);
    console.log(`   Position: ${profile.preferred_position}`);
    console.log(`   Created: ${profile.created_at}`);

    // Check admin access
    console.log('\n3️⃣ Verifying admin access...');
    const allowedAdminRoles = ['league_admin', 'app_admin'];
    const hasAdminAccess = allowedAdminRoles.includes(profile.role);
    
    if (hasAdminAccess) {
      console.log(`✅ Admin access GRANTED! Role "${profile.role}" is authorized.`);
    } else {
      console.log(`❌ Admin access DENIED! Role "${profile.role}" is not in allowed roles: ${allowedAdminRoles.join(', ')}`);
    }

    // Sign out
    await supabase.auth.signOut();
    console.log('\n4️⃣ Signed out successfully');

    console.log('\n📊 Test Results Summary:');
    console.log(`   Authentication: ${authData.user ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`   Profile Found: ${profile ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`   Admin Access: ${hasAdminAccess ? '✅ AUTHORIZED' : '❌ DENIED'}`);
    
    if (hasAdminAccess) {
      console.log('\n🎉 The admin portal login should work correctly!');
      console.log('   You can now use admin@matchday.com / AdminMatch2025! to access the admin portal');
    } else {
      console.log('\n🚨 Admin role issue detected!');
      console.log('   The user exists but does not have the correct role for admin access');
      console.log('   Current role:', profile.role);
      console.log('   Required roles:', allowedAdminRoles.join(' or '));
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error.message);
  }
}

// Run the test
testAdminPortalLogin().catch(console.error);
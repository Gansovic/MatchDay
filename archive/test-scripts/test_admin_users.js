/**
 * Test script to check admin users and their roles
 */
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAdminUsers() {
  console.log('🔍 Checking admin users...\n');

  try {
    // Check user profiles
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .in('role', ['league_admin', 'app_admin']);

    if (profileError) {
      console.error('❌ Error fetching user profiles:', profileError);
      return;
    }

    console.log('👥 Admin User Profiles:', profiles);

    // Check auth users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('❌ Error fetching auth users:', authError);
      return;
    }

    console.log('\n🔐 Auth Users:');
    authUsers.users.forEach(user => {
      const profile = profiles.find(p => p.id === user.id);
      console.log(`- ${user.email} (${profile?.role || 'no role'})`);
    });

    // Test login with admin user
    if (profiles.length > 0) {
      console.log('\n🧪 Testing admin login...');
      
      // Try to sign in with the first admin user (we'll use a known password)
      const adminEmail = 'admin@matchday.com';
      const adminPassword = 'admin123!';
      
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: adminPassword
      });

      if (signInError) {
        console.log(`⚠️  Could not sign in with ${adminEmail}:`, signInError.message);
        console.log('This might be expected if the user doesn\'t exist or password is wrong');
      } else {
        console.log('✅ Admin sign in successful:', signInData.user.email);
        
        // Check user role after sign in
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', signInData.user.id)
          .single();
          
        console.log('👤 User role:', userProfile?.role);
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkAdminUsers();
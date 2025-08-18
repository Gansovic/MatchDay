// Script to check users in both auth.users and user_profiles tables
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://localhost:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUsers() {
  console.log('🔍 Checking users in auth.users table...');
  
  try {
    // Check auth users (requires service role)
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError.message);
    } else {
      console.log(`📊 Found ${authUsers.users.length} users in auth.users:`);
      authUsers.users.forEach((user, index) => {
        console.log(`  ${index + 1}. Email: ${user.email}, ID: ${user.id}, Created: ${user.created_at}`);
      });
    }
    
    console.log('\n🔍 Checking users in user_profiles table...');
    
    // Check user profiles
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('*');
      
    if (profileError) {
      console.error('❌ Error fetching user profiles:', profileError.message);
    } else {
      console.log(`📊 Found ${profiles.length} users in user_profiles:`);
      profiles.forEach((profile, index) => {
        console.log(`  ${index + 1}. Name: ${profile.display_name}, ID: ${profile.id}, Email: ${profile.email || 'N/A'}`);
      });
    }
    
    // Check for mismatches
    if (authUsers && profiles) {
      const authIds = new Set(authUsers.users.map(u => u.id));
      const profileIds = new Set(profiles.map(p => p.id));
      
      const authOnlyIds = [...authIds].filter(id => !profileIds.has(id));
      const profileOnlyIds = [...profileIds].filter(id => !authIds.has(id));
      
      console.log('\n🔄 Checking for mismatches...');
      if (authOnlyIds.length > 0) {
        console.log(`⚠️  Users in auth.users but NOT in user_profiles: ${authOnlyIds.length}`);
        authOnlyIds.forEach(id => {
          const user = authUsers.users.find(u => u.id === id);
          console.log(`  - ${user?.email} (${id})`);
        });
      }
      
      if (profileOnlyIds.length > 0) {
        console.log(`⚠️  Users in user_profiles but NOT in auth.users: ${profileOnlyIds.length}`);
        profileOnlyIds.forEach(id => {
          const profile = profiles.find(p => p.id === id);
          console.log(`  - ${profile?.display_name} (${id})`);
        });
      }
      
      if (authOnlyIds.length === 0 && profileOnlyIds.length === 0) {
        console.log('✅ All users are properly synced between auth.users and user_profiles');
      }
    }
    
  } catch (error) {
    console.error('❌ Script error:', error.message);
  }
}

checkUsers();
/**
 * Script to update an existing user's role to admin
 */
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, serviceKey);

async function updateUserRole(email, newRole = 'league_admin') {
  console.log(`🚀 Looking for user with email: ${email}...\\n`);

  try {
    // First, list all users to see what we have
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listing users:', listError);
      return;
    }

    console.log(`Found ${users.users.length} users in auth.users:`);
    users.users.forEach(user => {
      console.log(`- ${user.email} (${user.id})`);
    });

    // Find the user by email
    const user = users.users.find(u => u.email === email);
    
    if (!user) {
      console.log(`❌ User with email ${email} not found`);
      console.log('Available users:');
      users.users.forEach(u => console.log(`- ${u.email}`));
      return;
    }

    console.log(`\\n✅ Found user: ${user.email} (${user.id})`);

    // Check current profile
    const { data: currentProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('❌ Error fetching current profile:', profileError);
      return;
    }

    if (currentProfile) {
      console.log('Current profile:', currentProfile);
    } else {
      console.log('No profile exists, creating new one...');
    }

    // Update or create the user profile with admin role
    const { data: updatedProfile, error: updateError } = await supabase
      .from('user_profiles')
      .upsert({
        id: user.id,
        full_name: user.user_metadata?.full_name || 'Admin User',
        display_name: user.user_metadata?.display_name || 'Admin User',
        role: newRole
      })
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating user profile:', updateError);
      return;
    }

    console.log(`\\n✅ Successfully updated user role to: ${newRole}`);
    console.log('Updated profile:', updatedProfile);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Get email from command line argument
const email = process.argv[2];
if (!email) {
  console.log('Usage: node update_user_role.js <email> [role]');
  console.log('Example: node update_user_role.js admin@matchday.com league_admin');
  process.exit(1);
}

const role = process.argv[3] || 'league_admin';
updateUserRole(email, role);
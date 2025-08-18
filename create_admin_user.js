/**
 * Script to create admin user for testing
 */
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdminUser() {
  console.log('🚀 Creating admin user for testing...\n');

  try {
    // Create the auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@matchday.com',
      password: 'admin123!',
      email_confirm: true,
      user_metadata: {
        full_name: 'Admin User',
        display_name: 'Admin User'
      }
    });

    if (authError) {
      console.error('❌ Error creating auth user:', authError);
      return;
    }

    console.log('✅ Auth user created:', authData.user.email);

    // Create or update the user profile
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        id: authData.user.id,
        full_name: 'Admin User',
        display_name: 'Admin User',
        role: 'league_admin'
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ Error creating user profile:', profileError);
      return;
    }

    console.log('✅ User profile created:', profileData);

    // Test sign in
    console.log('\n🧪 Testing admin sign in...');
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'admin@matchday.com',
      password: 'admin123!'
    });

    if (signInError) {
      console.error('❌ Sign in failed:', signInError);
    } else {
      console.log('✅ Sign in successful!');
      console.log('User ID:', signInData.user.id);
      console.log('Email:', signInData.user.email);
      
      // Verify role
      const { data: roleData } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', signInData.user.id)
        .single();
        
      console.log('Role:', roleData?.role);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

createAdminUser();
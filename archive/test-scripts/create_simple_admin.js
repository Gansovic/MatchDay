/**
 * Simple script to create admin user through regular signup
 */
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

async function createSimpleAdmin() {
  console.log('🚀 Creating admin user through signup...\\n');

  try {
    // Create regular client for signup
    const supabase = createClient(supabaseUrl, anonKey);
    
    // Sign up the user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: 'admin@matchday.com',
      password: 'admin123!',
      options: {
        data: {
          full_name: 'Admin User',
          display_name: 'Admin User'
        }
      }
    });

    if (signUpError) {
      console.error('❌ Error signing up:', signUpError);
      return;
    }

    console.log('✅ User signed up:', signUpData.user?.email);
    const userId = signUpData.user?.id;

    if (!userId) {
      console.error('❌ No user ID returned');
      return;
    }

    // Now use service role client to update the role
    const serviceClient = createClient(supabaseUrl, serviceKey);

    // Insert/update the user profile with admin role
    const { data: profileData, error: profileError } = await serviceClient
      .from('user_profiles')
      .upsert({
        id: userId,
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

    console.log('✅ User profile created with admin role:', profileData);

    // Test sign in
    console.log('\\n🧪 Testing admin sign in...');
    
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

createSimpleAdmin();
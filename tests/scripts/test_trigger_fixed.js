const { createClient } = require('@supabase/supabase-js');

async function testTriggerFixed() {
  console.log('🧪 Testing Fixed Trigger...\n');
  
  const supabase = createClient(
    'http://127.0.0.1:54321',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
  );
  
  let testUserId = null;
  
  try {
    console.log('1️⃣ Testing user creation with trigger...');
    
    const userEmail = `trigger-test-${Date.now()}@matchday.test`;
    
    // Create auth user (trigger should create profile automatically)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userEmail,
      password: 'test-password-123',
      email_confirm: true,
      user_metadata: {
        full_name: 'Trigger Test User'
      }
    });
    
    if (authError) {
      throw new Error(`Auth user creation failed: ${authError.message}`);
    }
    
    console.log(`✅ Auth user created: ${authData.user.id}`);
    testUserId = authData.user.id;
    
    // Wait for trigger to run
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check if profile was created by trigger
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    
    if (profileError) {
      throw new Error(`Profile lookup failed: ${profileError.message}`);
    }
    
    console.log(`✅ User profile created by trigger!`);
    console.log(`   Full name: ${userProfile.full_name}`);
    console.log(`   Role: ${userProfile.role}`);
    console.log(`   Email: ${userProfile.email}`);
    
    console.log('\n🎉 Trigger is working correctly!');
    console.log('✅ User authentication and profile creation is fully automated');
    
    return true;
    
  } catch (error) {
    console.error('❌ Trigger test failed:', error.message);
    return false;
  } finally {
    // Cleanup
    if (testUserId) {
      try {
        await supabase.from('users').delete().eq('id', testUserId);
        await supabase.auth.admin.deleteUser(testUserId);
        console.log('\n✅ Test user cleaned up');
      } catch (cleanupError) {
        console.warn('⚠️ Cleanup failed:', cleanupError.message);
      }
    }
  }
}

testTriggerFixed()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
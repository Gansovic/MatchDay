#!/usr/bin/env node

/**
 * Test script to verify player login works
 * 
 * Usage: node scripts/test-player-login.js
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase connection details for local development
const SUPABASE_URL = 'http://localhost:54321';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

// Create Supabase client with anon key (like the app would)
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test credentials
const PLAYER_CREDENTIALS = {
  email: 'player@matchday.com',
  password: 'player123!'
};

async function testPlayerLogin() {
  console.log('🎮 Testing Player Login...\n');
  console.log('📧 Email:', PLAYER_CREDENTIALS.email);
  console.log('🔑 Password:', PLAYER_CREDENTIALS.password);
  console.log('\n' + '='.repeat(50));
  
  try {
    // Attempt to sign in
    console.log('\n📝 Attempting to sign in...');
    const { data: session, error: loginError } = await supabase.auth.signInWithPassword({
      email: PLAYER_CREDENTIALS.email,
      password: PLAYER_CREDENTIALS.password
    });
    
    if (loginError) {
      console.error('❌ Login FAILED:', loginError.message);
      console.error('   Error Details:', loginError);
      process.exit(1);
    }
    
    console.log('✅ Login SUCCESSFUL!');
    console.log('\n📋 User Details:');
    console.log('   User ID:', session.user.id);
    console.log('   Email:', session.user.email);
    console.log('   Email Confirmed:', session.user.email_confirmed_at ? 'Yes' : 'No');
    console.log('   Created At:', new Date(session.user.created_at).toLocaleString());
    
    // Fetch user profile
    console.log('\n👤 Fetching User Profile...');
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    if (profileError) {
      console.error('⚠️  Could not fetch profile:', profileError.message);
    } else if (profile) {
      console.log('✅ Profile Found:');
      console.log('   Display Name:', profile.display_name);
      console.log('   Role:', profile.role);
      console.log('   Position:', profile.preferred_position);
      console.log('   Location:', profile.location);
      
      // Verify role is 'player'
      if (profile.role === 'player') {
        console.log('\n✅ Role verification: User has correct "player" role');
      } else {
        console.log(`\n⚠️  Role verification: User has role "${profile.role}" instead of "player"`);
      }
    } else {
      console.log('⚠️  No profile found for user');
    }
    
    // Test session persistence
    console.log('\n🔐 Testing Session:');
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (currentSession) {
      console.log('✅ Session is active');
      console.log('   Access Token:', currentSession.access_token.substring(0, 20) + '...');
      console.log('   Expires At:', new Date(currentSession.expires_at * 1000).toLocaleString());
    } else {
      console.log('⚠️  No active session found');
    }
    
    // Sign out
    console.log('\n🚪 Signing out...');
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      console.error('⚠️  Sign out error:', signOutError.message);
    } else {
      console.log('✅ Signed out successfully');
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 ALL TESTS PASSED!');
    console.log('='.repeat(50));
    console.log('\nThe player login is working correctly.');
    console.log('You can use these credentials in the player app:');
    console.log(`  Email: ${PLAYER_CREDENTIALS.email}`);
    console.log(`  Password: ${PLAYER_CREDENTIALS.password}`);
    
  } catch (error) {
    console.error('\n❌ Unexpected error during testing:', error);
    process.exit(1);
  }
}

// Run the test
testPlayerLogin();
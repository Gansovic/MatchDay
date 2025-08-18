#!/usr/bin/env node

/**
 * Script to create test player user in Supabase
 * This creates a player user with the credentials shown in the player app login form
 * 
 * Usage: node scripts/create-test-player.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase connection details for local development
const SUPABASE_URL = 'http://localhost:54321';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

// Create Supabase client with service role (admin) privileges
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test credentials
const TEST_PLAYER = {
  email: 'player@matchday.com',
  password: 'player123!',
  displayName: 'Test Player',
  fullName: 'Test Player User',
  preferredPosition: 'Forward',
  location: 'San Francisco, CA',
  bio: 'Test player account for development and testing'
};

async function createTestPlayer() {
  console.log('🎮 Creating test player user...\n');
  
  try {
    // Check if user already exists
    const { data: existingUsers, error: checkError } = await supabase.auth.admin.listUsers();
    
    if (checkError) {
      console.error('❌ Error checking existing users:', checkError.message);
      return;
    }
    
    const existingUser = existingUsers?.users?.find(u => u.email === TEST_PLAYER.email);
    
    if (existingUser) {
      console.log('⚠️  User already exists. Updating password and profile...');
      
      // Update password
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        { 
          password: TEST_PLAYER.password,
          email_confirm: true
        }
      );
      
      if (updateError) {
        console.error('❌ Error updating user:', updateError.message);
        return;
      }
      
      // Update or create profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          id: existingUser.id,
          display_name: TEST_PLAYER.displayName,
          full_name: TEST_PLAYER.fullName,
          preferred_position: TEST_PLAYER.preferredPosition,
          location: TEST_PLAYER.location,
          bio: TEST_PLAYER.bio,
          role: 'player',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });
      
      if (profileError) {
        console.error('❌ Error updating profile:', profileError.message);
        return;
      }
      
      console.log('✅ Player user updated successfully!');
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: TEST_PLAYER.email,
        password: TEST_PLAYER.password,
        email_confirm: true,
        user_metadata: {
          name: TEST_PLAYER.displayName,
          role: 'player'
        }
      });
      
      if (createError) {
        console.error('❌ Error creating user:', createError.message);
        return;
      }
      
      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: newUser.user.id,
          display_name: TEST_PLAYER.displayName,
          full_name: TEST_PLAYER.fullName,
          preferred_position: TEST_PLAYER.preferredPosition,
          location: TEST_PLAYER.location,
          bio: TEST_PLAYER.bio,
          role: 'player',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (profileError) {
        console.error('❌ Error creating profile:', profileError.message);
        return;
      }
      
      console.log('✅ Player user created successfully!');
    }
    
    // Test the login
    console.log('\n📝 Testing login with created credentials...');
    const { data: session, error: loginError } = await supabase.auth.signInWithPassword({
      email: TEST_PLAYER.email,
      password: TEST_PLAYER.password
    });
    
    if (loginError) {
      console.error('❌ Login test failed:', loginError.message);
    } else {
      console.log('✅ Login successful!');
      console.log('   User ID:', session.user.id);
      console.log('   Email:', session.user.email);
      
      // Fetch and display profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (profile) {
        console.log('   Role:', profile.role);
        console.log('   Display Name:', profile.display_name);
        console.log('   Position:', profile.preferred_position);
      }
      
      // Sign out
      await supabase.auth.signOut();
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🎮 PLAYER LOGIN CREDENTIALS:');
    console.log('='.repeat(50));
    console.log(`📧 Email: ${TEST_PLAYER.email}`);
    console.log(`🔑 Password: ${TEST_PLAYER.password}`);
    console.log('='.repeat(50));
    console.log('\nYou can now use these credentials to log in to the player app!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
createTestPlayer();
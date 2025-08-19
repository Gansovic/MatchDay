#!/usr/bin/env node

/**
 * Development User Creation Script
 * 
 * This script creates secure test users for development environments.
 * It uses the Supabase Admin API to create users with proper authentication
 * and avoids hardcoding credentials in migrations or source code.
 * 
 * Usage:
 *   node scripts/create-development-users.js
 * 
 * Environment Variables Required:
 *   - SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Configuration - Only the two user types needed
const DEVELOPMENT_USERS = [
  {
    email: 'player@matchday.com',
    id: '11111111-1111-1111-1111-111111111111',
    role: 'player', 
    displayName: 'Player User',
    password: null // Will be generated
  },
  {
    email: 'league.admin@matchday.com',
    id: '33333333-3333-3333-3333-333333333333',
    role: 'league_admin',
    displayName: 'League Admin',
    password: null // Will be generated
  }
];

function generateSecurePassword(length = 16) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  return Array.from(crypto.randomBytes(length))
    .map(byte => charset[byte % charset.length])
    .join('');
}

function validateEnvironment() {
  const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    console.error('Please set these in your .env file or environment');
    process.exit(1);
  }

  // Warn if this looks like production
  const supabaseUrl = process.env.SUPABASE_URL;
  if (supabaseUrl.includes('supabase.co') && !supabaseUrl.includes('localhost')) {
    console.error('❌ This script should not be run against production Supabase instances');
    console.error('Current SUPABASE_URL:', supabaseUrl);
    process.exit(1);
  }
}

function getSupabaseAdminClient() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

async function createDevelopmentUser(supabase, userConfig) {
  const password = generateSecurePassword();
  userConfig.password = password;

  console.log(`\n🔄 Creating user: ${userConfig.email}`);

  try {
    // Create user using Supabase Admin API
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email: userConfig.email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: userConfig.displayName
      }
    });

    if (createError) {
      // If user already exists, try to get existing user
      if (createError.message.includes('already registered')) {
        console.log(`  ℹ️  User already exists: ${userConfig.email}`);
        
        // Update the existing user's profile
        const { error: profileError } = await supabase
          .from('user_profiles')
          .upsert({
            id: userConfig.id,
            display_name: userConfig.displayName,
            full_name: userConfig.displayName,
            role: userConfig.role
          });

        if (profileError) {
          console.warn(`  ⚠️  Failed to update profile:`, profileError);
        } else {
          console.log(`  ✅ Updated profile for existing user`);
        }
        return { ...userConfig, password: '[EXISTING - PASSWORD UNCHANGED]' };
      }
      
      throw createError;
    }

    console.log(`  ✅ User created with ID: ${userData.user.id}`);

    // Create user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        id: userData.user.id,
        display_name: userConfig.displayName,
        full_name: userConfig.displayName,
        role: userConfig.role,
        bio: `Development ${userConfig.role} account`,
      });

    if (profileError) {
      console.warn(`  ⚠️  Failed to create profile:`, profileError);
    } else {
      console.log(`  ✅ Profile created with role: ${userConfig.role}`);
    }

    return { ...userConfig, actualId: userData.user.id };

  } catch (error) {
    console.error(`  ❌ Error creating user ${userConfig.email}:`, error.message);
    throw error;
  }
}

async function createAllDevelopmentUsers() {
  validateEnvironment();

  console.log('🚀 Creating development users for MatchDay...\n');
  console.log('Environment:', process.env.SUPABASE_URL);

  const supabase = getSupabaseAdminClient();
  const createdUsers = [];

  try {
    for (const userConfig of DEVELOPMENT_USERS) {
      const createdUser = await createDevelopmentUser(supabase, userConfig);
      createdUsers.push(createdUser);
    }

    console.log('\n🎉 All development users created successfully!\n');
    console.log('='.repeat(80));
    console.log('DEVELOPMENT USER CREDENTIALS');
    console.log('='.repeat(80));
    
    createdUsers.forEach(user => {
      console.log(`\n📧 ${user.email}`);
      console.log(`   Password: ${user.password}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   ID: ${user.actualId || user.id}`);
    });
    
    console.log('\n='.repeat(80));
    console.log('⚠️  IMPORTANT SECURITY NOTES:');
    console.log('• These credentials are for DEVELOPMENT ONLY');
    console.log('• Change passwords immediately in production');
    console.log('• Store these credentials securely (e.g., in your password manager)');
    console.log('• Do not commit these credentials to version control');
    console.log('='.repeat(80));

    // Optionally write credentials to a secure file
    const credentialsFile = '.dev-credentials.json';
    const credentials = {
      createdAt: new Date().toISOString(),
      warning: 'DEVELOPMENT ONLY - DO NOT USE IN PRODUCTION',
      users: createdUsers.map(({ password, ...user }) => ({
        ...user,
        password: '***REDACTED***' // Don't write passwords to file
      }))
    };
    
    const fs = await import('fs');
    fs.writeFileSync(credentialsFile, JSON.stringify(credentials, null, 2));
    console.log(`\n📝 User info (without passwords) saved to: ${credentialsFile}`);
    console.log('   (Add this file to .gitignore to avoid committing it)');

  } catch (error) {
    console.error('\n❌ Failed to create development users:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createAllDevelopmentUsers().catch(console.error);
}

export { createAllDevelopmentUsers, DEVELOPMENT_USERS };
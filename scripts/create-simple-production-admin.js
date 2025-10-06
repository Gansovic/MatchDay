#!/usr/bin/env node

/**
 * Create Simple Production Admin User
 * Creates an admin user in production Supabase with existing schema
 */

const { createClient } = require('@supabase/supabase-js')

// Production Supabase configuration
const SUPABASE_URL = 'https://twkipeacdamypppxmmhe.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3a2lwZWFjZGFteXBwcHhtbWhlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTMwMzU5MiwiZXhwIjoyMDcwODc5NTkyfQ.4F4wZqSs43LKGl0GxpDp8sE-JMY8U7p_VTMQa7Jws4c'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function createAdminUser() {
  try {
    console.log('🚀 Creating admin user in production database...')
    
    // Admin user credentials
    const adminEmail = 'admin@matchday.com'
    const adminPassword = 'MatchDayAdmin2024!'
    
    console.log('📝 Creating auth user...')
    
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        display_name: 'MatchDay Admin',
        full_name: 'MatchDay Administrator'
      }
    })
    
    if (authError) {
      console.error('❌ Auth user creation failed:', authError)
      return
    }
    
    console.log('✅ Auth user created:', authData.user.id)
    
    // Create user profile in users table
    console.log('👤 Creating user profile...')
    
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id,
          email: adminEmail,
          display_name: 'MatchDay Admin',
          full_name: 'MatchDay Administrator',
          role: 'player', // Will need to be manually updated to app_admin later
          bio: 'System Administrator for MatchDay'
        }
      ])
      .select()
    
    if (profileError) {
      console.error('❌ User profile creation failed:', profileError)
      
      // Clean up auth user if profile creation failed
      await supabase.auth.admin.deleteUser(authData.user.id)
      return
    }
    
    console.log('✅ User profile created successfully!')
    console.log('\n📋 Admin User Details:')
    console.log('   Email:', adminEmail)
    console.log('   Password:', adminPassword)
    console.log('   User ID:', authData.user.id)
    console.log('   Current Role:', 'player (needs manual update to app_admin)')
    
    console.log('\n⚠️  NEXT STEPS:')
    console.log('1. Go to Supabase Dashboard > SQL Editor')
    console.log('2. Run this SQL to update role and add enum values:')
    console.log(`
-- Add admin enum values
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'app_admin';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'league_admin';

-- Update admin user role
UPDATE users SET role = 'app_admin' WHERE id = '${authData.user.id}';
`)
    
    console.log('\n🎉 Admin user created! Complete the manual steps above to finish setup.')
    
  } catch (error) {
    console.error('💥 Unexpected error:', error)
  }
}

createAdminUser()
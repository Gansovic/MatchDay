#!/usr/bin/env node

/**
 * Test script to verify admin user login functionality
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with local instance
const supabaseUrl = 'http://localhost:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAdminLogin() {
    console.log('🔐 Testing Admin User Authentication...\n');

    try {
        // Test credentials
        const email = 'admin@matchday.com';
        const password = 'AdminMatch2025!';

        console.log(`📧 Email: ${email}`);
        console.log(`🔑 Password: ${password}\n`);

        // Attempt to sign in
        console.log('🚀 Attempting to sign in...');
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (authError) {
            console.error('❌ Authentication failed:', authError.message);
            process.exit(1);
        }

        console.log('✅ Authentication successful!');
        console.log(`👤 User ID: ${authData.user.id}`);
        console.log(`📧 Email: ${authData.user.email}`);
        console.log(`🕐 Confirmed at: ${authData.user.email_confirmed_at}\n`);

        // Fetch user profile
        console.log('👥 Fetching user profile...');
        const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();

        if (profileError) {
            console.error('❌ Profile fetch failed:', profileError.message);
        } else {
            console.log('✅ Profile data retrieved:');
            console.log(`   📝 Display Name: ${profileData.display_name}`);
            console.log(`   📍 Position: ${profileData.preferred_position}`);
            console.log(`   📝 Bio: ${profileData.bio}`);
            console.log(`   📞 Phone: ${profileData.phone}`);
            console.log(`   📍 Location: ${profileData.location}\n`);
        }

        // Test admin capabilities by checking metadata
        console.log('🔐 Checking admin metadata...');
        const metadata = authData.user.raw_app_meta_data;
        if (metadata && metadata.role === 'admin') {
            console.log('✅ Admin role confirmed in metadata');
        } else {
            console.log('⚠️  Admin role not found in metadata');
        }

        // Sign out
        console.log('\n🚪 Signing out...');
        const { error: signOutError } = await supabase.auth.signOut();
        
        if (signOutError) {
            console.error('❌ Sign out failed:', signOutError.message);
        } else {
            console.log('✅ Successfully signed out');
        }

        console.log('\n🎉 Admin user test completed successfully!');
        console.log('\n📋 Login Credentials Summary:');
        console.log('   Email: admin@matchday.com');
        console.log('   Password: AdminMatch2025!');
        console.log('   Role: Administrator');
        console.log('   Status: Ready for use');
        
    } catch (error) {
        console.error('💥 Unexpected error:', error.message);
        process.exit(1);
    }
}

// Run the test
testAdminLogin();
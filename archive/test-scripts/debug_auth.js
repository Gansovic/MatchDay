// Debug script to check what the Supabase client thinks about current auth state
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://localhost:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOUKshJQnBiCJH9g3wg6XDI2EinA-36MFDDM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugAuth() {
  console.log('🔍 Checking current auth session...');
  
  try {
    const { data: session, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Error getting session:', error.message);
      return;
    }
    
    if (!session.session) {
      console.log('🚫 No active session found');
      return;
    }
    
    console.log('✅ Active session found:');
    console.log(`  Email: ${session.session.user.email}`);
    console.log(`  User ID: ${session.session.user.id}`);
    console.log(`  Created: ${session.session.user.created_at}`);
    console.log(`  Last sign in: ${session.session.user.last_sign_in_at}`);
    
    // Try to get user from auth.users
    const { data: user, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.log('⚠️  Error getting user details:', userError.message);
    } else {
      console.log('👤 User details from auth:');
      console.log(`  Email: ${user.user.email}`);
      console.log(`  ID: ${user.user.id}`);
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error.message);
  }
}

debugAuth();
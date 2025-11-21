const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read environment variables
const envContent = fs.readFileSync('.env', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  if (line && !line.startsWith('#')) {
    const [key, value] = line.split('=');
    if (key && value) {
      envVars[key.trim()] = value.trim();
    }
  }
});

const supabase = createClient(
  envVars.EXPO_PUBLIC_SUPABASE_URL,
  envVars.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

const API_URL = envVars.EXPO_PUBLIC_PLAYER_API_URL || 'http://localhost:3000';

async function testFullRepost() {
  console.log('='.repeat(60));
  console.log('TESTING FULL REPOST FLOW');
  console.log('='.repeat(60));
  console.log('API URL:', API_URL);

  try {
    // 1. Sign in as a test user (you'll need to replace with valid credentials)
    console.log('\n1. Authenticating...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com', // Replace with a valid test user
      password: 'password123'     // Replace with the test user's password
    });

    if (authError) {
      console.error('Auth error:', authError.message);
      console.log('\nTo test repost, you need to:');
      console.log('1. Create a test user in Supabase');
      console.log('2. Update this script with the test user credentials');
      return;
    }

    console.log('Authenticated as:', authData.user.email);

    // 2. Find a media item to repost
    console.log('\n2. Finding media to repost...');
    const { data: media, error: mediaError } = await supabase
      .from('media')
      .select('*')
      .in('context_type', ['league_icon', 'team_media', 'season_media'])
      .limit(1)
      .single();

    if (mediaError || !media) {
      console.error('No media found to repost:', mediaError);
      return;
    }

    console.log('Found media to repost:');
    console.log('  ID:', media.id);
    console.log('  Type:', media.context_type);
    console.log('  Path:', media.storage_path);

    // 3. Call the repost API
    console.log('\n3. Calling repost API...');
    const repostUrl = `${API_URL}/api/media/${media.id}/repost`;
    console.log('URL:', repostUrl);

    const response = await fetch(repostUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authData.session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Repost failed:');
      console.error('  Status:', response.status);
      console.error('  Error:', responseData.error);
    } else {
      console.log('SUCCESS! Media reposted:');
      console.log('  New Media ID:', responseData.data?.id);
      console.log('  URL:', responseData.data?.url);
    }

    // 4. Verify the repost was created
    if (responseData.data?.id) {
      console.log('\n4. Verifying repost in database...');
      const { data: repost, error: verifyError } = await supabase
        .from('media')
        .select('*')
        .eq('id', responseData.data.id)
        .single();

      if (verifyError) {
        console.error('Verification error:', verifyError);
      } else {
        console.log('Repost verified in database:');
        console.log('  Is Repost:', repost.is_repost);
        console.log('  Original Media ID:', repost.original_media_id);
        console.log('  Context Type:', repost.context_type);
        console.log('  Uploaded By:', repost.uploaded_by);
      }
    }

  } catch (error) {
    console.error('Unexpected error:', error.message);
  } finally {
    // Sign out
    await supabase.auth.signOut();
    console.log('\n' + '='.repeat(60));
    console.log('TEST COMPLETE');
    console.log('='.repeat(60));
  }
}

// Check if fetch is available
if (typeof fetch === 'undefined') {
  console.log('Note: This script requires node-fetch or Node.js 18+');
  console.log('Install with: npm install node-fetch');
  console.log('\nAlternatively, test with curl:');
  console.log(`curl -X POST ${API_URL}/api/media/{mediaId}/repost -H "Authorization: Bearer {token}" -H "Content-Type: application/json"`);
} else {
  testFullRepost().catch(console.error);
}
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

const supabase = createClient(envVars.EXPO_PUBLIC_SUPABASE_URL, envVars.EXPO_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  // Find a real media record that could be reposted
  const { data: media, error } = await supabase
    .from('media')
    .select('*')
    .in('context_type', ['league_icon', 'team_media', 'season_media'])
    .limit(3);

  if (error) {
    console.error('Error fetching media:', error);
    return;
  }

  console.log('Sample media records that could be reposted:');
  media?.forEach(m => {
    console.log('\n' + '='.repeat(50));
    console.log('ID:', m.id);
    console.log('Context Type:', m.context_type);
    console.log('Storage Path:', m.storage_path);
    console.log('File Name:', m.filename || m.file_name);
    console.log('Uploaded By:', m.uploaded_by);
    console.log('Is Repost:', m.is_repost);
    console.log('Original Media ID:', m.original_media_id);
  });

  // Pick the first media to test repost
  if (media && media.length > 0) {
    const testMedia = media[0];
    console.log('\n' + '='.repeat(50));
    console.log('Testing repost with media ID:', testMedia.id);

    // Test the getPublicUrl call that happens in repostMedia
    const bucketMap = {
      'league_icon': 'league-icons',
      'team_media': 'team-media',
      'season_media': 'season-media'
    };

    const bucket = bucketMap[testMedia.context_type];
    console.log('Using bucket:', bucket);
    console.log('Storage path:', testMedia.storage_path);

    const { data: urlData, error: urlError } = supabase.storage
      .from(bucket)
      .getPublicUrl(testMedia.storage_path);

    if (urlError) {
      console.error('Error getting public URL:', urlError);
    } else {
      console.log('Success! Public URL:', urlData?.publicUrl);
    }
  }
}

test().catch(console.error);
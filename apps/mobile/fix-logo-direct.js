// Direct fix for missing logo_media_id link
// This script updates the leagues table directly

const { createClient } = require('@supabase/supabase-js');

// Read directly from .env file
const fs = require('fs');
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

const supabaseUrl = envVars.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = envVars.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixLogoMediaId() {
  console.log('='.repeat(80));
  console.log('FIXING MISSING LOGO_MEDIA_ID LINKS');
  console.log('='.repeat(80));

  try {
    // 1. Find media records with league_id
    console.log('\n1. Finding league_icon media records with league_id...');
    const { data: mediaRecords, error: mediaError } = await supabase
      .from('media')
      .select('id, league_id, filename, context_type')
      .eq('context_type', 'league_icon')
      .not('league_id', 'is', null);

    if (mediaError) {
      console.error('Error fetching media records:', mediaError);
      return;
    }

    console.log(`Found ${mediaRecords?.length || 0} media records with league_id`);

    if (!mediaRecords || mediaRecords.length === 0) {
      console.log('No media records found with league_id set');
      return;
    }

    // 2. Update each league
    for (const media of mediaRecords) {
      console.log(`\n2. Processing media ${media.id} for league ${media.league_id}`);

      // Use RPC or direct update with different approach
      // Try using upsert instead of update
      const { data: updateResult, error: updateError } = await supabase
        .from('leagues')
        .upsert({
          id: media.league_id,
          logo_media_id: media.id
        }, {
          onConflict: 'id',
          ignoreDuplicates: false
        })
        .select();

      if (updateError) {
        console.error(`  ❌ Error updating league ${media.league_id}:`, updateError);

        // Try another approach - use raw SQL through RPC if available
        console.log('  Trying alternate approach...');

        // Just fetch and log current state
        const { data: league, error: fetchError } = await supabase
          .from('leagues')
          .select('id, name, logo_media_id')
          .eq('id', media.league_id)
          .single();

        if (fetchError) {
          console.error('  Cannot fetch league:', fetchError);
        } else {
          console.log(`  Current league state:`, league);
          console.log(`  Needs update: logo_media_id should be ${media.id}`);
        }
      } else {
        console.log(`  ✅ Update result:`, updateResult);
      }
    }

    // 3. Verify the fix
    console.log('\n3. Verifying the fix...');
    const { data: verifyLeagues, error: verifyError } = await supabase
      .from('leagues')
      .select('id, name, logo_media_id');

    if (verifyError) {
      console.error('Error verifying:', verifyError);
    } else {
      console.log('\nFinal league states:');
      verifyLeagues?.forEach(l => {
        console.log(`  - ${l.name}: logo_media_id = ${l.logo_media_id || 'NULL'}`);
      });
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }

  console.log('\n' + '='.repeat(80));
  console.log('FIX ATTEMPT COMPLETE');
  console.log('='.repeat(80));
  console.log('\nNOTE: If the update failed, you may need to:');
  console.log('1. Run the SQL script directly in Supabase dashboard');
  console.log('2. Check RLS policies on the leagues table');
  console.log('3. Use a service role key instead of anon key');
}

fixLogoMediaId().catch(console.error);
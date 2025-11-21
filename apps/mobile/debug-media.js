// Debug script to check media data in the database
// Run with: node debug-media.js

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

async function debugMediaData() {
  console.log('='.repeat(80));
  console.log('MEDIA DATA DEBUGGING');
  console.log('='.repeat(80));

  try {
    // 1. Check ALL leagues
    console.log('\n1. ALL LEAGUES:');
    console.log('-'.repeat(40));
    const { data: allLeagues, error: allLeaguesError } = await supabase
      .from('leagues')
      .select('id, name, logo_media_id');

    if (allLeaguesError) {
      console.error('Error fetching leagues:', allLeaguesError);
    } else {
      console.log(`Found ${allLeagues?.length || 0} total leagues`);
      allLeagues?.forEach(l => {
        console.log(`  - ${l.name}: logo_media_id = ${l.logo_media_id || 'NULL'}`);
      });
    }

    // Separate leagues with and without logo
    const leagues = allLeagues?.filter(l => l.logo_media_id) || [];

    // 2. Get all media IDs from leagues
    const mediaIds = leagues?.map(l => l.logo_media_id).filter(Boolean) || [];

    if (mediaIds.length > 0) {
      console.log('\n2. MEDIA RECORDS FOR LEAGUE ICONS:');
      console.log('-'.repeat(40));

      // Query without context_type filter first
      const { data: allMedia, error: allMediaError } = await supabase
        .from('media')
        .select('*')
        .in('id', mediaIds);

      if (allMediaError) {
        console.error('Error fetching all media:', allMediaError);
      } else {
        console.log(`Found ${allMedia?.length || 0} media records (no filter)`);
        allMedia?.forEach(m => {
          console.log(`\n  Media ID: ${m.id}`);
          console.log(`    context_type: ${m.context_type}`);
          console.log(`    storage_path: ${m.storage_path}`);
          console.log(`    storage_bucket: ${m.storage_bucket}`);
          console.log(`    file_name: ${m.file_name}`);
          console.log(`    created_at: ${m.created_at}`);
        });
      }

      // Query with context_type filter
      console.log('\n3. MEDIA RECORDS WITH CONTEXT_TYPE = "league_icon":');
      console.log('-'.repeat(40));
      const { data: filteredMedia, error: filteredMediaError } = await supabase
        .from('media')
        .select('*')
        .in('id', mediaIds)
        .eq('context_type', 'league_icon');

      if (filteredMediaError) {
        console.error('Error fetching filtered media:', filteredMediaError);
      } else {
        console.log(`Found ${filteredMedia?.length || 0} media records with context_type='league_icon'`);
        filteredMedia?.forEach(m => {
          console.log(`  - ID: ${m.id}, path: ${m.storage_path}, bucket: ${m.storage_bucket}`);
        });
      }

      // 4. Test URL generation
      console.log('\n4. TESTING URL GENERATION:');
      console.log('-'.repeat(40));

      if (allMedia && allMedia.length > 0) {
        const testMedia = allMedia[0];
        console.log(`Testing with first media record: ${testMedia.id}`);

        if (testMedia.storage_path && testMedia.storage_bucket) {
          const { data: urlData } = supabase.storage
            .from(testMedia.storage_bucket)
            .getPublicUrl(testMedia.storage_path);

          console.log(`  Generated URL: ${urlData?.publicUrl}`);

          // Test if the URL is accessible
          if (urlData?.publicUrl) {
            try {
              const response = await fetch(urlData.publicUrl, { method: 'HEAD' });
              console.log(`  URL Status: ${response.status} ${response.statusText}`);
              console.log(`  Content-Type: ${response.headers.get('content-type')}`);
            } catch (fetchError) {
              console.error(`  Error fetching URL:`, fetchError.message);
            }
          }
        } else {
          console.log('  Missing storage_path or storage_bucket');
        }
      }
    }

    // 5. Check all league_icon media records
    console.log('\n5. ALL LEAGUE_ICON MEDIA RECORDS:');
    console.log('-'.repeat(40));
    const { data: leagueIcons, error: liError } = await supabase
      .from('media')
      .select('*')
      .eq('context_type', 'league_icon');

    if (liError) {
      console.error('Error fetching league icons:', liError);
    } else {
      console.log(`Found ${leagueIcons?.length || 0} league_icon media records`);
      leagueIcons?.forEach(icon => {
        console.log(`\n  Media ID: ${icon.id}`);
        // Show ALL fields of the media record
        Object.keys(icon).forEach(key => {
          console.log(`    ${key}: ${icon[key]}`);
        });
      });
    }

    // 6. Fix the missing link - UPDATE leagues to set logo_media_id
    console.log('\n6. FIXING THE MISSING LINK:');
    console.log('-'.repeat(40));

    if (leagueIcons && leagueIcons.length > 0) {
      for (const icon of leagueIcons) {
        if (icon.league_id) {
          console.log(`\nUpdating league ${icon.league_id} to set logo_media_id = ${icon.id}`);

          // First check if the league exists
          const { data: leagueCheck, error: checkError } = await supabase
            .from('leagues')
            .select('id, name')
            .eq('id', icon.league_id)
            .single();

          if (checkError) {
            console.error('  Error checking league:', checkError);
          } else if (!leagueCheck) {
            console.error('  League not found with ID:', icon.league_id);
          } else {
            console.log(`  Found league: ${leagueCheck.name} (${leagueCheck.id})`);

            const { data: updateData, error: updateError } = await supabase
              .from('leagues')
              .update({ logo_media_id: icon.id })
              .eq('id', icon.league_id)
              .select();

            if (updateError) {
              console.error('  Error updating league:', updateError);
            } else {
              console.log('  ✅ Update result:', updateData);
            }
          }
        }
      }
    }

    // 7. Check all context_types in media table
    console.log('\n7. ALL CONTEXT TYPES IN MEDIA TABLE:');
    console.log('-'.repeat(40));
    const { data: contextTypes, error: ctError } = await supabase
      .from('media')
      .select('context_type')
      .limit(100);

    if (ctError) {
      console.error('Error fetching context types:', ctError);
    } else {
      const uniqueTypes = [...new Set(contextTypes?.map(ct => ct.context_type))];
      console.log('Unique context_types found:');
      uniqueTypes.forEach(type => {
        console.log(`  - "${type}"`);
      });
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }

  // 8. Verify the fix
  console.log('\n8. VERIFY THE FIX:');
  console.log('-'.repeat(40));
  const { data: verifyLeagues, error: verifyError } = await supabase
    .from('leagues')
    .select('id, name, logo_media_id');

  if (verifyError) {
    console.error('Error verifying:', verifyError);
  } else {
    console.log(`Leagues after fix:`);
    verifyLeagues?.forEach(l => {
      console.log(`  - ${l.name}: logo_media_id = ${l.logo_media_id || 'NULL'}`);
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log('DEBUG COMPLETE');
  console.log('='.repeat(80));
}

debugMediaData().catch(console.error);
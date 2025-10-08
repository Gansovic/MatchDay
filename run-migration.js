/**
 * Quick script to run a migration directly against the production database
 * Uses the existing Supabase connection from the admin app
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, 'apps/admin/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🔄 Running migration: 20251008160000_fix_seasons_insert_policy.sql');
  console.log('   Database:', supabaseUrl);

  const migrationPath = path.join(__dirname, 'supabase/migrations/20251008160000_fix_seasons_insert_policy.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log('   SQL length:', sql.length, 'chars');
  console.log('');

  try {
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).single();

    if (error) {
      // If exec_sql function doesn't exist, try direct query
      console.log('⚠️  exec_sql function not found, trying direct execution...');

      const { error: directError } = await supabase.from('_migrations').insert({
        version: '20251008160000',
        name: 'fix_seasons_insert_policy',
        applied_at: new Date().toISOString()
      });

      if (directError) {
        throw directError;
      }

      // Split SQL into statements and execute one by one
      const statements = sql.split(';').filter(s => s.trim());

      for (const statement of statements) {
        if (!statement.trim()) continue;

        const { error: stmtError } = await supabase.rpc('exec', { query: statement + ';' });
        if (stmtError) {
          console.error('Statement error:', statement.substring(0, 100) + '...');
          throw stmtError;
        }
      }
    }

    console.log('✅ Migration applied successfully!');
    console.log('');
    console.log('Changes made:');
    console.log('  - Dropped overly broad "League admins can manage seasons" policy');
    console.log('  - Added "Anyone can view active seasons" SELECT policy');
    console.log('  - Added "Authenticated users can create seasons" INSERT policy ✨');
    console.log('  - Added "Season creators can update their seasons" UPDATE policy');
    console.log('  - Added "Season creators can delete their seasons" DELETE policy');
    console.log('');
    console.log('You can now create seasons in the admin app!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('');
    console.log('💡 You may need to apply this migration manually through the Supabase dashboard:');
    console.log('   1. Go to https://supabase.com/dashboard');
    console.log('   2. Open SQL Editor');
    console.log('   3. Paste the contents of:', migrationPath);
    console.log('   4. Click "Run"');
    process.exit(1);
  }
}

runMigration();

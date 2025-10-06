const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = 'https://twkipeacdamypppxmmhe.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3a2lwZWFjZGFteXBwcHhtbWhlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTMwMzU5MiwiZXhwIjoyMDcwODc5NTkyfQ.ofH3TT43tYwpz5tIYfvrt_XvjW84OBC8cBFu5oCyKFg';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false
  }
});

async function deployMigration() {
  console.log('🚀 Deploying player_stats migration to production...\n');

  try {
    // First, check if player_stats table exists
    console.log('📋 Checking if player_stats table exists...');
    const { data: checkTable, error: checkError } = await supabase
      .from('player_stats')
      .select('id')
      .limit(1);

    if (!checkError) {
      console.log('✅ player_stats table already exists!');
      return;
    }

    console.log('❌ player_stats table not found. Creating it now...\n');

    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250110_create_player_stats_production.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      // Skip pure comments
      if (statement.trim().startsWith('--')) continue;
      
      // Get the first few words for logging
      const preview = statement.substring(0, 50).replace(/\n/g, ' ');
      console.log(`Executing statement ${i + 1}/${statements.length}: ${preview}...`);
      
      // For complex statements, we need to use raw SQL execution
      // Since Supabase JS client doesn't support raw SQL, we'll use RPC
      // Note: This requires a custom RPC function in Supabase
      
      // For now, let's try creating just the core table
      if (statement.includes('CREATE TABLE IF NOT EXISTS player_stats')) {
        // This is a workaround - we'll create the table structure via the API
        console.log('⚠️  Cannot execute raw DDL via JS client. Please run the migration manually.');
        console.log('\n📋 Instructions:');
        console.log('1. Go to: https://supabase.com/dashboard/project/twkipeacdamypppxmmhe/sql/new');
        console.log('2. Copy the content from: /Users/lukini/MatchDay/supabase/migrations/20250110_create_player_stats_production.sql');
        console.log('3. Paste and run in the SQL editor');
        break;
      }
    }

  } catch (error) {
    console.error('❌ Error deploying migration:', error);
  }
}

deployMigration();
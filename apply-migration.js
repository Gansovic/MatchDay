const fs = require('fs');

async function applyMigration() {
  const supabaseUrl = 'https://twkipeacdamypppxmmhe.supabase.co';
  const serviceRoleKey = 'sb_secret_HoD7AYZduuOzLyYZODYN9A_ZyHWGTO_';

  // Read the migration file
  const migrationSQL = fs.readFileSync('./supabase/migrations/20251213_create_season_join_requests.sql', 'utf8');

  console.log('Applying migration to Supabase...');

  try {
    // Execute SQL directly via Supabase's REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        query: migrationSQL
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Migration failed:', error);

      // Try breaking it down into smaller chunks
      console.log('\nTrying to apply migration in smaller chunks...');

      // Split by major SQL statements
      const statements = migrationSQL
        .split(/;[\s]*(?=CREATE|ALTER|DROP|INSERT|UPDATE|DELETE)/i)
        .map(s => s.trim())
        .filter(s => s.length > 0);

      console.log(`Found ${statements.length} SQL statements to execute`);

      // Since direct RPC might not work, let's output SQL for manual execution
      console.log('\n=== MIGRATION SQL TO RUN MANUALLY ===\n');
      console.log('Please run the following SQL in your Supabase SQL editor:');
      console.log('(Visit: https://supabase.com/dashboard/project/twkipeacdamypppxmmhe/sql)\n');
      console.log(migrationSQL);
      console.log('\n=== END OF SQL ===');
    } else {
      console.log('Migration applied successfully!');
    }
  } catch (error) {
    console.error('Error applying migration:', error);

    // Output the SQL for manual execution
    console.log('\n=== MIGRATION SQL TO RUN MANUALLY ===\n');
    console.log('Since automatic migration failed, please run this SQL manually in Supabase:');
    console.log('1. Go to: https://supabase.com/dashboard/project/twkipeacdamypppxmmhe/sql');
    console.log('2. Copy and paste the following SQL:\n');
    console.log(migrationSQL);
    console.log('\n=== END OF SQL ===');
  }
}

applyMigration();
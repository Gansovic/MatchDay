const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://twkipeacdamypppxmmhe.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeMigration() {
  console.log('🚀 Executing minimal fix migration...');
  
  try {
    // Execute the migration using raw SQL
    const migrationSQL = fs.readFileSync('/Users/lukini/MatchDay/minimal_fix.sql', 'utf8');
    
    // Split into individual statements and execute
    const statements = migrationSQL.split(';').filter(s => s.trim().length > 0);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (!statement || statement.startsWith('--')) continue;
      
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      // For Supabase, we need to use RPC to execute raw SQL
      const { data, error } = await supabase.rpc('exec', { sql: statement });
      
      if (error) {
        console.log(`Warning on statement ${i + 1}:`, error.message);
      } else {
        console.log(`✓ Statement ${i + 1} executed successfully`);
      }
    }
    
    // Test if it worked
    console.log('\n📊 Testing results...');
    
    const { data: testData, error: testError } = await supabase
      .from('user_dashboard_stats')
      .select('*')
      .eq('display_name', 'player')
      .single();
      
    if (!testError && testData) {
      console.log('🎉 SUCCESS! Dashboard data:', testData);
    } else {
      console.log('❌ Test failed:', testError?.message);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  }
}

executeMigration();
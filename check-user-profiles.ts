import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://twkipeacdamypppxmmhe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3a2lwZWFjZGFteXBwcHhtbWhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjYxNjE4NjcsImV4cCI6MjA0MTczNzg2N30.VMKLA1Kn--GQr7PV4YcYkNXcNCK7qOhcvEV9lKLDxvw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTable() {
  console.log('Checking user_profiles table...\n');

  // Try to query the table
  const { data, error, count } = await supabase
    .from('user_profiles')
    .select('*', { count: 'exact' })
    .limit(3);

  if (error) {
    console.error('❌ Error querying user_profiles:', error.message);
    console.error('Error details:', JSON.stringify(error, null, 2));
  } else {
    console.log('✅ user_profiles table exists and is accessible!');
    console.log(`Found ${count} total records`);
    console.log('Sample data:', JSON.stringify(data, null, 2));
  }

  // Check table structure
  console.log('\nChecking table structure via RPC...');
  const { data: columns, error: structError } = await supabase.rpc('get_table_columns', {
    table_name: 'user_profiles'
  });

  if (!structError) {
    console.log('Table columns:', columns);
  }
}

checkTable();

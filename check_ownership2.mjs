import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve('apps/admin/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  console.log('URL:', supabaseUrl ? 'Found' : 'Missing');
  console.log('Service Key:', supabaseServiceKey ? 'Found' : 'Missing');
  process.exit(1);
}

// Use service role key to access auth.users
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const leagueId = '21168054-2b41-49ab-b4b3-dc8f8cfc4d84';
const currentUserId = '53efe47a-0a25-406c-b7c9-29dc31df44c8';
const ownerUserId = 'f7e809f2-a452-4ead-b351-bb8ebc89db76';

console.log('🔍 Investigating ownership issue...\n');

// Get league details
const { data: league } = await supabase
  .from('leagues')
  .select('name, id, created_by, created_at')
  .eq('id', leagueId)
  .single();

console.log('🏆 League:', league?.name);
console.log('   Created:', new Date(league?.created_at).toLocaleString());
console.log();

// Use admin API to get user details
const { data: { users }, error } = await supabase.auth.admin.listUsers();

const currentUser = users?.find(u => u.id === currentUserId);
const ownerUser = users?.find(u => u.id === ownerUserId);

console.log('👤 Your Current Account:');
console.log('   Email:', currentUser?.email || 'Not found');
console.log('   ID:', currentUserId);
console.log();

console.log('👑 League Owner Account:');
console.log('   Email:', ownerUser?.email || 'Not found');
console.log('   ID:', ownerUserId);
console.log();

console.log('📧 Summary:');
console.log(`   You are logged in as: ${currentUser?.email || 'unknown'}`);
console.log(`   League was created by: ${ownerUser?.email || 'unknown'}`);
console.log(`   Match: ${currentUserId === ownerUserId ? '✅ SAME' : '❌ DIFFERENT'}`);

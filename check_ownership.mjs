import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve('apps/admin/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const leagueId = '21168054-2b41-49ab-b4b3-dc8f8cfc4d84';
const currentUserId = '53efe47a-0a25-406c-b7c9-29dc31df44c8';
const ownerUserId = 'f7e809f2-a452-4ead-b351-bb8ebc89db76';

console.log('🔍 Investigating ownership issue...\n');

// Get league details
const { data: league, error: leagueError } = await supabase
  .from('leagues')
  .select('*')
  .eq('id', leagueId)
  .single();

if (leagueError) {
  console.error('Error fetching league:', leagueError);
} else {
  console.log('🏆 League Details:');
  console.log('  Name:', league.name);
  console.log('  ID:', league.id);
  console.log('  Created By:', league.created_by);
  console.log('  Sport:', league.sport_type);
  console.log('  Created At:', league.created_at);
  console.log();
}

// Get current user details
const { data: currentUser, error: currentUserError } = await supabase
  .from('user_profiles')
  .select('id, email, full_name, display_name')
  .eq('id', currentUserId)
  .single();

if (!currentUserError && currentUser) {
  console.log('👤 Your Current Account:');
  console.log('  ID:', currentUser.id);
  console.log('  Email:', currentUser.email);
  console.log('  Name:', currentUser.full_name || currentUser.display_name);
  console.log();
}

// Get owner user details
const { data: ownerUser, error: ownerUserError } = await supabase
  .from('user_profiles')
  .select('id, email, full_name, display_name')
  .eq('id', ownerUserId)
  .single();

if (!ownerUserError && ownerUser) {
  console.log('👑 League Owner Account:');
  console.log('  ID:', ownerUser.id);
  console.log('  Email:', ownerUser.email);
  console.log('  Name:', ownerUser.full_name || ownerUser.display_name);
  console.log();
}

// Check auth.users table as well
const { data: authUsers, error: authError } = await supabase
  .from('auth.users')
  .select('id, email')
  .in('id', [currentUserId, ownerUserId]);

console.log('📧 Summary:');
console.log(`  You are logged in as: ${currentUser?.email || 'unknown'}`);
console.log(`  League was created by: ${ownerUser?.email || 'unknown'}`);
console.log(`  These are ${currentUserId === ownerUserId ? 'THE SAME' : 'DIFFERENT'} accounts`);

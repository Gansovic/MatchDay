import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve('apps/admin/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const leagueId = '21168054-2b41-49ab-b4b3-dc8f8cfc4d84';
const adminUserId = '53efe47a-0a25-406c-b7c9-29dc31df44c8'; // admin@matchday.com

console.log('🔄 Assigning league ownership...');
console.log('   League: Test');
console.log('   New Owner: admin@matchday.com');
console.log('   User ID:', adminUserId);
console.log();

const { data, error } = await supabase
  .from('leagues')
  .update({ created_by: adminUserId })
  .eq('id', leagueId)
  .select();

if (error) {
  console.error('❌ Error:', error);
} else {
  console.log('✅ SUCCESS! League ownership updated!');
  console.log();
  console.log('Updated league:', data[0]);
  console.log();
  console.log('🎉 You can now:');
  console.log('   - Upload season media');
  console.log('   - Click on fixtures to enter match results');
  console.log('   - Manage all league settings');
  console.log();
  console.log('🔄 Refresh your browser to see the changes!');
}

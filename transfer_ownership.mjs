import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve('apps/admin/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const leagueId = '21168054-2b41-49ab-b4b3-dc8f8cfc4d84';
const newOwnerId = '53efe47a-0a25-406c-b7c9-29dc31df44c8'; // admin@matchday.com

console.log('🔄 Transferring league ownership...');
console.log('   League ID:', leagueId);
console.log('   New Owner: admin@matchday.com');
console.log();

const { data, error } = await supabase
  .from('leagues')
  .update({ created_by: newOwnerId })
  .eq('id', leagueId)
  .select();

if (error) {
  console.error('❌ Error:', error);
} else {
  console.log('✅ League ownership transferred successfully!');
  console.log('   You can now manage this league with admin@matchday.com');
}

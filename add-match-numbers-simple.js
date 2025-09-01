// Simple script to add match numbers using direct database queries
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://twkipeacdamypppxmmhe.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3a2lwZWFjZGFteXBwcHhtbWhlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTMwMzU5MiwiZXhwIjoyMDcwODc5NTkyfQ.ofH3TT43tYwpz5tIYfvrt_XvjW84OBC8cBFu5oCyKFg';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addMatchNumbers() {
  try {
    console.log('🔍 Checking existing matches...');
    
    // First, check if matches already have match_number
    const { data: existingMatches, error: fetchError } = await supabase
      .from('matches')
      .select('id, match_number, created_at')
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('❌ Error fetching matches:', fetchError);
      return;
    }

    console.log(`📊 Found ${existingMatches.length} existing matches`);
    
    // Check if match_number column exists by looking for any non-null values
    const hasMatchNumbers = existingMatches.some(match => match.match_number !== null);
    
    if (hasMatchNumbers) {
      console.log('✅ Match numbers already exist:');
      existingMatches.forEach(match => {
        if (match.match_number) {
          console.log(`  Match #${match.match_number}: ${match.id.substring(0, 8)}`);
        }
      });
      return;
    }
    
    console.log('🔄 Adding match numbers to existing matches...');
    
    // Assign sequential numbers to existing matches
    for (let i = 0; i < existingMatches.length; i++) {
      const match = existingMatches[i];
      const matchNumber = i + 1;
      
      // Try to update the match with a match number
      const { error: updateError } = await supabase
        .from('matches')
        .update({ match_number: matchNumber })
        .eq('id', match.id);
      
      if (updateError) {
        console.error(`❌ Error updating match ${match.id}:`, updateError);
        
        // If the column doesn't exist, we'll get a specific error
        if (updateError.message.includes('column "match_number" does not exist')) {
          console.log('⚠️ Column match_number does not exist. Manual SQL required.');
          console.log('Please run this SQL in the Supabase SQL Editor:');
          console.log(`
ALTER TABLE matches ADD COLUMN match_number INTEGER UNIQUE;
CREATE SEQUENCE IF NOT EXISTS matches_match_number_seq;
ALTER TABLE matches ALTER COLUMN match_number SET DEFAULT nextval('matches_match_number_seq');
CREATE INDEX IF NOT EXISTS idx_matches_match_number ON matches(match_number);
          `);
          return;
        }
      } else {
        console.log(`✅ Updated match ${match.id} with number ${matchNumber}`);
      }
    }
    
    console.log('🎉 All matches updated with sequential numbers!');
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

addMatchNumbers();
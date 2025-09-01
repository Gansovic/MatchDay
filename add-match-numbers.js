// Script to add match_number column to matches table and update existing match
const { createClient } = require('@supabase/supabase-js');

// Use the cloud Supabase credentials from .env.local
const supabaseUrl = 'https://twkipeacdamypppxmmhe.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3a2lwZWFjZGFteXBwcHhtbWhlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTMwMzU5MiwiZXhwIjoyMDcwODc5NTkyfQ.ofH3TT43tYwpz5tIYfvrt_XvjW84OBC8cBFu5oCyKFg';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addMatchNumbers() {
  try {
    console.log('🔄 Adding match_number column to matches table...');
    
    // Add the match_number column
    const { error: columnError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Add match_number column with auto-increment sequence
        CREATE SEQUENCE IF NOT EXISTS matches_match_number_seq;
        
        ALTER TABLE matches 
        ADD COLUMN IF NOT EXISTS match_number INTEGER UNIQUE 
        DEFAULT nextval('matches_match_number_seq');
        
        -- Create index for fast lookups
        CREATE INDEX IF NOT EXISTS idx_matches_match_number ON matches(match_number);
      `
    });

    if (columnError) {
      console.error('❌ Error adding column:', columnError);
      
      // Try alternative approach using direct SQL commands
      console.log('🔄 Trying alternative approach...');
      
      // First, check if column already exists
      const { data: columns } = await supabase
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_name', 'matches')
        .eq('column_name', 'match_number');

      if (!columns || columns.length === 0) {
        // Column doesn't exist, we need to add it manually
        console.log('⚠️ Cannot add column directly via RPC. Please run this SQL manually in Supabase dashboard:');
        console.log(`
-- SQL to run in Supabase SQL editor:
CREATE SEQUENCE IF NOT EXISTS matches_match_number_seq;

ALTER TABLE matches 
ADD COLUMN match_number INTEGER UNIQUE 
DEFAULT nextval('matches_match_number_seq');

CREATE INDEX IF NOT EXISTS idx_matches_match_number ON matches(match_number);
        `);
        return;
      }
    }

    console.log('✅ Match number column added successfully');
    
    // Now update existing matches with sequential numbers
    console.log('🔄 Updating existing matches with sequential numbers...');
    
    // Get all existing matches
    const { data: matches, error: fetchError } = await supabase
      .from('matches')
      .select('id, created_at')
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('❌ Error fetching matches:', fetchError);
      return;
    }

    console.log(`📊 Found ${matches.length} matches to update`);
    
    // Update each match with a sequential number
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const matchNumber = i + 1;
      
      const { error: updateError } = await supabase
        .from('matches')
        .update({ match_number: matchNumber })
        .eq('id', match.id);
      
      if (updateError) {
        console.error(`❌ Error updating match ${match.id}:`, updateError);
      } else {
        console.log(`✅ Updated match ${match.id} with number ${matchNumber}`);
      }
    }
    
    console.log('🎉 All matches updated with sequential numbers!');
    
    // Show the results
    const { data: updatedMatches, error: finalFetchError } = await supabase
      .from('matches')
      .select('id, match_number, created_at')
      .order('match_number', { ascending: true });
    
    if (!finalFetchError && updatedMatches) {
      console.log('📋 Final match numbers:');
      updatedMatches.forEach(match => {
        console.log(`  Match #${match.match_number}: ${match.id.substring(0, 8)}`);
      });
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

addMatchNumbers();
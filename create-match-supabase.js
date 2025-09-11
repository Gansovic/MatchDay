// Script to create a match directly using Supabase client
const { createClient } = require('@supabase/supabase-js');

// Use the cloud Supabase credentials from .env.local
const supabaseUrl = 'https://twkipeacdamypppxmmhe.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3a2lwZWFjZGFteXBwcHhtbWhlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTMwMzU5MiwiZXhwIjoyMDcwODc5NTkyfQ.ofH3TT43tYwpz5tIYfvrt_XvjW84OBC8cBFu5oCyKFg';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createMatch() {
  try {
    console.log('🔍 Checking existing teams...');
    
    // First, check what teams exist
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id, name')
      .limit(10);
    
    if (teamsError) {
      console.error('Error fetching teams:', teamsError);
      return;
    }
    
    console.log('Available teams:', teams);
    
    // Look for adminTeam and playerTeam or create with first two teams
    let homeTeamId = '425d8961-057e-49c3-a5a5-fade06e785cc'; // adminTeam
    let awayTeamId = null;
    
    // Find another team that's not adminTeam
    const otherTeam = teams.find(team => team.id !== homeTeamId);
    if (otherTeam) {
      awayTeamId = otherTeam.id;
      console.log(`Creating match: adminTeam vs ${otherTeam.name}`);
    } else if (teams.length >= 2) {
      homeTeamId = teams[0].id;
      awayTeamId = teams[1].id;
      console.log(`Creating match: ${teams[0].name} vs ${teams[1].name}`);
    } else {
      console.error('Not enough teams to create a match');
      return;
    }
    
    // Create the match (without match_type which doesn't exist in cloud)
    const matchData = {
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      match_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
      venue: 'Main Stadium',
      status: 'scheduled',
      home_score: 0,
      away_score: 0
    };
    
    console.log('Creating match with data:', matchData);
    
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .insert([matchData])
      .select()
      .single();
    
    if (matchError) {
      console.error('❌ Error creating match:', matchError);
    } else {
      console.log('✅ Match created successfully!');
      console.log('Match details:', match);
      console.log('Match ID:', match.id);
      console.log('View at: http://localhost:3000/matches/' + match.id);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createMatch();
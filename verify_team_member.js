const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://localhost:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

async function verifyTeamMember() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check team members for our created team
    const teamId = 'd4c8c629-c8e1-4c09-81cc-1d112eccb4a1';
    const userId = '4cee5bad-78d9-4b4f-a1f3-1334e6061a0f';
    
    console.log('Checking team members for team:', teamId);
    
    const { data: members, error: memberError } = await supabase
      .from('team_members')
      .select(`
        *,
        user_profile:users!inner(*)
      `)
      .eq('team_id', teamId);
    
    if (memberError) {
      console.error('Error fetching team members:', memberError);
      return;
    }
    
    console.log('Team members found:', members?.length || 0);
    console.log('Members:', JSON.stringify(members, null, 2));
    
    // Check if captain is a member
    const captainMember = members?.find(m => m.user_id === userId);
    
    if (captainMember) {
      console.log('\n✅ Captain is correctly added as team member!');
      console.log('Position:', captainMember.position);
      console.log('Jersey number:', captainMember.jersey_number);
      console.log('Active:', captainMember.is_active);
    } else {
      console.log('\n❌ Captain is NOT a team member');
    }
    
    // Verify foreign key constraints work
    console.log('\n--- Verifying foreign key constraints ---');
    
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single();
    
    if (teamError) {
      console.error('Team lookup error:', teamError);
    } else {
      console.log('Team captain_id:', team.captain_id);
      console.log('Team name:', team.name);
      
      if (team.captain_id === userId) {
        console.log('✅ Foreign key constraint working correctly!');
      } else {
        console.log('❌ Captain ID mismatch');
      }
    }
    
  } catch (error) {
    console.error('Verification error:', error);
  }
}

verifyTeamMember();
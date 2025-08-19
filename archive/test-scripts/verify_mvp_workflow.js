/**
 * MVP Workflow Verification Script
 * 
 * Checks the database state after league request approval:
 * - Shows if team joined the league
 * - Shows request status
 * - Verifies the complete workflow
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, serviceKey);

async function verifyMVPWorkflow() {
  console.log('🔍 Verifying MVP Workflow Results...\n');

  try {
    // Get test team status
    console.log('1️⃣ Checking Test Team Status...');
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select(`
        id,
        name,
        league_id,
        leagues:league_id (
          name,
          sport_type,
          created_by
        )
      `)
      .eq('name', 'Test Thunder FC')
      .single();

    if (teamError) {
      console.error('❌ Error fetching team:', teamError);
      return;
    }

    if (!team) {
      console.log('❌ Test team not found');
      return;
    }

    console.log(`📋 Team: ${team.name}`);
    if (team.league_id && team.leagues) {
      console.log(`🏆 League: ${team.leagues.name} ✅ JOINED LEAGUE!`);
      console.log(`📊 Sport: ${team.leagues.sport_type}`);
    } else {
      console.log('🚫 League: Not in any league');
    }

    // Check request history
    console.log('\n2️⃣ Checking Request History...');
    const { data: requests, error: requestsError } = await supabase
      .from('team_league_requests')
      .select(`
        id,
        status,
        message,
        review_message,
        created_at,
        reviewed_at,
        teams:team_id (name),
        leagues:league_id (name)
      `)
      .eq('team_id', team.id)
      .order('created_at', { ascending: false });

    if (requestsError) {
      console.error('❌ Error fetching requests:', requestsError);
      return;
    }

    if (requests.length === 0) {
      console.log('📭 No requests found');
    } else {
      requests.forEach(request => {
        const statusEmoji = {
          'pending': '🟡',
          'approved': '✅',
          'rejected': '❌'
        }[request.status] || '❓';

        console.log(`${statusEmoji} Request to ${request.leagues?.name}`);
        console.log(`   Status: ${request.status.toUpperCase()}`);
        console.log(`   Submitted: ${new Date(request.created_at).toLocaleString()}`);
        
        if (request.message) {
          console.log(`   Player Message: "${request.message}"`);
        }
        
        if (request.reviewed_at) {
          console.log(`   Reviewed: ${new Date(request.reviewed_at).toLocaleString()}`);
          if (request.review_message) {
            console.log(`   Admin Response: "${request.review_message}"`);
          }
        }
        console.log('');
      });
    }

    // Summary
    console.log('📊 MVP Workflow Summary:');
    console.log('============================');
    
    const hasApprovedRequest = requests.some(r => r.status === 'approved');
    const isInLeague = team.league_id !== null;
    
    if (hasApprovedRequest && isInLeague) {
      console.log('🎉 SUCCESS: Complete workflow working!');
      console.log('✅ Request approved');
      console.log('✅ Team joined league');
      console.log('✅ MVP workflow complete');
    } else if (hasApprovedRequest && !isInLeague) {
      console.log('⚠️  PARTIAL: Request approved but team not in league');
      console.log('   → Check database trigger or approval logic');
    } else if (requests.some(r => r.status === 'pending')) {
      console.log('🟡 PENDING: Request submitted, waiting for approval');
      console.log('   → Test admin approval next');
    } else {
      console.log('🆕 READY: No requests yet, ready for testing');
      console.log('   → Submit request from player app');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

verifyMVPWorkflow();
#!/usr/bin/env node

/**
 * Script to check the current ownership status of all leagues
 * Shows which leagues are owned by whom and identifies any unassigned leagues
 * 
 * Usage: node scripts/check-league-ownership.js
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase connection details for local development
const SUPABASE_URL = 'http://localhost:54321';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

// Create Supabase client with service role (admin) privileges
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkLeagueOwnership() {
  console.log('🔍 Checking league ownership status...\n');
  
  try {
    // Step 1: Get all leagues with their owners
    console.log('1️⃣ Fetching all leagues...');
    const { data: leagues, error: leaguesError, count } = await supabase
      .from('leagues')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });
    
    if (leaguesError) {
      console.error('❌ Error fetching leagues:', leaguesError.message);
      return;
    }
    
    if (!leagues || leagues.length === 0) {
      console.log('ℹ️  No leagues found in the database.');
      return;
    }
    
    console.log(`✅ Found ${count} league(s) in total\n`);
    
    // Step 2: Get owner information for leagues
    const ownerIds = [...new Set(leagues.filter(l => l.created_by).map(l => l.created_by))];
    let owners = {};
    
    if (ownerIds.length > 0) {
      console.log('2️⃣ Fetching owner information...');
      
      // Get user profiles for owners
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, display_name, role')
        .in('id', ownerIds);
      
      if (!profilesError && profiles) {
        profiles.forEach(profile => {
          owners[profile.id] = profile;
        });
      }
      
      // Get auth emails for owners
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (!authError && authUsers?.users) {
        authUsers.users.forEach(user => {
          if (owners[user.id]) {
            owners[user.id].email = user.email;
          }
        });
      }
      
      console.log(`✅ Found ${Object.keys(owners).length} unique owner(s)\n`);
    }
    
    // Step 3: Categorize leagues
    const ownedLeagues = leagues.filter(l => l.created_by);
    const unownedLeagues = leagues.filter(l => !l.created_by);
    
    // Group leagues by owner (moved outside to make it accessible later)
    const leaguesByOwner = {};
    ownedLeagues.forEach(league => {
      if (!leaguesByOwner[league.created_by]) {
        leaguesByOwner[league.created_by] = [];
      }
      leaguesByOwner[league.created_by].push(league);
    });
    
    // Step 4: Display owned leagues
    if (ownedLeagues.length > 0) {
      console.log('📊 LEAGUES WITH OWNERS:');
      console.log('=' .repeat(60));
      
      Object.entries(leaguesByOwner).forEach(([ownerId, ownerLeagues]) => {
        const owner = owners[ownerId];
        console.log(`\n👤 Owner: ${owner?.display_name || 'Unknown'}`);
        console.log(`   Email: ${owner?.email || 'N/A'}`);
        console.log(`   Role: ${owner?.role || 'N/A'}`);
        console.log(`   User ID: ${ownerId}`);
        console.log(`   Leagues (${ownerLeagues.length}):`);
        
        ownerLeagues.forEach(league => {
          console.log(`\n      📍 ${league.name}`);
          console.log(`         - ID: ${league.id}`);
          console.log(`         - Type: ${league.sport_type} / ${league.league_type}`);
          console.log(`         - Location: ${league.location || 'Not specified'}`);
          console.log(`         - Active: ${league.is_active ? 'Yes' : 'No'}`);
          console.log(`         - Public: ${league.is_public ? 'Yes' : 'No'}`);
          console.log(`         - Max Teams: ${league.max_teams || 'Unlimited'}`);
          console.log(`         - Entry Fee: ${league.entry_fee ? `$${league.entry_fee}` : 'Free'}`);
        });
      });
    }
    
    // Step 5: Display unowned leagues
    if (unownedLeagues.length > 0) {
      console.log('\n\n⚠️  LEAGUES WITHOUT OWNERS:');
      console.log('=' .repeat(60));
      
      unownedLeagues.forEach(league => {
        console.log(`\n   📍 ${league.name}`);
        console.log(`      - ID: ${league.id}`);
        console.log(`      - Type: ${league.sport_type} / ${league.league_type}`);
        console.log(`      - Location: ${league.location || 'Not specified'}`);
        console.log(`      - Active: ${league.is_active ? 'Yes' : 'No'}`);
        console.log(`      - Created: ${new Date(league.created_at).toLocaleDateString()}`);
      });
      
      console.log('\n   💡 Tip: Run "node scripts/assign-leagues-to-admin.js" to assign these to admin');
    }
    
    // Step 6: Check for teams in leagues
    console.log('\n\n3️⃣ Checking team distribution...');
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id, name, league_id');
    
    if (!teamsError && teams) {
      const teamsByLeague = {};
      teams.forEach(team => {
        if (!teamsByLeague[team.league_id]) {
          teamsByLeague[team.league_id] = 0;
        }
        teamsByLeague[team.league_id]++;
      });
      
      const leaguesWithTeams = Object.keys(teamsByLeague).length;
      const totalTeams = teams.length;
      
      console.log(`✅ Total teams: ${totalTeams}`);
      console.log(`   Leagues with teams: ${leaguesWithTeams}`);
      console.log(`   Leagues without teams: ${leagues.length - leaguesWithTeams}`);
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📈 SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Leagues: ${leagues.length}`);
    console.log(`Leagues with Owners: ${ownedLeagues.length}`);
    console.log(`Leagues without Owners: ${unownedLeagues.length}`);
    console.log(`Unique Owners: ${Object.keys(owners).length}`);
    
    // Check for admin ownership
    const adminOwner = Object.values(owners).find(o => o.email === 'admin@matchday.com');
    if (adminOwner) {
      const adminLeagueCount = leaguesByOwner[adminOwner.id]?.length || 0;
      console.log(`\n✅ Admin (admin@matchday.com) owns ${adminLeagueCount} league(s)`);
      
      if (adminLeagueCount === leagues.length) {
        console.log('   🎉 Admin owns ALL leagues!');
      } else {
        console.log(`   ℹ️  Admin owns ${Math.round(adminLeagueCount / leagues.length * 100)}% of all leagues`);
      }
    } else {
      console.log('\n⚠️  Admin user (admin@matchday.com) does not own any leagues');
    }
    
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the check
checkLeagueOwnership();
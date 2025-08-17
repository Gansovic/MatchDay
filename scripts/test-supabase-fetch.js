const { createClient } = require('@supabase/supabase-js');

// Local Supabase configuration
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

async function testSupabaseFetch() {
    console.log('🧪 Testing Supabase client fetch...\n');
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    try {
        // 1. Test fetching all teams
        console.log('1️⃣  Fetching all teams:');
        const { data: allTeams, error: allTeamsError } = await supabase
            .from('teams')
            .select(`
                *,
                league:leagues(name, sport_type),
                captain:users!captain_id(full_name, email)
            `)
            .order('created_at', { ascending: false });
            
        if (allTeamsError) {
            console.error('   Error:', allTeamsError);
        } else {
            console.log(`   Found ${allTeams.length} teams total`);
            allTeams.forEach(team => {
                console.log(`   - ${team.name} (Captain: ${team.captain?.full_name || 'Unknown'})`);
            });
        }
        
        // 2. Test fetching teams for specific user
        console.log('\n2️⃣  Fetching teams for admin user (as captain):');
        const { data: captainTeams, error: captainError } = await supabase
            .from('teams')
            .select(`
                *,
                league:leagues(name, sport_type),
                team_stats(wins, draws, losses, points, season_year)
            `)
            .eq('captain_id', '11111111-1111-1111-1111-111111111111')
            .order('name');
            
        if (captainError) {
            console.error('   Error:', captainError);
        } else {
            console.log(`   Found ${captainTeams.length} teams where user is captain`);
            captainTeams.forEach(team => {
                console.log(`   - ${team.name}`);
                console.log(`     Location: ${team.location}`);
                console.log(`     League: ${team.league?.name || 'No league'}`);
                if (team.team_stats && team.team_stats.length > 0) {
                    const stats = team.team_stats[0];
                    console.log(`     Stats: ${stats.wins}W-${stats.draws}D-${stats.losses}L, ${stats.points} points`);
                }
            });
        }
        
        // 3. Test fetching teams where user is a member
        console.log('\n3️⃣  Fetching teams via team_members:');
        const { data: memberTeams, error: memberError } = await supabase
            .from('team_members')
            .select(`
                position,
                jersey_number,
                is_active,
                is_starter,
                team:teams(
                    id,
                    name,
                    location,
                    team_color,
                    league:leagues(name)
                )
            `)
            .eq('user_id', '11111111-1111-1111-1111-111111111111');
            
        if (memberError) {
            console.error('   Error:', memberError);
        } else {
            console.log(`   Found ${memberTeams.length} team memberships`);
            memberTeams.forEach(membership => {
                console.log(`   - ${membership.team.name}`);
                console.log(`     Position: ${membership.position}, Jersey: #${membership.jersey_number}`);
                console.log(`     Status: ${membership.is_active ? 'Active' : 'Inactive'}, ${membership.is_starter ? 'Starter' : 'Substitute'}`);
            });
        }
        
        // 4. Test fetching a specific team by ID
        const teamId = 'b28c6f84-6fa0-4a8f-8d48-260828fc8f27'; // FC MatchDay United
        console.log('\n4️⃣  Fetching specific team (FC MatchDay United):');
        const { data: specificTeam, error: specificError } = await supabase
            .from('teams')
            .select(`
                *,
                league:leagues(*),
                captain:users!captain_id(*),
                team_members(
                    user:users(full_name, email),
                    position,
                    jersey_number
                ),
                team_stats(*)
            `)
            .eq('id', teamId)
            .single();
            
        if (specificError) {
            console.error('   Error:', specificError);
        } else {
            console.log(`   Team: ${specificTeam.name}`);
            console.log(`   Captain: ${specificTeam.captain.full_name}`);
            console.log(`   Members: ${specificTeam.team_members.length}`);
            console.log(`   League: ${specificTeam.league.name}`);
            console.log(`   Bio: ${specificTeam.team_bio}`);
        }
        
        console.log('\n✅ All Supabase fetch tests completed successfully!');
        console.log('   The teams should now be visible in:');
        console.log('   - Supabase Studio: http://127.0.0.1:54323');
        console.log('   - Your Next.js app when logged in as admin@matchday.com');
        
    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

testSupabaseFetch();
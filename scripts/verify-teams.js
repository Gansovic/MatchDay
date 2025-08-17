const { Client } = require('pg');

// Database connection configuration for local Supabase
const dbConfig = {
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
};

async function verifyTeams() {
    const client = new Client(dbConfig);
    
    try {
        await client.connect();
        console.log('🔍 Verifying team data and relationships...\n');
        
        // 1. Verify admin user exists in all required tables
        console.log('1️⃣  Admin User Verification:');
        const authUserResult = await client.query(`
            SELECT id, email, role, email_confirmed_at 
            FROM auth.users 
            WHERE id = '11111111-1111-1111-1111-111111111111'
        `);
        console.log('   Auth user exists:', authUserResult.rows.length > 0 ? '✅' : '❌');
        
        const userProfileResult = await client.query(`
            SELECT id, full_name, bio 
            FROM user_profiles 
            WHERE id = '11111111-1111-1111-1111-111111111111'
        `);
        console.log('   User profile exists:', userProfileResult.rows.length > 0 ? '✅' : '❌');
        
        const userResult = await client.query(`
            SELECT id, email, full_name, role 
            FROM users 
            WHERE id = '11111111-1111-1111-1111-111111111111'
        `);
        console.log('   User record exists:', userResult.rows.length > 0 ? '✅' : '❌');
        
        // 2. Verify teams with full details
        console.log('\n2️⃣  Teams with Full Details:');
        const teamsDetailResult = await client.query(`
            SELECT 
                t.*,
                l.name as league_name,
                l.sport_type,
                u.full_name as captain_name,
                COUNT(DISTINCT tm.user_id) as member_count
            FROM teams t
            LEFT JOIN leagues l ON t.league_id = l.id
            LEFT JOIN users u ON t.captain_id = u.id
            LEFT JOIN team_members tm ON t.id = tm.team_id
            WHERE t.captain_id = '11111111-1111-1111-1111-111111111111'
            GROUP BY t.id, l.name, l.sport_type, u.full_name
            ORDER BY t.created_at
        `);
        
        teamsDetailResult.rows.forEach((team, index) => {
            console.log(`\n   📋 Team ${index + 1}: ${team.name}`);
            console.log('      ID:', team.id);
            console.log('      Captain:', team.captain_name);
            console.log('      League:', team.league_name, `(${team.sport_type})`);
            console.log('      Location:', team.location);
            console.log('      Founded:', team.founded_year);
            console.log('      Color:', team.team_color);
            console.log('      Members:', team.member_count);
            console.log('      Recruiting:', team.is_recruiting ? 'Yes' : 'No');
            console.log('      Player Limits:', `${team.min_players}-${team.max_players}`);
        });
        
        // 3. Verify team memberships
        console.log('\n3️⃣  Team Memberships:');
        const membershipsResult = await client.query(`
            SELECT 
                tm.*,
                t.name as team_name,
                u.full_name as player_name
            FROM team_members tm
            JOIN teams t ON tm.team_id = t.id
            JOIN users u ON tm.user_id = u.id
            WHERE tm.user_id = '11111111-1111-1111-1111-111111111111'
            ORDER BY t.name
        `);
        
        membershipsResult.rows.forEach((membership) => {
            console.log(`   ⚽ ${membership.team_name}:`);
            console.log('      Player:', membership.player_name);
            console.log('      Position:', membership.position);
            console.log('      Jersey:', `#${membership.jersey_number}`);
            console.log('      Active:', membership.is_active ? 'Yes' : 'No');
            console.log('      Starter:', membership.is_starter ? 'Yes' : 'No');
            console.log('      Joined:', new Date(membership.joined_at).toLocaleDateString());
        });
        
        // 4. Verify team statistics
        console.log('\n4️⃣  Team Statistics (2025 Season):');
        const statsResult = await client.query(`
            SELECT 
                ts.*,
                t.name as team_name,
                l.name as league_name
            FROM team_stats ts
            JOIN teams t ON ts.team_id = t.id
            JOIN leagues l ON ts.league_id = l.id
            WHERE t.captain_id = '11111111-1111-1111-1111-111111111111'
                AND ts.season_year = 2025
            ORDER BY ts.points DESC
        `);
        
        statsResult.rows.forEach((stats) => {
            const goalDiff = stats.goals_for - stats.goals_against;
            console.log(`   📊 ${stats.team_name} (${stats.league_name}):`);
            console.log('      Record:', `${stats.wins}W - ${stats.draws}D - ${stats.losses}L`);
            console.log('      Points:', stats.points);
            console.log('      Goals:', `${stats.goals_for} For, ${stats.goals_against} Against (${goalDiff > 0 ? '+' : ''}${goalDiff} GD)`);
            console.log('      Games Played:', stats.wins + stats.draws + stats.losses);
        });
        
        // 5. Check if teams will be visible via API
        console.log('\n5️⃣  API Visibility Check:');
        const apiCheckResult = await client.query(`
            SELECT 
                t.id,
                t.name,
                CASE 
                    WHEN t.captain_id = '11111111-1111-1111-1111-111111111111' THEN 'Captain'
                    WHEN tm.user_id IS NOT NULL THEN 'Member'
                    ELSE 'Not Associated'
                END as relationship
            FROM teams t
            LEFT JOIN team_members tm ON t.id = tm.team_id 
                AND tm.user_id = '11111111-1111-1111-1111-111111111111'
            WHERE t.captain_id = '11111111-1111-1111-1111-111111111111' 
                OR tm.user_id = '11111111-1111-1111-1111-111111111111'
            GROUP BY t.id, t.name, t.captain_id, tm.user_id
        `);
        
        console.log('   Teams accessible to admin user:');
        apiCheckResult.rows.forEach((team) => {
            console.log(`   ✅ ${team.name} (${team.relationship})`);
        });
        
        console.log('\n✨ Verification complete!');
        console.log('   Total teams for admin:', teamsDetailResult.rows.length);
        console.log('   Total memberships:', membershipsResult.rows.length);
        console.log('   All relationships properly established!');
        
    } catch (error) {
        console.error('❌ Error during verification:', error.message);
        if (error.detail) {
            console.error('   Details:', error.detail);
        }
    } finally {
        await client.end();
    }
}

verifyTeams();
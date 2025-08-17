const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection configuration for local Supabase
const dbConfig = {
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
};

async function seedDatabase() {
    console.log('🚀 Starting database seeding...');
    
    const client = new Client(dbConfig);
    
    try {
        // Connect to the database
        await client.connect();
        console.log('✅ Connected to database');
        
        // Read the SQL file
        const sqlFilePath = path.join(__dirname, '..', 'supabase', 'seed_admin_team.sql');
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
        
        console.log('📄 SQL file loaded successfully');
        
        // Execute the SQL
        console.log('🔄 Executing seed SQL...');
        const result = await client.query(sqlContent);
        console.log('✅ SQL executed successfully');
        
        // Verify the data was inserted
        console.log('\n📊 Verifying inserted data...\n');
        
        // Check if admin user was created
        const userResult = await client.query(`
            SELECT id, email, full_name, role 
            FROM users 
            WHERE id = '11111111-1111-1111-1111-111111111111'
        `);
        
        if (userResult.rows.length > 0) {
            console.log('✅ Admin user created:');
            console.log('   Email:', userResult.rows[0].email);
            console.log('   Name:', userResult.rows[0].full_name);
            console.log('   Role:', userResult.rows[0].role);
        }
        
        // Check teams
        const teamsResult = await client.query(`
            SELECT t.id, t.name, t.location, t.team_color, t.captain_id,
                   l.name as league_name
            FROM teams t
            LEFT JOIN leagues l ON t.league_id = l.id
            WHERE t.captain_id = '11111111-1111-1111-1111-111111111111'
            ORDER BY t.created_at DESC
        `);
        
        console.log('\n✅ Teams created:');
        teamsResult.rows.forEach((team, index) => {
            console.log(`\n   Team ${index + 1}:`);
            console.log('   - ID:', team.id);
            console.log('   - Name:', team.name);
            console.log('   - Location:', team.location);
            console.log('   - Color:', team.team_color);
            console.log('   - League:', team.league_name || 'No league assigned');
        });
        
        // Check team members
        const membersResult = await client.query(`
            SELECT tm.team_id, tm.user_id, tm.position, tm.jersey_number,
                   t.name as team_name
            FROM team_members tm
            JOIN teams t ON tm.team_id = t.id
            WHERE tm.user_id = '11111111-1111-1111-1111-111111111111'
            ORDER BY t.name
        `);
        
        console.log('\n✅ Team memberships created:');
        membersResult.rows.forEach((member) => {
            console.log(`   - ${member.team_name}: Position ${member.position}, Jersey #${member.jersey_number}`);
        });
        
        // Check team stats
        const statsResult = await client.query(`
            SELECT ts.*, t.name as team_name
            FROM team_stats ts
            JOIN teams t ON ts.team_id = t.id
            WHERE t.captain_id = '11111111-1111-1111-1111-111111111111'
            ORDER BY t.name
        `);
        
        console.log('\n✅ Team statistics created:');
        statsResult.rows.forEach((stats) => {
            console.log(`   - ${stats.team_name}: ${stats.wins}W-${stats.draws}D-${stats.losses}L, Points: ${stats.points}`);
        });
        
        console.log('\n🎉 Database seeding completed successfully!');
        console.log('   Admin user: admin@matchday.com');
        console.log('   Password: password123');
        console.log(`   Teams created: ${teamsResult.rows.length}`);
        
    } catch (error) {
        console.error('❌ Error during seeding:', error.message);
        if (error.detail) {
            console.error('   Details:', error.detail);
        }
        process.exit(1);
    } finally {
        await client.end();
        console.log('\n🔌 Database connection closed');
    }
}

seedDatabase();
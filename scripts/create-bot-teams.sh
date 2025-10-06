#!/bin/bash

# Create Bot Teams Script
# Creates two bot teams: "botTeam" and "bot2Team" for MatchDay database

set -e  # Exit on any error

# Load environment variables
if [ -f .env.local ]; then
    export $(grep -v '^#' .env.local | xargs)
fi

# Check if required environment variables exist
if [[ -z "$NEXT_PUBLIC_SUPABASE_URL" || -z "$SUPABASE_SERVICE_ROLE_KEY" ]]; then
    echo "Error: Missing required environment variables"
    echo "Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local"
    exit 1
fi

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== MatchDay Bot Teams Creation Script ===${NC}"
echo ""

# Function to execute SQL with psql via Supabase
execute_sql() {
    local sql="$1"
    local description="$2"
    
    echo -e "${YELLOW}Executing: $description${NC}"
    
    # Use curl to execute SQL via Supabase REST API
    local response=$(curl -s -X POST \
        "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/execute_sql" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
        -d "{\"sql\": \"$sql\"}")
    
    if [[ $response == *"error"* ]]; then
        echo -e "${RED}Error executing SQL: $response${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✓ Success${NC}"
    return 0
}

# Alternative approach - use node.js script to interact with Supabase
cat > /tmp/create_bot_teams.js << 'EOF'
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function createBotTeams() {
    try {
        console.log('🔍 Checking existing teams...');
        
        // First, check existing teams
        const { data: existingTeams, error: teamsError } = await supabase
            .from('teams')
            .select('id, name, league_id, team_color, is_recruiting, created_at');
        
        if (teamsError) {
            console.error('Error fetching teams:', teamsError);
            return;
        }
        
        console.log('📊 Current teams in database:');
        existingTeams.forEach(team => {
            console.log(`  - ${team.name} (ID: ${team.id}) - League: ${team.league_id || 'None'}`);
        });
        
        console.log(`\nTotal teams: ${existingTeams.length}`);
        
        // Check if bot teams already exist
        const botTeamExists = existingTeams.find(t => t.name === 'botTeam');
        const bot2TeamExists = existingTeams.find(t => t.name === 'bot2Team');
        
        if (botTeamExists && bot2TeamExists) {
            console.log('✅ Both bot teams already exist!');
            return;
        }
        
        // Get LaLiga league ID for assignment
        const { data: leagues, error: leaguesError } = await supabase
            .from('leagues')
            .select('id, name, sport_type, league_type')
            .limit(5);
        
        if (leaguesError) {
            console.error('Error fetching leagues:', leaguesError);
            return;
        }
        
        console.log('\n🏆 Available leagues:');
        leagues.forEach(league => {
            console.log(`  - ${league.name} (${league.sport_type}, ${league.league_type}) - ID: ${league.id}`);
        });
        
        // Use LaLiga if available, otherwise use the first available league
        const laLiga = leagues.find(l => l.name.toLowerCase().includes('laliga')) || leagues[0];
        
        console.log(`\n🎯 Using league: ${laLiga ? laLiga.name : 'None'}`);
        
        // Create bot teams data
        const teamsToCreate = [];
        
        if (!botTeamExists) {
            teamsToCreate.push({
                name: 'botTeam',
                league_id: laLiga?.id || null,
                team_color: '#FF6B35', // Orange color
                team_bio: 'AI-powered bot team for testing and demonstrations',
                is_recruiting: true,
                max_players: 15,
                min_players: 11,
                is_archived: false
            });
        }
        
        if (!bot2TeamExists) {
            teamsToCreate.push({
                name: 'bot2Team',
                league_id: laLiga?.id || null,
                team_color: '#4ECDC4', // Teal color
                team_bio: 'Second AI-powered bot team for enhanced testing scenarios',
                is_recruiting: true,
                max_players: 15,
                min_players: 11,
                is_archived: false
            });
        }
        
        if (teamsToCreate.length === 0) {
            console.log('ℹ️ No teams need to be created.');
            return;
        }
        
        console.log(`\n🚀 Creating ${teamsToCreate.length} bot team(s)...`);
        
        // Insert teams
        const { data: newTeams, error: insertError } = await supabase
            .from('teams')
            .insert(teamsToCreate)
            .select();
        
        if (insertError) {
            console.error('❌ Error creating teams:', insertError);
            return;
        }
        
        console.log('✅ Bot teams created successfully!');
        newTeams.forEach(team => {
            console.log(`  ✓ ${team.name} (ID: ${team.id})`);
        });
        
        // Create bot users if needed
        console.log('\n👥 Creating bot users for teams...');
        
        const botUsers = [
            {
                id: '00000000-0000-0000-0000-000000000001',
                full_name: 'Bot Player 1',
                display_name: 'BotPlayer1',
                bio: 'AI-powered bot player for testing',
                preferred_position: 'Forward',
                avatar_url: null
            },
            {
                id: '00000000-0000-0000-0000-000000000002',
                full_name: 'Bot Player 2',
                display_name: 'BotPlayer2',
                bio: 'AI-powered bot player for testing',
                preferred_position: 'Midfielder',
                avatar_url: null
            },
            {
                id: '00000000-0000-0000-0000-000000000003',
                full_name: 'Bot Player 3',
                display_name: 'BotPlayer3',
                bio: 'AI-powered bot player for testing',
                preferred_position: 'Defender',
                avatar_url: null
            },
            {
                id: '00000000-0000-0000-0000-000000000004',
                full_name: 'Bot Player 4',
                display_name: 'BotPlayer4',
                bio: 'AI-powered bot player for testing',
                preferred_position: 'Goalkeeper',
                avatar_url: null
            }
        ];
        
        // Check if bot users already exist
        const { data: existingUsers } = await supabase
            .from('user_profiles')
            .select('id, display_name')
            .in('id', botUsers.map(u => u.id));
        
        const existingUserIds = existingUsers?.map(u => u.id) || [];
        const usersToCreate = botUsers.filter(u => !existingUserIds.includes(u.id));
        
        if (usersToCreate.length > 0) {
            const { error: usersError } = await supabase
                .from('user_profiles')
                .insert(usersToCreate);
            
            if (usersError && !usersError.message.includes('duplicate')) {
                console.error('⚠️ Warning: Error creating bot users:', usersError);
            } else {
                console.log(`✅ Created ${usersToCreate.length} bot users`);
            }
        } else {
            console.log('ℹ️ Bot users already exist');
        }
        
        // Add bot users to teams
        const teamMembers = [];
        const createdTeamIds = newTeams.map(t => t.id);
        
        // Add 2 bot players to each team
        createdTeamIds.forEach((teamId, teamIndex) => {
            const startIndex = teamIndex * 2;
            for (let i = startIndex; i < startIndex + 2 && i < botUsers.length; i++) {
                teamMembers.push({
                    team_id: teamId,
                    user_id: botUsers[i].id,
                    position: botUsers[i].preferred_position,
                    jersey_number: (i % 4) + 1,
                    is_active: true
                });
            }
        });
        
        if (teamMembers.length > 0) {
            const { error: membersError } = await supabase
                .from('team_members')
                .insert(teamMembers);
            
            if (membersError && !membersError.message.includes('duplicate')) {
                console.error('⚠️ Warning: Error adding team members:', membersError);
            } else {
                console.log(`✅ Added ${teamMembers.length} bot players to teams`);
            }
        }
        
        // Verify final state
        console.log('\n📊 Final verification...');
        const { data: finalTeams } = await supabase
            .from('teams')
            .select(`
                id, name, league_id, team_color, is_recruiting,
                team_members (
                    user_id,
                    position,
                    jersey_number,
                    user_profiles (display_name)
                )
            `)
            .in('name', ['botTeam', 'bot2Team']);
        
        finalTeams?.forEach(team => {
            console.log(`\n🏆 ${team.name}:`);
            console.log(`   ID: ${team.id}`);
            console.log(`   League: ${team.league_id || 'None'}`);
            console.log(`   Color: ${team.team_color}`);
            console.log(`   Recruiting: ${team.is_recruiting}`);
            console.log(`   Members: ${team.team_members?.length || 0}`);
            
            team.team_members?.forEach(member => {
                console.log(`     - ${member.user_profiles?.display_name} (#${member.jersey_number}, ${member.position})`);
            });
        });
        
        console.log('\n🎉 Bot teams creation completed successfully!');
        
    } catch (error) {
        console.error('💥 Unexpected error:', error);
        process.exit(1);
    }
}

createBotTeams();
EOF

# Execute the Node.js script
echo -e "${BLUE}Executing bot teams creation...${NC}"
node /tmp/create_bot_teams.js

# Clean up temporary file
rm -f /tmp/create_bot_teams.js

echo -e "${GREEN}🎊 Bot teams creation script completed!${NC}"
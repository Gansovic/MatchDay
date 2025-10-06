#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

// Use local Supabase configuration
const supabaseUrl = 'http://127.0.0.1:54321';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, serviceKey);

async function createBotTeams() {
    try {
        console.log('🔍 Checking existing teams in LOCAL Supabase...');
        
        // First, check existing teams
        const { data: existingTeams, error: teamsError } = await supabase
            .from('teams')
            .select('id, name, league_id, team_color, is_recruiting');
        
        if (teamsError) {
            console.error('❌ Error fetching teams:', teamsError);
            return;
        }
        
        console.log('📊 Current teams in local database:');
        existingTeams.forEach(team => {
            console.log(`  - ${team.name} (ID: ${team.id.substring(0, 8)}...)`);
        });
        
        console.log(`\nTotal teams: ${existingTeams.length}`);
        
        // Check if bot teams already exist
        const botTeamExists = existingTeams.find(t => t.name === 'botTeam');
        const bot2TeamExists = existingTeams.find(t => t.name === 'bot2Team');
        
        if (botTeamExists && bot2TeamExists) {
            console.log('✅ Both bot teams already exist!');
            console.log(`  - botTeam: ${botTeamExists.id.substring(0, 8)}...`);
            console.log(`  - bot2Team: ${bot2TeamExists.id.substring(0, 8)}...`);
            
            // Still check their members
            await verifyTeamMembers(botTeamExists.id, bot2TeamExists.id);
            return;
        }
        
        // Get leagues for assignment
        const { data: leagues, error: leaguesError } = await supabase
            .from('leagues')
            .select('id, name, sport_type, league_type');
        
        if (leaguesError) {
            console.error('❌ Error fetching leagues:', leaguesError);
            return;
        }
        
        console.log('\n🏆 Available leagues:');
        leagues.forEach(league => {
            console.log(`  - ${league.name} (${league.sport_type}) - ID: ${league.id.substring(0, 8)}...`);
        });
        
        // Use the first available league or create teams without league
        const selectedLeague = leagues[0];
        console.log(`\n🎯 Using league: ${selectedLeague ? selectedLeague.name : 'None (independent teams)'}`);
        
        // Create bot teams data
        const teamsToCreate = [];
        
        if (!botTeamExists) {
            teamsToCreate.push({
                name: 'botTeam',
                league_id: selectedLeague?.id || null,
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
                league_id: selectedLeague?.id || null,
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
        
        console.log(`\n🚀 Creating ${teamsToCreate.length} bot team(s) in local database...`);
        
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
            console.log(`  ✓ ${team.name} (ID: ${team.id.substring(0, 8)}...)`);
        });
        
        // Create bot users if needed
        await createBotUsers(newTeams);
        
        console.log('\n🎉 Bot teams creation completed successfully!');
        
    } catch (error) {
        console.error('💥 Unexpected error:', error);
        process.exit(1);
    }
}

async function createBotUsers(teams) {
    console.log('\n👥 Creating bot users for teams...');
    
    // Create users in the application users table
    const appUsers = [
        {
            id: '00000000-0000-0000-0000-000000000001',
            email: 'bot1@matchday.test',
            full_name: 'Bot Player 1',
            position: 'forward',
            bio: 'AI-powered bot player for testing'
        },
        {
            id: '00000000-0000-0000-0000-000000000002',
            email: 'bot2@matchday.test',
            full_name: 'Bot Player 2',
            position: 'midfielder',
            bio: 'AI-powered bot player for testing'
        },
        {
            id: '00000000-0000-0000-0000-000000000003',
            email: 'bot3@matchday.test',
            full_name: 'Bot Player 3',
            position: 'defender',
            bio: 'AI-powered bot player for testing'
        },
        {
            id: '00000000-0000-0000-0000-000000000004',
            email: 'bot4@matchday.test',
            full_name: 'Bot Player 4',
            position: 'goalkeeper',
            bio: 'AI-powered bot player for testing'
        }
    ];

    const userProfiles = [
        {
            id: '00000000-0000-0000-0000-000000000001',
            full_name: 'Bot Player 1',
            display_name: 'BotPlayer1',
            bio: 'AI-powered bot player for testing',
            preferred_position: 'forward',
            avatar_url: null
        },
        {
            id: '00000000-0000-0000-0000-000000000002',
            full_name: 'Bot Player 2',
            display_name: 'BotPlayer2',
            bio: 'AI-powered bot player for testing',
            preferred_position: 'midfielder',
            avatar_url: null
        },
        {
            id: '00000000-0000-0000-0000-000000000003',
            full_name: 'Bot Player 3',
            display_name: 'BotPlayer3',
            bio: 'AI-powered bot player for testing',
            preferred_position: 'defender',
            avatar_url: null
        },
        {
            id: '00000000-0000-0000-0000-000000000004',
            full_name: 'Bot Player 4',
            display_name: 'BotPlayer4',
            bio: 'AI-powered bot player for testing',
            preferred_position: 'goalkeeper',
            avatar_url: null
        }
    ];
    
    // Check if bot users already exist in the users table
    const { data: existingAppUsers } = await supabase
        .from('users')
        .select('id, email')
        .in('id', appUsers.map(u => u.id));
    
    const existingAppUserIds = existingAppUsers?.map(u => u.id) || [];
    const appUsersToCreate = appUsers.filter(u => !existingAppUserIds.includes(u.id));
    
    // Create users in application users table first
    if (appUsersToCreate.length > 0) {
        const { error: appUsersError } = await supabase
            .from('users')
            .insert(appUsersToCreate);
        
        if (appUsersError && !appUsersError.message.includes('duplicate')) {
            console.error('⚠️ Warning: Error creating app users:', appUsersError);
        } else {
            console.log(`✅ Created ${appUsersToCreate.length} app users`);
        }
    } else {
        console.log('ℹ️ App users already exist');
    }
    
    // Check if bot user profiles already exist
    const { data: existingProfiles } = await supabase
        .from('user_profiles')
        .select('id, display_name')
        .in('id', userProfiles.map(u => u.id));
    
    const existingProfileIds = existingProfiles?.map(u => u.id) || [];
    const profilesToCreate = userProfiles.filter(u => !existingProfileIds.includes(u.id));
    
    // Create user profiles
    if (profilesToCreate.length > 0) {
        const { error: profilesError } = await supabase
            .from('user_profiles')
            .insert(profilesToCreate);
        
        if (profilesError && !profilesError.message.includes('duplicate')) {
            console.error('⚠️ Warning: Error creating user profiles:', profilesError);
        } else {
            console.log(`✅ Created ${profilesToCreate.length} user profiles`);
        }
    } else {
        console.log('ℹ️ User profiles already exist');
    }
    
    // Add bot users to teams
    const teamMembers = [];
    
    // Add 2 bot players to each team
    teams.forEach((team, teamIndex) => {
        const startIndex = teamIndex * 2;
        for (let i = startIndex; i < startIndex + 2 && i < appUsers.length; i++) {
            teamMembers.push({
                team_id: team.id,
                user_id: appUsers[i].id,
                position: appUsers[i].position,
                jersey_number: (i % 11) + 1, // Jersey numbers 1-11
                is_active: true,
                status: 'active'
            });
        }
    });
    
    if (teamMembers.length > 0) {
        console.log(`\n🔗 Adding ${teamMembers.length} bot players to teams...`);
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
    await verifyTeamMembers(...teams.map(t => t.id));
}

async function verifyTeamMembers(...teamIds) {
    console.log('\n📊 Final verification...');
    const { data: finalTeams } = await supabase
        .from('teams')
        .select(`
            id, name, league_id, team_color, is_recruiting,
            team_members (
                user_id,
                position,
                jersey_number,
                status,
                is_active
            )
        `)
        .in('id', teamIds);
    
    // Get user profiles for the members
    for (const team of finalTeams || []) {
        if (team.team_members?.length > 0) {
            const userIds = team.team_members.map(m => m.user_id);
            const { data: profiles } = await supabase
                .from('user_profiles')
                .select('id, display_name')
                .in('id', userIds);
            
            team.team_members = team.team_members.map(member => ({
                ...member,
                display_name: profiles?.find(p => p.id === member.user_id)?.display_name || 'Unknown'
            }));
        }
    }
    
    finalTeams?.forEach(team => {
        console.log(`\n🏆 ${team.name}:`);
        console.log(`   ID: ${team.id.substring(0, 8)}...`);
        console.log(`   League: ${team.league_id ? team.league_id.substring(0, 8) + '...' : 'None'}`);
        console.log(`   Color: ${team.team_color}`);
        console.log(`   Recruiting: ${team.is_recruiting ? 'Yes' : 'No'}`);
        console.log(`   Members: ${team.team_members?.length || 0}`);
        
        team.team_members?.forEach(member => {
            console.log(`     - ${member.display_name} (#${member.jersey_number}, ${member.position}) - Status: ${member.status}`);
        });
    });
}

console.log('🤖 MatchDay Bot Teams Creation Script (Local Supabase)');
console.log('====================================================\n');

createBotTeams();
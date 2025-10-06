#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('❌ Missing environment variables');
    console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
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
            console.error('❌ Error fetching teams:', teamsError);
            return;
        }
        
        console.log('📊 Current teams in database:');
        existingTeams.forEach(team => {
            console.log(`  - ${team.name} (ID: ${team.id.substring(0, 8)}...) - League: ${team.league_id ? team.league_id.substring(0, 8) + '...' : 'None'}`);
        });
        
        console.log(`\nTotal teams: ${existingTeams.length}`);
        
        // Check if bot teams already exist
        const botTeamExists = existingTeams.find(t => t.name === 'botTeam');
        const bot2TeamExists = existingTeams.find(t => t.name === 'bot2Team');
        
        if (botTeamExists && bot2TeamExists) {
            console.log('✅ Both bot teams already exist!');
            console.log(`  - botTeam: ${botTeamExists.id.substring(0, 8)}...`);
            console.log(`  - bot2Team: ${bot2TeamExists.id.substring(0, 8)}...`);
            return;
        }
        
        // Get leagues for assignment
        const { data: leagues, error: leaguesError } = await supabase
            .from('leagues')
            .select('id, name, sport_type, league_type')
            .limit(5);
        
        if (leaguesError) {
            console.error('❌ Error fetching leagues:', leaguesError);
            return;
        }
        
        console.log('\n🏆 Available leagues:');
        leagues.forEach(league => {
            console.log(`  - ${league.name} (${league.sport_type}, ${league.league_type}) - ID: ${league.id.substring(0, 8)}...`);
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
            console.log(`  ✓ ${team.name} (ID: ${team.id.substring(0, 8)}...)`);
        });
        
        // Create bot users if needed
        console.log('\n👥 Creating bot users for teams...');
        
        // First, create auth users (in auth.users table)
        const authUsers = [
            {
                id: '00000000-0000-0000-0000-000000000001',
                email: 'bot1@matchday.test',
                password: 'botpassword123',
                email_confirmed_at: new Date().toISOString(),
                confirmed_at: new Date().toISOString()
            },
            {
                id: '00000000-0000-0000-0000-000000000002',
                email: 'bot2@matchday.test', 
                password: 'botpassword123',
                email_confirmed_at: new Date().toISOString(),
                confirmed_at: new Date().toISOString()
            },
            {
                id: '00000000-0000-0000-0000-000000000003',
                email: 'bot3@matchday.test',
                password: 'botpassword123',
                email_confirmed_at: new Date().toISOString(),
                confirmed_at: new Date().toISOString()
            },
            {
                id: '00000000-0000-0000-0000-000000000004',
                email: 'bot4@matchday.test',
                password: 'botpassword123',
                email_confirmed_at: new Date().toISOString(),
                confirmed_at: new Date().toISOString()
            }
        ];

        // Create users in the application users table
        const appUsers = [
            {
                id: '00000000-0000-0000-0000-000000000001',
                email: 'bot1@matchday.test',
                full_name: 'Bot Player 1',
                position: 'Forward',
                bio: 'AI-powered bot player for testing'
            },
            {
                id: '00000000-0000-0000-0000-000000000002',
                email: 'bot2@matchday.test',
                full_name: 'Bot Player 2',
                position: 'Midfielder', 
                bio: 'AI-powered bot player for testing'
            },
            {
                id: '00000000-0000-0000-0000-000000000003',
                email: 'bot3@matchday.test',
                full_name: 'Bot Player 3',
                position: 'Defender',
                bio: 'AI-powered bot player for testing'
            },
            {
                id: '00000000-0000-0000-0000-000000000004',
                email: 'bot4@matchday.test',
                full_name: 'Bot Player 4',
                position: 'Goalkeeper',
                bio: 'AI-powered bot player for testing'
            }
        ];

        const userProfiles = [
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
        const createdTeamIds = newTeams.map(t => t.id);
        
        // Add 2 bot players to each team
        createdTeamIds.forEach((teamId, teamIndex) => {
            const startIndex = teamIndex * 2;
            for (let i = startIndex; i < startIndex + 2 && i < appUsers.length; i++) {
                teamMembers.push({
                    team_id: teamId,
                    user_id: appUsers[i].id,
                    position: appUsers[i].position,
                    jersey_number: (i % 11) + 1, // Jersey numbers 1-11
                    is_active: true,
                    status: 'active'
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
                    status,
                    is_active
                )
            `)
            .in('name', ['botTeam', 'bot2Team']);
        
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
            console.log(`   ID: ${team.id}`);
            console.log(`   League: ${team.league_id || 'None'}`);
            console.log(`   Color: ${team.team_color}`);
            console.log(`   Recruiting: ${team.is_recruiting ? 'Yes' : 'No'}`);
            console.log(`   Members: ${team.team_members?.length || 0}`);
            
            team.team_members?.forEach(member => {
                console.log(`     - ${member.display_name} (#${member.jersey_number}, ${member.position}) - Status: ${member.status}`);
            });
        });
        
        console.log('\n🎉 Bot teams creation completed successfully!');
        
    } catch (error) {
        console.error('💥 Unexpected error:', error);
        process.exit(1);
    }
}

console.log('🤖 MatchDay Bot Teams Creation Script');
console.log('=====================================\n');

createBotTeams();
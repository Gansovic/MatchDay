/**
 * Script to create admin user using Supabase Admin API
 */

import { createAdminClient } from '../src/lib/supabase/client.js';

async function createAdminUser() {
  try {
    const supabase = createAdminClient();
    
    console.log('Creating admin user...');
    
    // Create user using Supabase Admin API
    const { data: user, error: createError } = await supabase.auth.admin.createUser({
      email: 'admin@matchday.com',
      password: 'password123',
      email_confirm: true,
      user_metadata: {
        full_name: 'Admin User'
      }
    });
    
    if (createError) {
      console.error('Error creating user:', createError);
      return;
    }
    
    console.log('Admin user created successfully:', user.user.id);
    
    // Update user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        id: user.user.id,
        full_name: 'Admin User',
        bio: 'MatchDay Administrator',
        phone: '+1234567890'
      });
    
    if (profileError) {
      console.error('Error creating profile:', profileError);
    } else {
      console.log('User profile created successfully');
    }
    
    // Update teams to use the new user ID
    const { error: teamsError } = await supabase
      .from('teams')
      .update({ captain_id: user.user.id })
      .eq('captain_id', '11111111-1111-1111-1111-111111111111');
    
    if (teamsError) {
      console.error('Error updating teams:', teamsError);
    } else {
      console.log('Teams updated with new admin user ID');
    }
    
    // Update team members
    const { error: membersError } = await supabase
      .from('team_members')
      .update({ user_id: user.user.id })
      .eq('user_id', '11111111-1111-1111-1111-111111111111');
    
    if (membersError) {
      console.error('Error updating team members:', membersError);
    } else {
      console.log('Team members updated with new admin user ID');
    }
    
    console.log('\n✅ Admin user setup complete!');
    console.log('Email: admin@matchday.com');
    console.log('Password: password123');
    console.log('User ID:', user.user.id);
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createAdminUser();
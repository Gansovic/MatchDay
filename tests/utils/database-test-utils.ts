/**
 * Database Test Utilities
 * 
 * Provides utilities for setting up and tearing down test data,
 * creating test clients, and managing database state during tests.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/types/database.types';

export interface TestUser {
  id: string;
  email: string;
  access_token: string;
  profile?: {
    id: string;
    display_name: string;
    full_name: string;
  };
}

export interface TestLeague {
  id: string;
  name: string;
  sport_type: string;
  league_type: string;
  is_active: boolean;
  is_public: boolean;
}

export interface TestTeam {
  id: string;
  name: string;
  league_id: string;
  captain_id: string;
  team_color: string;
  max_players: number;
  min_players: number;
}

/**
 * Create a test Supabase client with service role permissions
 */
export function createTestClient(): SupabaseClient<Database> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables for testing');
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    global: {
      headers: {
        'X-Client-Info': 'matchday-test@1.0.0'
      }
    }
  });
}

/**
 * Create a test user in Supabase Auth and return the user details
 */
export async function createTestUser(
  supabase: SupabaseClient<Database>,
  userData: {
    email: string;
    password: string;
    display_name?: string;
    full_name?: string;
  }
): Promise<TestUser> {
  try {
    // Create user in auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        full_name: userData.full_name || 'Test User',
        display_name: userData.display_name || 'Test User'
      }
    });

    if (authError || !authData.user) {
      throw new Error(`Database error creating new user: ${authError?.message || 'Unknown auth error'}`);
    }

    console.log(`Successfully created auth user: ${authData.user.id}`);

    // Wait a moment for auth user to be fully created
    await new Promise(resolve => setTimeout(resolve, 100));

    // Create user profile in public.users table (actual table used by the app)
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: userData.email,
        full_name: userData.full_name || 'Test Full Name',
        role: 'player',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      console.warn(`User profile creation failed: ${profileError.message}`);
      // Don't throw error as the user creation succeeded
    } else {
      console.log(`✅ User profile created in users table`);
    }

    // Generate a session for the user
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'invite',
      email: userData.email,
    });

    if (sessionError) {
      console.warn(`Session generation warning: ${sessionError.message}`);
    }

    // Create a proper mock JWT token for testing
    const accessToken = createMockAuthToken(authData.user.id);

    return {
      id: authData.user.id,
      email: userData.email,
      access_token: accessToken,
      profile: {
        id: authData.user.id,
        display_name: userData.display_name || 'Test User',
        full_name: userData.full_name || 'Test Full Name',
      }
    };
  } catch (error) {
    console.error('Error in createTestUser:', error);
    throw new Error(`Failed to create test user: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create a test league
 */
export async function createTestLeague(
  supabase: SupabaseClient<Database>,
  leagueData: {
    name: string;
    sport_type?: string;
    league_type?: string;
    location?: string;
    is_active?: boolean;
    is_public?: boolean;
  }
): Promise<TestLeague> {
  const { data, error } = await supabase
    .from('leagues')
    .insert({
      name: leagueData.name,
      sport_type: leagueData.sport_type || 'football',
      league_type: leagueData.league_type || 'competitive',
      location: leagueData.location || 'Test City',
      is_active: leagueData.is_active ?? true,
      is_public: leagueData.is_public ?? true,
      description: `Test league: ${leagueData.name}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test league: ${error.message}`);
  }

  return data;
}

/**
 * Create a test team
 */
export async function createTestTeam(
  supabase: SupabaseClient<Database>,
  teamData: {
    name: string;
    league_id: string;
    captain_id: string;
    team_color?: string;
    max_players?: number;
    min_players?: number;
  }
): Promise<TestTeam> {
  const { data, error } = await supabase
    .from('teams')
    .insert({
      name: teamData.name,
      league_id: teamData.league_id,
      captain_id: teamData.captain_id,
      team_color: teamData.team_color || '#2563eb',
      max_players: teamData.max_players || 22,
      min_players: teamData.min_players || 7,
      is_recruiting: true,
      team_bio: `Test team: ${teamData.name}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test team: ${error.message}`);
  }

  return data;
}

/**
 * Add a user to a team as a member
 */
export async function addTeamMember(
  supabase: SupabaseClient<Database>,
  teamId: string,
  userId: string,
  options: {
    position?: string;
    jersey_number?: number;
    is_active?: boolean;
  } = {}
): Promise<void> {
  const { error } = await supabase
    .from('team_members')
    .insert({
      team_id: teamId,
      user_id: userId,
      position: options.position || 'midfielder',
      jersey_number: options.jersey_number || 1,
      is_active: options.is_active ?? true,
      joined_at: new Date().toISOString(),
    });

  if (error) {
    throw new Error(`Failed to add team member: ${error.message}`);
  }
}

/**
 * Clean up test data - removes all test entities created during testing
 */
export async function cleanupTestData(
  supabase: SupabaseClient<Database>,
  options: {
    userIds?: string[];
    teamIds?: string[];
    leagueIds?: string[];
    cleanupAll?: boolean;
  } = {}
): Promise<void> {
  try {
    // If cleanupAll is true, clean up all test data
    if (options.cleanupAll) {
      // Delete team members first (foreign key constraint)
      await supabase
        .from('team_members')
        .delete()
        .like('team_id', 'test-%');

      // Delete teams
      await supabase
        .from('teams')
        .delete()
        .like('name', 'Test Team%');

      // Delete leagues
      await supabase
        .from('leagues')
        .delete()
        .like('name', 'Test League%');

      // Delete user profiles from public.users
      await supabase
        .from('users')
        .delete()
        .like('full_name', 'Test User%');

      return;
    }

    // Clean up specific entities
    if (options.teamIds?.length) {
      // Delete team members first
      await supabase
        .from('team_members')
        .delete()
        .in('team_id', options.teamIds);

      // Delete teams
      await supabase
        .from('teams')
        .delete()
        .in('id', options.teamIds);
    }

    if (options.leagueIds?.length) {
      await supabase
        .from('leagues')
        .delete()
        .in('id', options.leagueIds);
    }

    if (options.userIds?.length) {
      // Delete user profiles from public.users
      await supabase
        .from('users')
        .delete()
        .in('id', options.userIds);

      // Delete users from auth (this might fail in test environment, so we catch it)
      for (const userId of options.userIds) {
        try {
          await supabase.auth.admin.deleteUser(userId);
        } catch (error) {
          console.warn(`Failed to delete auth user ${userId}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Error during cleanup:', error);
    // Don't throw during cleanup to avoid masking test failures
  }
}

/**
 * Wait for a condition to be met (useful for async operations)
 */
export async function waitFor(
  condition: () => Promise<boolean>,
  options: {
    timeout?: number;
    interval?: number;
  } = {}
): Promise<void> {
  const timeout = options.timeout || 5000;
  const interval = options.interval || 100;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error(`Condition not met within ${timeout}ms timeout`);
}

/**
 * Generate unique test names to avoid conflicts
 */
export function generateTestName(prefix: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix} ${timestamp}-${random}`;
}

/**
 * Verify that a team exists with correct data
 */
export async function verifyTeamExists(
  supabase: SupabaseClient<Database>,
  teamId: string
): Promise<TestTeam> {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('id', teamId)
    .single();

  if (error) {
    throw new Error(`Failed to verify team exists: ${error.message}`);
  }

  if (!data) {
    throw new Error(`Team with ID ${teamId} does not exist`);
  }

  return data as TestTeam;
}

/**
 * Verify that a team member relationship exists
 */
export async function verifyTeamMemberExists(
  supabase: SupabaseClient<Database>,
  teamId: string,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('team_members')
    .select('id')
    .eq('team_id', teamId)
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to verify team member: ${error.message}`);
  }

  return !!data;
}

/**
 * Create a mock JWT token for testing authenticated requests
 */
export function createMockAuthToken(userId: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const payload = Buffer.from(JSON.stringify({
    sub: userId,
    aud: 'authenticated',
    exp: Math.floor(Date.now() / 1000) + 3600, // Expires in 1 hour
    iat: Math.floor(Date.now() / 1000),
    iss: 'supabase',
    role: 'authenticated'
  })).toString('base64');
  
  // Note: This is a mock token for testing, not a real signed JWT
  const signature = 'mock-signature-for-testing';
  
  return `${header}.${payload}.${signature}`;
}
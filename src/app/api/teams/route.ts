/**
 * Teams API Routes
 * 
 * Handles team-related API operations:
 * - POST /api/teams - Create a new team
 * - GET /api/teams - Get teams for the authenticated user
 */

import { NextRequest, NextResponse } from 'next/server';
import { TeamService } from '@/lib/services/team.service';
import jwt from 'jsonwebtoken';
import { createServerSupabaseClient, createUserSupabaseClient } from '@/lib/supabase/server-client';

interface CreateTeamRequest {
  name: string;
  sport?: string; // Optional since we default to football
  league: string;
  description?: string;
  maxMembers?: number;
  location?: string;
  color?: string;
}

interface TeamCreationValidationError {
  field: string;
  message: string;
}

interface CleanTeamData {
  name: string;
  league_id: string;
  league: string;
  description?: string;
  max_players?: number;
  min_players?: number;
  team_color?: string;
}


/**
 * Validate team creation request data
 */
function validateTeamCreationRequest(data: any): {
  isValid: boolean;
  errors: TeamCreationValidationError[];
  cleanData?: CleanTeamData;
} {
  const errors: TeamCreationValidationError[] = [];

  // Required fields validation
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Team name is required' });
  } else if (data.name.trim().length < 2) {
    errors.push({ field: 'name', message: 'Team name must be at least 2 characters long' });
  } else if (data.name.trim().length > 50) {
    errors.push({ field: 'name', message: 'Team name must be less than 50 characters' });
  }

  // Sport is no longer required - we default to football

  // League is now optional - teams can be independent

  // Optional fields validation
  if (data.description && (typeof data.description !== 'string' || data.description.length > 500)) {
    errors.push({ field: 'description', message: 'Description must be less than 500 characters' });
  }

  if (data.maxMembers && (typeof data.maxMembers !== 'number' || data.maxMembers < 5 || data.maxMembers > 50)) {
    errors.push({ field: 'maxMembers', message: 'Max members must be between 5 and 50' });
  }

  if (data.location && (typeof data.location !== 'string' || data.location.length > 100)) {
    errors.push({ field: 'location', message: 'Location must be less than 100 characters' });
  }

  // Validate color format (should be hex color code)
  if (data.color && (typeof data.color !== 'string' || !/^#[0-9A-Fa-f]{6}$/.test(data.color))) {
    errors.push({ field: 'color', message: 'Color must be a valid hex color code (e.g., #FF5733)' });
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  // Clean and format the data
  const cleanData: CleanTeamData = {
    name: data.name.trim(),
    league_id: '', // Will be resolved from league name if provided
    league: data.league?.trim() || '', // Allow empty league
    description: data.description?.trim() || undefined,
    max_players: data.maxMembers || 22, // Default football squad size
    min_players: 7, // Default football minimum players
    team_color: data.color || '#2563eb' // Default blue color (matches Tailwind blue-600)
  };

  return { isValid: true, errors: [], cleanData };
}

// Football-only app - no need for sport-specific defaults

/**
 * GET /api/teams
 * Get teams for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Extract authenticated user ID from request
    const authHeader = request.headers.get('authorization');
    let userId: string | null = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      
      try {
        // In development, we can extract user ID from the Supabase JWT token
        const jwtSecret = process.env.SUPABASE_JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const decoded = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] }) as any;
        userId = decoded.sub;
        console.log('✅ Extracted user ID from token:', userId);
      } catch (jwtError) {
        console.log('⚠️ JWT verification failed, trying fallback approach:', jwtError.message);
      }
    }
    
    // Fallback: Create a Supabase client with user context to get current user
    if (!userId) {
      try {
        const supabaseUserClient = createUserSupabaseClient(request);
        const { data: { user }, error: userError } = await supabaseUserClient.auth.getUser();
        
        if (userError || !user) {
          return NextResponse.json(
            { error: 'Authentication required', message: 'Please log in to view your teams' },
            { status: 401 }
          );
        }
        
        userId = user.id;
        console.log('✅ Got user ID from Supabase auth context:', userId);
      } catch (error) {
        console.error('Failed to get authenticated user:', error);
        return NextResponse.json(
          { error: 'Authentication error', message: 'Failed to verify user authentication' },
          { status: 401 }
        );
      }
    }

    // Use TeamService to get user teams
    const teamService = new TeamService();
    const result = await teamService.getUserTeams(userId, { includeInactive: false });
    
    if (!result.success || !result.data) {
      console.error('Error fetching user teams:', result.error);
      return NextResponse.json(
        { error: 'Failed to fetch teams', message: result.error || 'Could not retrieve your teams' },
        { status: 500 }
      );
    }

    // Convert to API response format
    const teams = result.data.map(team => ({
      id: team.id,
      name: team.name,
      league: { 
        name: team.league?.name || 'Independent', 
        id: team.league?.id || null 
      },
      sport: 'football',
      max_players: team.maxPlayers || 22,
      current_members: team.memberCount || 0,
      team_color: team.teamColor,
      team_bio: team.teamBio,
      created_at: team.createdAt,
      captain_id: team.captainId,
      memberCount: team.memberCount || 0,
      stats: team.stats || null
    }));

    return NextResponse.json({
      data: teams,
      message: 'Teams retrieved successfully'
    });

  } catch (error) {
    console.error('Error in GET /api/teams:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teams
 * Create a new team
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    let requestData: CreateTeamRequest;
    try {
      requestData = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid request body', message: 'Request body must be valid JSON' },
        { status: 400 }
      );
    }

    // Validate the request data
    const validation = validateTeamCreationRequest(requestData);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          message: 'Please check your input and try again',
          validationErrors: validation.errors
        },
        { status: 400 }
      );
    }

    const teamData = validation.cleanData!;

    // Extract authenticated user ID from request
    const authHeader = request.headers.get('authorization');
    let captainId: string | null = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      
      try {
        // In development, we can extract user ID from the Supabase JWT token
        const jwtSecret = process.env.SUPABASE_JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const decoded = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] }) as any;
        captainId = decoded.sub;
        console.log('✅ Extracted user ID from token:', captainId);
      } catch (jwtError) {
        console.log('⚠️ JWT verification failed, trying fallback approach:', jwtError.message);
      }
    }
    
    // Fallback: Create a Supabase client with user context to get current user
    if (!captainId) {
      try {
        const supabaseUserClient = createUserSupabaseClient(request);
        const { data: { user }, error: userError } = await supabaseUserClient.auth.getUser();
        
        if (userError || !user) {
          return NextResponse.json(
            { error: 'Authentication required', message: 'Please log in to create a team' },
            { status: 401 }
          );
        }
        
        captainId = user.id;
        console.log('✅ Got user ID from Supabase auth context:', captainId);
      } catch (error) {
        console.error('Failed to get authenticated user:', error);
        return NextResponse.json(
          { error: 'Authentication error', message: 'Failed to verify user authentication' },
          { status: 401 }
        );
      }
    }

    // Use Supabase to create team
    const supabase = createServerSupabaseClient();
    
    // Ensure the user exists in the users table (required for foreign key constraint)
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('id')
      .eq('id', captainId)
      .single();
    
    if (userCheckError || !existingUser) {
      // User doesn't exist in users table, create a basic profile
      console.log('Creating user profile for captain:', captainId);
      const { error: userCreateError } = await supabase
        .from('users')
        .insert({
          id: captainId,
          email: 'unknown@email.com', // Will be updated when user updates profile
          display_name: 'Team Captain'
        });
      
      if (userCreateError) {
        console.error('Failed to create user profile:', userCreateError);
        return NextResponse.json(
          { error: 'User setup failed', message: 'Could not prepare user account for team creation' },
          { status: 500 }
        );
      }
    }
    
    // Find the league by name (if provided)
    let league = null;
    if (teamData.league && teamData.league.trim().length > 0) {
      const { data: leagueData, error: leagueError } = await supabase
        .from('leagues')
        .select('id, name')
        .eq('name', teamData.league)
        .eq('is_active', true)
        .single();
      
      if (leagueError || !leagueData) {
        console.error('League not found:', teamData.league, leagueError);
        return NextResponse.json(
          { 
            error: 'League not found', 
            message: `League '${teamData.league}' not found or is not active`,
            validationErrors: [{ field: 'league', message: 'Selected league does not exist' }]
          },
          { status: 400 }
        );
      }
      
      league = leagueData;
      console.log('✅ Found league:', league.name);
    } else {
      console.log('✅ Creating independent team (no league)');
    }

    // Create the team using Supabase
    const { data: teamResult, error: teamError } = await supabase
      .from('teams')
      .insert({
        name: teamData.name,
        league_id: league?.id || null,
        captain_id: captainId,
        team_color: teamData.team_color || '#1E40AF',
        max_players: teamData.max_players || 22,
        min_players: teamData.min_players || 7,
        team_bio: teamData.description
      })
      .select('*')
      .single();

    if (teamError || !teamResult) {
      console.error('Team creation failed:', teamError);
      return NextResponse.json(
        { 
          error: 'Team creation failed', 
          message: teamError?.message || 'Failed to create team'
        },
        { status: 400 }
      );
    }

    // Add the captain as a team member
    const { error: memberError } = await supabase
      .from('team_members')
      .insert({
        team_id: teamResult.id,
        user_id: captainId,
        position: 'Captain'
      });

    if (memberError) {
      console.error('Failed to add captain as team member:', memberError);
      // Don't fail the whole operation for this
    }

    // Format response to match expected frontend format
    const responseData = {
      id: teamResult.id,
      name: teamResult.name,
      team_color: teamResult.team_color,
      team_bio: teamResult.team_bio,
      captain_id: teamResult.captain_id,
      max_players: teamResult.max_players,
      created_at: teamResult.created_at,
      league: league ? {
        id: league.id,
        name: league.name
      } : {
        id: null,
        name: 'Independent'
      },
      captain: undefined,
      members: [],
      isOrphaned: false
    };

    return NextResponse.json({
      data: responseData,
      message: 'Team created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/teams:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred while creating the team' },
      { status: 500 }
    );
  }
}
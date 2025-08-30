/**
 * Teams API Routes
 * 
 * Handles team-related API operations:
 * - POST /api/teams - Create a new team
 * - GET /api/teams - Get teams for the authenticated user
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { TeamService } from '@/lib/services/team.service';
import { Database } from '@/lib/types/database.types';
import jwt from 'jsonwebtoken';
import DirectDatabaseService from '@/lib/database/direct-db.service';


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
 * Create a Supabase client for API routes with proper auth token handling
 */
function createServerSupabaseClient(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  // Use service role key for backend operations to bypass RLS
  const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    },
    global: {
      headers: {
        'X-Client-Info': 'matchday-api@1.0.0'
      }
    }
  });
  
  return supabase;
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
    // Development mode: Use a default user if no proper auth
    let userId: string = 'eec00b4f-7e94-4d76-8f2a-7364b49d1c86'; // Default to player@matchday.com
    
    if (process.env.NODE_ENV === 'production') {
      // Only enforce JWT in production
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Authentication required' },
          { status: 401 }
        );
      }

      const token = authHeader.replace('Bearer ', '');
      
      // Verify JWT token manually and extract user info
      try {
        const jwtSecret = process.env.SUPABASE_JWT_SECRET || 'jUZj2O0d4B9nxxsU6p7xN3x81z9UGdY/lqbfIlUKb/Q=';
        const decoded = jwt.verify(token, jwtSecret) as any;
        userId = decoded.sub;
        
        if (!userId) {
          throw new Error('No user ID in token');
        }
        
        console.log('✅ JWT token verified for user:', userId);
      } catch (jwtError) {
        console.error('JWT verification failed:', jwtError);
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Invalid or expired authentication token' },
          { status: 401 }
        );
      }
    } else {
      console.log('🧪 Development mode: Using default user for teams API');
    }

    // Use direct database service to get user teams
    const dbService = DirectDatabaseService.getInstance();
    const userTeams = await dbService.getUserTeams(userId);

    // Convert database result to the format expected by the frontend
    const teams = userTeams.map(team => ({
      id: team.id,
      name: team.name,
      league: { name: team.league_name || 'Unknown League', id: team.league_id || '' },
      sport: 'football',
      max_players: team.max_players || 22,
      current_members: team.member_count || 1,
      team_color: team.team_color,
      team_bio: team.team_bio,
      created_at: team.created_at,
      captain_id: team.captain_id,
      memberCount: team.member_count || 1,
      stats: null // TODO: Add stats calculation
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

    // Development mode: Use a default user if no proper auth
    let captainId: string = 'eec00b4f-7e94-4d76-8f2a-7364b49d1c86'; // Default to player@matchday.com
    
    if (process.env.NODE_ENV === 'production') {
      // Only enforce JWT in production
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Authentication required' },
          { status: 401 }
        );
      }

      const token = authHeader.replace('Bearer ', '');

      // Verify JWT token manually and extract user info
      try {
        const jwtSecret = process.env.SUPABASE_JWT_SECRET || 'jUZj2O0d4B9nxxsU6p7xN3x81z9UGdY/lqbfIlUKb/Q=';
        const decoded = jwt.verify(token, jwtSecret) as any;
        captainId = decoded.sub;
        
        if (!captainId) {
          throw new Error('No user ID in token');
        }
        
        console.log('✅ JWT token verified for user:', captainId);
      } catch (jwtError) {
        console.error('JWT verification failed:', jwtError);
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Invalid or expired authentication token' },
          { status: 401 }
        );
      }
    } else {
      console.log('🧪 Development mode: Using default user for team creation');
    }

    // Use direct database service to bypass Supabase PostgREST issues
    const dbService = DirectDatabaseService.getInstance();
    
    // Find the league by name (if provided)
    let league = null;
    if (teamData.league && teamData.league.trim().length > 0) {
      league = await dbService.findLeagueByName(teamData.league);
      
      if (!league) {
        console.error('League not found:', teamData.league);
        return NextResponse.json(
          { 
            error: 'League not found', 
            message: `League '${teamData.league}' not found or is not active`,
            validationErrors: [{ field: 'league', message: 'Selected league does not exist' }]
          },
          { status: 400 }
        );
      }
      
      console.log('✅ Found league:', league.name);
    } else {
      console.log('✅ Creating independent team (no league)');
    }

    // Create the team using direct database service
    const result = await dbService.createTeam({
      name: teamData.name,
      league_id: league?.id || null, // Allow null league_id for independent teams
      captain_id: captainId,
      team_color: teamData.team_color,
      max_players: teamData.max_players,
      min_players: teamData.min_players,
      team_bio: teamData.description
    });

    if (!result.success || !result.data) {
      return NextResponse.json(
        { 
          error: result.error?.code || 'Team creation failed', 
          message: result.error?.message || 'Failed to create team'
        },
        { status: 400 }
      );
    }

    // Format response to match expected frontend format
    const responseData = {
      ...result.data,
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
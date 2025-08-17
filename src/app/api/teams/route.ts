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
  
  // Use service role key for backend operations to bypass RLS
  const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
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

  if (!data.league || typeof data.league !== 'string' || data.league.trim().length === 0) {
    errors.push({ field: 'league', message: 'League is required' });
  }

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
    league_id: '', // Will be resolved from league name
    league: data.league.trim(),
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
    const supabase = createServerSupabaseClient(request);
    const teamService = TeamService.getInstance(supabase);

    // For now, get all teams to verify database connection
    // TODO: Filter by authenticated user in the future
    const { data: teams, error } = await supabase
      .from('teams')
      .select(`
        *,
        league:leagues!inner(*)
      `);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      data: teams || [],
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

    // Create Supabase client and TeamService
    const supabase = createServerSupabaseClient(request);
    const teamService = TeamService.getInstance(supabase);

    // Find the league by name to get the league_id
    const { data: league, error: leagueError } = await supabase
      .from('leagues')
      .select('*')
      .eq('name', teamData.league)
      .eq('is_active', true)
      .eq('is_public', true)
      .single();

    if (leagueError || !league) {
      console.error('League query error:', leagueError);
      return NextResponse.json(
        { 
          error: 'League not found', 
          message: `League '${teamData.league}' not found or is not active`,
          validationErrors: [{ field: 'league', message: 'Selected league does not exist' }]
        },
        { status: 400 }
      );
    }

    // Get the authenticated user from the Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify the token and get user info
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or expired authentication token' },
        { status: 401 }
      );
    }

    const captainId = user.id;

    // Create the team using the service
    const createTeamForm = {
      name: teamData.name,
      league_id: league.id,
      sport: 'football',
      league: teamData.league,
      description: teamData.description,
      max_players: teamData.max_players,
      min_players: teamData.min_players,
      team_color: teamData.team_color
    };

    const result = await teamService.createTeam(captainId, createTeamForm);

    if (!result.success || !result.data) {
      return NextResponse.json(
        { 
          error: result.error?.code || 'Team creation failed', 
          message: result.error?.message || 'Failed to create team',
          details: result.error?.details
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      data: result.data,
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
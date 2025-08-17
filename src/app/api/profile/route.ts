/**
 * Profile API Routes
 * 
 * Handles user profile-related API operations:
 * - GET /api/profile - Get current user's profile data
 * - PUT /api/profile - Update user profile (full update)
 * - PATCH /api/profile - Update user profile (partial update)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { UserService } from '@/lib/services/user.service';
import { Database, UpdateUserProfile } from '@/lib/types/database.types';

interface ProfileUpdateRequest {
  full_name?: string;
  display_name?: string;
  bio?: string;
  phone?: string;
  date_of_birth?: string;
  preferred_position?: string;
  location?: string;
}

interface ProfileValidationError {
  field: string;
  message: string;
}

/**
 * Create a Supabase client for API routes with proper auth token handling
 */
function createServerSupabaseClient(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  // Get the authorization header
  const authHeader = request.headers.get('authorization');
  const accessToken = authHeader?.replace('Bearer ', '');
  
  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: accessToken ? {
        'Authorization': `Bearer ${accessToken}`,
        'X-Client-Info': 'matchday-api@1.0.0'
      } : {
        'X-Client-Info': 'matchday-api@1.0.0'
      }
    }
  });
  
  return supabase;
}

/**
 * Validate profile update request data
 */
function validateProfileUpdateRequest(data: any): {
  isValid: boolean;
  errors: ProfileValidationError[];
  cleanData?: UpdateUserProfile;
} {
  const errors: ProfileValidationError[] = [];

  // Full name validation
  if (data.full_name !== undefined) {
    if (typeof data.full_name !== 'string') {
      errors.push({ field: 'full_name', message: 'Full name must be a string' });
    } else if (data.full_name.trim().length > 255) {
      errors.push({ field: 'full_name', message: 'Full name must be less than 255 characters' });
    } else if (data.full_name.trim().length > 0 && data.full_name.trim().length < 2) {
      errors.push({ field: 'full_name', message: 'Full name must be at least 2 characters long' });
    }
  }

  // Display name validation
  if (data.display_name !== undefined) {
    if (typeof data.display_name !== 'string') {
      errors.push({ field: 'display_name', message: 'Display name must be a string' });
    } else if (data.display_name.trim().length > 255) {
      errors.push({ field: 'display_name', message: 'Display name must be less than 255 characters' });
    } else if (data.display_name.trim().length > 0 && data.display_name.trim().length < 2) {
      errors.push({ field: 'display_name', message: 'Display name must be at least 2 characters long' });
    }
  }

  // Bio validation
  if (data.bio !== undefined) {
    if (typeof data.bio !== 'string') {
      errors.push({ field: 'bio', message: 'Bio must be a string' });
    } else if (data.bio.length > 1000) {
      errors.push({ field: 'bio', message: 'Bio must be less than 1000 characters' });
    }
  }

  // Phone validation
  if (data.phone !== undefined) {
    if (typeof data.phone !== 'string') {
      errors.push({ field: 'phone', message: 'Phone must be a string' });
    } else if (data.phone.trim().length > 20) {
      errors.push({ field: 'phone', message: 'Phone must be less than 20 characters' });
    } else if (data.phone.trim().length > 0 && !/^[\+]?[1-9][\d]{0,15}$/.test(data.phone.trim().replace(/[\s\-\(\)]/g, ''))) {
      errors.push({ field: 'phone', message: 'Please enter a valid phone number' });
    }
  }

  // Date of birth validation
  if (data.date_of_birth !== undefined) {
    if (typeof data.date_of_birth !== 'string') {
      errors.push({ field: 'date_of_birth', message: 'Date of birth must be a string' });
    } else if (data.date_of_birth.trim().length > 0) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(data.date_of_birth)) {
        errors.push({ field: 'date_of_birth', message: 'Date of birth must be in YYYY-MM-DD format' });
      } else {
        const date = new Date(data.date_of_birth);
        const now = new Date();
        const minAge = new Date();
        minAge.setFullYear(now.getFullYear() - 13); // Minimum age 13
        const maxAge = new Date();
        maxAge.setFullYear(now.getFullYear() - 100); // Maximum age 100
        
        if (isNaN(date.getTime())) {
          errors.push({ field: 'date_of_birth', message: 'Invalid date format' });
        } else if (date > minAge) {
          errors.push({ field: 'date_of_birth', message: 'You must be at least 13 years old' });
        } else if (date < maxAge) {
          errors.push({ field: 'date_of_birth', message: 'Please enter a valid birth date' });
        }
      }
    }
  }

  // Preferred position validation
  if (data.preferred_position !== undefined) {
    if (typeof data.preferred_position !== 'string') {
      errors.push({ field: 'preferred_position', message: 'Preferred position must be a string' });
    } else if (data.preferred_position.trim().length > 50) {
      errors.push({ field: 'preferred_position', message: 'Preferred position must be less than 50 characters' });
    }
  }

  // Location validation
  if (data.location !== undefined) {
    if (typeof data.location !== 'string') {
      errors.push({ field: 'location', message: 'Location must be a string' });
    } else if (data.location.trim().length > 255) {
      errors.push({ field: 'location', message: 'Location must be less than 255 characters' });
    }
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  // Clean and format the data
  const cleanData: UpdateUserProfile = {};
  
  if (data.full_name !== undefined) {
    cleanData.full_name = data.full_name.trim() || null;
  }
  if (data.display_name !== undefined) {
    cleanData.display_name = data.display_name.trim() || null;
  }
  if (data.bio !== undefined) {
    cleanData.bio = data.bio.trim() || null;
  }
  if (data.phone !== undefined) {
    cleanData.phone = data.phone.trim() || null;
  }
  if (data.date_of_birth !== undefined) {
    cleanData.date_of_birth = data.date_of_birth.trim() || null;
  }
  if (data.preferred_position !== undefined) {
    cleanData.preferred_position = data.preferred_position.trim() || null;
  }
  if (data.location !== undefined) {
    cleanData.location = data.location.trim() || null;
  }

  return { isValid: true, errors: [], cleanData };
}

/**
 * GET /api/profile
 * Get current user's profile data
 */
export async function GET(request: NextRequest) {
  try {
    // Create Supabase client
    const supabase = createServerSupabaseClient(request);
    const userService = UserService.getInstance();

    // Get current user from Supabase auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user's profile from Supabase
    const result = await userService.getUserProfile(user.id);

    if (!result.success) {
      // If profile doesn't exist, return a 404 with structured response
      if (result.error?.code === 'PROFILE_NOT_FOUND') {
        return NextResponse.json(
          { 
            error: 'PROFILE_NOT_FOUND', 
            message: 'Profile not found. Please complete your profile setup.',
            data: null
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: result.error?.code || 'UNKNOWN_ERROR', message: result.error?.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      data: result.data,
      message: 'Profile retrieved successfully'
    });

  } catch (error) {
    console.error('Error in GET /api/profile:', error);
    return NextResponse.json(
      { error: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/profile
 * Update user profile (full update - replaces all fields)
 */
export async function PUT(request: NextRequest) {
  return handleProfileUpdate(request, 'full');
}

/**
 * PATCH /api/profile
 * Update user profile (partial update - only provided fields)
 */
export async function PATCH(request: NextRequest) {
  return handleProfileUpdate(request, 'partial');
}

/**
 * Common handler for profile updates
 */
async function handleProfileUpdate(request: NextRequest, updateType: 'full' | 'partial') {
  try {
    // Create Supabase client
    const supabase = createServerSupabaseClient(request);
    const userService = UserService.getInstance();

    // Get current user from Supabase auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    let requestData: ProfileUpdateRequest;
    try {
      requestData = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: 'INVALID_REQUEST_BODY', message: 'Request body must be valid JSON' },
        { status: 400 }
      );
    }

    // For full updates, ensure at least one field is provided
    if (updateType === 'full' && Object.keys(requestData).length === 0) {
      return NextResponse.json(
        { 
          error: 'INVALID_REQUEST', 
          message: 'At least one field must be provided for profile update'
        },
        { status: 400 }
      );
    }

    // Validate the request data
    const validation = validateProfileUpdateRequest(requestData);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'VALIDATION_FAILED', 
          message: 'Please check your input and try again',
          validationErrors: validation.errors
        },
        { status: 400 }
      );
    }

    const updateData = validation.cleanData!;

    // Check if profile exists first
    const profileExists = await userService.profileExists(user.id);
    if (!profileExists.success) {
      return NextResponse.json(
        { error: 'PROFILE_CHECK_FAILED', message: 'Unable to verify profile existence' },
        { status: 500 }
      );
    }

    let result;
    if (profileExists.data) {
      // Update existing profile
      result = await userService.updateUserProfile(user.id, updateData);
    } else {
      // Create new profile if it doesn't exist
      if (!updateData.display_name) {
        updateData.display_name = user.email?.split('@')[0] || 'User';
      }
      result = await userService.createUserProfile(user.id, {
        display_name: updateData.display_name,
        full_name: updateData.full_name || undefined,
        bio: updateData.bio || undefined,
        phone: updateData.phone || undefined,
        date_of_birth: updateData.date_of_birth || undefined,
        preferred_position: updateData.preferred_position || undefined,
        location: updateData.location || undefined
      });
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error?.code || 'UPDATE_FAILED', message: result.error?.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      data: result.data,
      message: profileExists.data ? 'Profile updated successfully' : 'Profile created successfully'
    });

  } catch (error) {
    console.error(`Error in ${updateType.toUpperCase()} /api/profile:`, error);
    return NextResponse.json(
      { error: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred while updating profile' },
      { status: 500 }
    );
  }
}
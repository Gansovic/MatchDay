/**
 * Profile Fields API Routes
 * 
 * Handles individual field updates for user profiles:
 * - PATCH /api/profile/fields - Update specific profile fields
 * 
 * Supports updating individual fields like:
 * - display_name
 * - full_name
 * - bio
 * - phone
 * - location
 * - preferred_position
 * - date_of_birth
 */

import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@matchday/services';
import { UpdateUserProfile } from '@matchday/database';
import { createUserSupabaseClient } from '@/lib/supabase/server-client';

interface FieldUpdateRequest {
  field: 'display_name' | 'full_name' | 'bio' | 'phone' | 'location' | 'preferred_position' | 'date_of_birth';
  value: string | null;
}


/**
 * Validate individual field update
 */
function validateFieldUpdate(field: string, value: any): { isValid: boolean; error?: string; cleanValue?: any } {
  // Validate field name
  const allowedFields = ['display_name', 'full_name', 'bio', 'phone', 'location', 'preferred_position', 'date_of_birth'];
  if (!allowedFields.includes(field)) {
    return { isValid: false, error: `Invalid field. Allowed fields: ${allowedFields.join(', ')}` };
  }

  // Allow null values for optional fields
  if (value === null || value === '') {
    return { isValid: true, cleanValue: null };
  }

  // Validate based on field type
  switch (field) {
    case 'display_name':
    case 'full_name':
      if (typeof value !== 'string') {
        return { isValid: false, error: `${field} must be a string` };
      }
      if (value.trim().length < 2) {
        return { isValid: false, error: `${field} must be at least 2 characters long` };
      }
      if (value.trim().length > 255) {
        return { isValid: false, error: `${field} must be less than 255 characters` };
      }
      return { isValid: true, cleanValue: value.trim() };

    case 'bio':
      if (typeof value !== 'string') {
        return { isValid: false, error: 'Bio must be a string' };
      }
      if (value.length > 1000) {
        return { isValid: false, error: 'Bio must be less than 1000 characters' };
      }
      return { isValid: true, cleanValue: value.trim() || null };

    case 'phone':
      if (typeof value !== 'string') {
        return { isValid: false, error: 'Phone must be a string' };
      }
      if (value.trim().length > 20) {
        return { isValid: false, error: 'Phone must be less than 20 characters' };
      }
      // Basic phone validation
      const phonePattern = /^[\+]?[1-9][\d]{0,15}$/;
      const cleanPhone = value.trim().replace(/[\s\-\(\)]/g, '');
      if (cleanPhone.length > 0 && !phonePattern.test(cleanPhone)) {
        return { isValid: false, error: 'Please enter a valid phone number' };
      }
      return { isValid: true, cleanValue: value.trim() || null };

    case 'location':
      if (typeof value !== 'string') {
        return { isValid: false, error: 'Location must be a string' };
      }
      if (value.trim().length > 255) {
        return { isValid: false, error: 'Location must be less than 255 characters' };
      }
      return { isValid: true, cleanValue: value.trim() || null };

    case 'preferred_position':
      if (typeof value !== 'string') {
        return { isValid: false, error: 'Preferred position must be a string' };
      }
      if (value.trim().length > 50) {
        return { isValid: false, error: 'Preferred position must be less than 50 characters' };
      }
      return { isValid: true, cleanValue: value.trim() || null };

    case 'date_of_birth':
      if (typeof value !== 'string') {
        return { isValid: false, error: 'Date of birth must be a string' };
      }
      
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(value)) {
        return { isValid: false, error: 'Date of birth must be in YYYY-MM-DD format' };
      }
      
      const date = new Date(value);
      const now = new Date();
      const minAge = new Date();
      minAge.setFullYear(now.getFullYear() - 13); // Minimum age 13
      const maxAge = new Date();
      maxAge.setFullYear(now.getFullYear() - 100); // Maximum age 100
      
      if (isNaN(date.getTime())) {
        return { isValid: false, error: 'Invalid date format' };
      }
      if (date > minAge) {
        return { isValid: false, error: 'You must be at least 13 years old' };
      }
      if (date < maxAge) {
        return { isValid: false, error: 'Please enter a valid birth date' };
      }
      
      return { isValid: true, cleanValue: value };

    default:
      return { isValid: false, error: 'Unknown field' };
  }
}

/**
 * PATCH /api/profile/fields
 * Update specific profile field
 */
export async function PATCH(request: NextRequest) {
  try {
    // Create Supabase client
    const supabase = createUserSupabaseClient(request);
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
    let requestData: FieldUpdateRequest;
    try {
      requestData = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: 'INVALID_REQUEST_BODY', message: 'Request body must be valid JSON' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!requestData.field) {
      return NextResponse.json(
        { error: 'MISSING_FIELD', message: 'Field name is required' },
        { status: 400 }
      );
    }

    if (requestData.value === undefined) {
      return NextResponse.json(
        { error: 'MISSING_VALUE', message: 'Field value is required (use null to clear)' },
        { status: 400 }
      );
    }

    // Validate the field and value
    const validation = validateFieldUpdate(requestData.field, requestData.value);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'VALIDATION_FAILED', message: validation.error },
        { status: 400 }
      );
    }

    // Check if profile exists
    const profileExists = await userService.profileExists(user.id);
    if (!profileExists.success) {
      return NextResponse.json(
        { error: 'PROFILE_CHECK_FAILED', message: 'Unable to verify profile existence' },
        { status: 500 }
      );
    }

    // Create update object with the specific field
    const updateData: UpdateUserProfile = {
      [requestData.field]: validation.cleanValue
    };

    let result;
    if (profileExists.data) {
      // Update existing profile
      result = await userService.updateUserProfile(user.id, updateData);
    } else {
      // Create new profile if it doesn't exist
      if (requestData.field !== 'display_name') {
        // For fields other than display_name, we need a display_name for new profiles
        updateData.display_name = user.email?.split('@')[0] || 'User';
      }
      
      result = await userService.createUserProfile(user.id, {
        display_name: updateData.display_name || user.email?.split('@')[0] || 'User',
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
      data: {
        field: requestData.field,
        value: validation.cleanValue,
        profile: result.data
      },
      message: `${requestData.field} updated successfully`
    });

  } catch (error) {
    console.error('Error in PATCH /api/profile/fields:', error);
    return NextResponse.json(
      { error: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred while updating field' },
      { status: 500 }
    );
  }
}
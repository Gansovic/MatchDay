/**
 * Profile Avatar API Routes
 * 
 * Handles user avatar upload and management:
 * - POST /api/profile/avatar - Upload/update avatar image
 * - DELETE /api/profile/avatar - Remove avatar image
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { UserService } from '@/lib/services/user.service';
import { Database } from '@/lib/types/database.types';

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
 * Validate uploaded file
 */
function validateAvatarFile(file: File): { isValid: boolean; error?: string } {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.'
    };
  }

  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'File too large. Maximum size is 5MB.'
    };
  }

  // Check image dimensions would require additional processing
  // For now, we'll rely on client-side validation and server-side resize if needed

  return { isValid: true };
}

/**
 * Generate unique filename for avatar
 */
function generateAvatarFilename(userId: string, originalName: string): string {
  const timestamp = Date.now();
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  return `avatars/${userId}/${timestamp}.${extension}`;
}

/**
 * POST /api/profile/avatar
 * Upload/update avatar image
 */
export async function POST(request: NextRequest) {
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

    // Parse form data
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (error) {
      return NextResponse.json(
        { error: 'INVALID_REQUEST', message: 'Invalid form data' },
        { status: 400 }
      );
    }

    // Get the uploaded file
    const file = formData.get('avatar') as File;
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'NO_FILE', message: 'No avatar file provided' },
        { status: 400 }
      );
    }

    // Validate the file
    const validation = validateAvatarFile(file);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'INVALID_FILE', message: validation.error },
        { status: 400 }
      );
    }

    // Get current profile to check for existing avatar
    const profileResult = await userService.getUserProfile(user.id);
    let existingAvatarUrl: string | null = null;
    
    if (profileResult.success && profileResult.data?.avatar_url) {
      existingAvatarUrl = profileResult.data.avatar_url;
    }

    // Generate unique filename
    const filename = generateAvatarFilename(user.id, file.name);

    // Convert File to ArrayBuffer for Supabase upload
    const fileBuffer = await file.arrayBuffer();

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filename, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Avatar upload error:', uploadError);
      return NextResponse.json(
        { error: 'UPLOAD_FAILED', message: 'Failed to upload avatar image' },
        { status: 500 }
      );
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filename);

    if (!urlData?.publicUrl) {
      return NextResponse.json(
        { error: 'URL_GENERATION_FAILED', message: 'Failed to generate avatar URL' },
        { status: 500 }
      );
    }

    // Update user profile with new avatar URL
    const updateResult = await userService.updateUserProfile(user.id, {
      avatar_url: urlData.publicUrl
    });

    if (!updateResult.success) {
      // If profile update fails, try to clean up the uploaded file
      await supabase.storage.from('avatars').remove([filename]);
      
      return NextResponse.json(
        { error: 'PROFILE_UPDATE_FAILED', message: 'Failed to update profile with new avatar' },
        { status: 500 }
      );
    }

    // If there was an existing avatar, try to delete it (best effort)
    if (existingAvatarUrl) {
      try {
        // Extract filename from the old URL
        const oldFilename = existingAvatarUrl.split('/').pop();
        if (oldFilename && oldFilename.includes('avatars/')) {
          await supabase.storage.from('avatars').remove([`avatars/${user.id}/${oldFilename}`]);
        }
      } catch (cleanupError) {
        // Log but don't fail the request for cleanup errors
        console.warn('Failed to cleanup old avatar:', cleanupError);
      }
    }

    return NextResponse.json({
      data: {
        avatar_url: urlData.publicUrl,
        profile: updateResult.data
      },
      message: 'Avatar uploaded successfully'
    });

  } catch (error) {
    console.error('Error in POST /api/profile/avatar:', error);
    return NextResponse.json(
      { error: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred while uploading avatar' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/profile/avatar
 * Remove avatar image
 */
export async function DELETE(request: NextRequest) {
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

    // Get current profile to check for existing avatar
    const profileResult = await userService.getUserProfile(user.id);
    
    if (!profileResult.success) {
      return NextResponse.json(
        { error: 'PROFILE_NOT_FOUND', message: 'User profile not found' },
        { status: 404 }
      );
    }

    const currentAvatarUrl = profileResult.data?.avatar_url;
    
    if (!currentAvatarUrl) {
      return NextResponse.json(
        { error: 'NO_AVATAR', message: 'No avatar to remove' },
        { status: 400 }
      );
    }

    // Update user profile to remove avatar URL
    const updateResult = await userService.updateUserProfile(user.id, {
      avatar_url: null
    });

    if (!updateResult.success) {
      return NextResponse.json(
        { error: 'PROFILE_UPDATE_FAILED', message: 'Failed to remove avatar from profile' },
        { status: 500 }
      );
    }

    // Try to delete the file from storage (best effort)
    try {
      // Extract filename from the URL
      const url = new URL(currentAvatarUrl);
      const pathParts = url.pathname.split('/');
      const filename = pathParts[pathParts.length - 1];
      
      if (filename && filename.includes(user.id)) {
        await supabase.storage.from('avatars').remove([`avatars/${user.id}/${filename}`]);
      }
    } catch (cleanupError) {
      // Log but don't fail the request for cleanup errors
      console.warn('Failed to cleanup avatar file:', cleanupError);
    }

    return NextResponse.json({
      data: {
        profile: updateResult.data
      },
      message: 'Avatar removed successfully'
    });

  } catch (error) {
    console.error('Error in DELETE /api/profile/avatar:', error);
    return NextResponse.json(
      { error: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred while removing avatar' },
      { status: 500 }
    );
  }
}
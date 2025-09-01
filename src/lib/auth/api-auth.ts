/**
 * API Authentication Utilities
 * 
 * Consistent authentication validation for API routes.
 * Provides unified error handling and token validation across all endpoints.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createUserSupabaseClient } from '@/lib/supabase/server-client';
import { isInvalidJWTError } from '@/lib/supabase/client';

export interface AuthValidationResult {
  success: boolean;
  user?: {
    id: string;
    email: string | undefined;
  };
  error?: string;
  response?: NextResponse;
}

/**
 * Validate API request authentication
 * Returns consistent authentication state for API routes
 */
export async function validateApiAuth(request: NextRequest): Promise<AuthValidationResult> {
  try {
    console.log('🔍 Validating API authentication...');
    
    // Create user-scoped Supabase client
    const supabaseUserClient = createUserSupabaseClient(request);
    const { data: { user }, error: userError } = await supabaseUserClient.auth.getUser();
    
    if (userError) {
      console.log('🔍 Authentication error:', userError.message);
      
      // Check for invalid JWT specifically
      if (isInvalidJWTError(userError)) {
        console.log('🚨 Invalid JWT detected - token corrupted or expired');
        return {
          success: false,
          error: 'Invalid or corrupted authentication token',
          response: NextResponse.json({
            error: 'Authentication failed',
            message: 'Your session has expired or is invalid. Please sign in again.',
            action: 'CLEAR_COOKIES_AND_REAUTH'
          }, { 
            status: 401,
            headers: {
              'Clear-Site-Data': '"cookies", "storage"'
            }
          })
        };
      }
      
      return {
        success: false,
        error: userError.message,
        response: NextResponse.json({
          error: 'Authentication failed',
          message: 'Please sign in to access this resource.',
          action: 'REDIRECT_TO_LOGIN'
        }, { status: 401 })
      };
    }
    
    if (!user) {
      console.log('🔍 No user found in session');
      return {
        success: false,
        error: 'No authenticated user',
        response: NextResponse.json({
          error: 'Authentication required',
          message: 'Please sign in to access this resource.',
          action: 'REDIRECT_TO_LOGIN'
        }, { status: 401 })
      };
    }
    
    console.log('✅ API authentication successful:', user.id, user.email);
    
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email || undefined
      }
    };
    
  } catch (error) {
    console.error('🔍 API authentication error:', error);
    
    // Check if this is an invalid JWT error in catch block
    if (isInvalidJWTError(error)) {
      return {
        success: false,
        error: 'Invalid JWT token',
        response: NextResponse.json({
          error: 'Authentication failed',
          message: 'Your session has expired or is invalid. Please sign in again.',
          action: 'CLEAR_COOKIES_AND_REAUTH'
        }, { 
          status: 401,
          headers: {
            'Clear-Site-Data': '"cookies", "storage"'
          }
        })
      };
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown authentication error',
      response: NextResponse.json({
        error: 'Authentication failed',
        message: 'Unable to verify authentication. Please try again.',
        action: 'RETRY_OR_REAUTH'
      }, { status: 500 })
    };
  }
}

/**
 * Middleware-style authentication helper
 * Use this for routes that require authentication
 */
export async function requireAuth(
  request: NextRequest,
  handler: (request: NextRequest, user: { id: string; email: string | undefined }) => Promise<NextResponse>
): Promise<NextResponse> {
  const authResult = await validateApiAuth(request);
  
  if (!authResult.success) {
    return authResult.response!;
  }
  
  return handler(request, authResult.user!);
}
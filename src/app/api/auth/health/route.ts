/**
 * Authentication Health Check API
 * 
 * Lightweight endpoint to validate authentication token health.
 * Used by frontend to ensure auth state consistency between client and server.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createUserSupabaseClient } from '@/lib/supabase/server-client';
import { isInvalidJWTError } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    console.log('🏥 Auth health check requested');
    
    const supabase = createUserSupabaseClient(request);
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.log('🏥 Auth health check - error:', error.message);
      
      if (isInvalidJWTError(error)) {
        return NextResponse.json({
          isHealthy: false,
          status: 'INVALID_TOKEN',
          message: 'Authentication token is invalid or corrupted',
          action: 'CLEAR_COOKIES_AND_REAUTH',
          details: error.message
        }, { status: 401 });
      }
      
      return NextResponse.json({
        isHealthy: false,
        status: 'AUTH_ERROR',
        message: 'Authentication error occurred',
        action: 'RETRY_OR_REAUTH',
        details: error.message
      }, { status: 401 });
    }
    
    if (!user) {
      console.log('🏥 Auth health check - no user');
      return NextResponse.json({
        isHealthy: false,
        status: 'NO_USER',
        message: 'No authenticated user found',
        action: 'REDIRECT_TO_LOGIN'
      }, { status: 401 });
    }
    
    console.log('🏥 Auth health check - healthy:', user.email);
    return NextResponse.json({
      isHealthy: true,
      status: 'HEALTHY',
      message: 'Authentication is valid',
      user: {
        id: user.id,
        email: user.email,
        emailVerified: !!user.email_confirmed_at
      },
      validatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('🏥 Auth health check - unexpected error:', error);
    
    return NextResponse.json({
      isHealthy: false,
      status: 'VALIDATION_FAILED',
      message: 'Failed to validate authentication',
      action: 'RETRY_OR_REAUTH',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Health check response types for frontend consumption
 */
export interface AuthHealthResponse {
  isHealthy: boolean;
  status: 'HEALTHY' | 'INVALID_TOKEN' | 'AUTH_ERROR' | 'NO_USER' | 'VALIDATION_FAILED';
  message: string;
  action?: 'CLEAR_COOKIES_AND_REAUTH' | 'RETRY_OR_REAUTH' | 'REDIRECT_TO_LOGIN';
  user?: {
    id: string;
    email: string;
    emailVerified: boolean;
  };
  validatedAt?: string;
  details?: string;
}
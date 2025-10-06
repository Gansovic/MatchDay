/**
 * Centralized Authentication Validator
 * 
 * Single source of truth for authentication validation across the application.
 * Provides consistent validation logic for both client and server-side usage.
 */

import { Session } from '@supabase/supabase-js';
import { supabase, isInvalidJWTError } from '@/lib/supabase/client';

export interface AuthValidationResult {
  isValid: boolean;
  status: 'healthy' | 'invalid_token' | 'no_session' | 'expired' | 'validation_failed';
  session: Session | null;
  user: any | null;
  reason?: string;
  shouldClearCookies: boolean;
  shouldRedirectToLogin: boolean;
  action: 'none' | 'clear_cookies' | 'refresh_token' | 'redirect_login' | 'retry';
}

/**
 * Comprehensive authentication state validation
 */
export async function validateAuthenticationState(): Promise<AuthValidationResult> {
  try {
    console.log('🔍 Validating authentication state...');
    
    // Step 1: Check if we have a session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('🔍 Session error:', sessionError.message);
      
      if (isInvalidJWTError(sessionError)) {
        return {
          isValid: false,
          status: 'invalid_token',
          session: null,
          user: null,
          reason: sessionError.message,
          shouldClearCookies: true,
          shouldRedirectToLogin: true,
          action: 'clear_cookies'
        };
      }
      
      return {
        isValid: false,
        status: 'validation_failed',
        session: null,
        user: null,
        reason: sessionError.message,
        shouldClearCookies: false,
        shouldRedirectToLogin: false,
        action: 'retry'
      };
    }
    
    if (!session) {
      console.log('🔍 No session found');
      return {
        isValid: false,
        status: 'no_session',
        session: null,
        user: null,
        shouldClearCookies: false,
        shouldRedirectToLogin: true,
        action: 'redirect_login'
      };
    }
    
    // Step 2: Check token expiry
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = session.expires_at || 0;
    
    if (expiresAt <= now) {
      console.log('🔍 Token expired');
      return {
        isValid: false,
        status: 'expired',
        session,
        user: session.user,
        reason: 'Token has expired',
        shouldClearCookies: false,
        shouldRedirectToLogin: false,
        action: 'refresh_token'
      };
    }
    
    // Step 3: Validate token with server (optional during initialization)
    try {
      // Add timeout and error handling to prevent blocking initialization
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      const healthResponse = await fetch('/api/auth/health', {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!healthResponse.ok) {
        const healthData = await healthResponse.json();
        console.log('🔍 Health check failed:', healthData.status);
        
        return {
          isValid: false,
          status: healthData.status === 'INVALID_TOKEN' ? 'invalid_token' : 'validation_failed',
          session,
          user: session.user,
          reason: healthData.message,
          shouldClearCookies: healthData.action === 'CLEAR_COOKIES_AND_REAUTH',
          shouldRedirectToLogin: healthData.action !== 'RETRY_OR_REAUTH',
          action: healthData.action === 'CLEAR_COOKIES_AND_REAUTH' ? 'clear_cookies' : 'retry'
        };
      }
      
      const healthData = await healthResponse.json();
      console.log('🔍 Authentication state is healthy');
      
      return {
        isValid: true,
        status: 'healthy',
        session,
        user: session.user,
        shouldClearCookies: false,
        shouldRedirectToLogin: false,
        action: 'none'
      };
      
    } catch (healthError) {
      console.log('🔍 Health check request failed (gracefully degrading):', healthError);
      
      // Graceful degradation: If health check fails during initialization,
      // assume the session is valid if it passes local validation
      // This prevents circular dependency issues during app startup
      if (healthError.name === 'AbortError') {
        console.log('🔍 Health check timed out - assuming valid session for now');
      } else if (healthError.message?.includes('fetch')) {
        console.log('🔍 Health endpoint not available - assuming valid session for now');
      }
      
      // Fall back to local validation only
      return {
        isValid: true, // Assume valid if local checks passed
        status: 'healthy',
        session,
        user: session.user,
        shouldClearCookies: false,
        shouldRedirectToLogin: false,
        action: 'none'
      };
    }
    
  } catch (error) {
    console.error('🔍 Authentication validation error:', error);
    
    return {
      isValid: false,
      status: 'validation_failed',
      session: null,
      user: null,
      reason: error instanceof Error ? error.message : 'Unknown validation error',
      shouldClearCookies: false,
      shouldRedirectToLogin: false,
      action: 'retry'
    };
  }
}

/**
 * Quick session health check (lightweight)
 */
export async function validateSessionHealth(session: Session | null): Promise<boolean> {
  if (!session?.access_token) return false;
  
  try {
    // Check token expiry first (local check, no network)
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = session.expires_at || 0;
    
    if (expiresAt <= now) {
      console.log('🔍 Token expired (local check)');
      return false;
    }
    
    // Validate with server
    const { data, error } = await supabase.auth.getUser();
    
    if (error && isInvalidJWTError(error)) {
      console.log('🔍 Invalid JWT detected in health check');
      return false;
    }
    
    return !error && !!data.user;
  } catch (error) {
    if (isInvalidJWTError(error)) {
      console.log('🔍 Invalid JWT detected in health check (catch)');
      return false;
    }
    return false;
  }
}

/**
 * Check if token is about to expire (within 2 minutes)
 */
export function isTokenNearExpiry(session: Session | null): boolean {
  if (!session?.expires_at) return false;
  
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = session.expires_at;
  const twoMinutes = 2 * 60;
  
  return (expiresAt - now) <= twoMinutes;
}

/**
 * Attempt to refresh the current session
 */
export async function refreshAuthSession(): Promise<{ success: boolean; session: Session | null; error?: string }> {
  try {
    console.log('🔄 Attempting to refresh auth session...');
    
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.log('🔄 Session refresh failed:', error.message);
      return { success: false, session: null, error: error.message };
    }
    
    console.log('🔄 Session refreshed successfully');
    return { success: true, session: data.session };
    
  } catch (error) {
    console.log('🔄 Session refresh error:', error);
    return { 
      success: false, 
      session: null, 
      error: error instanceof Error ? error.message : 'Unknown refresh error' 
    };
  }
}
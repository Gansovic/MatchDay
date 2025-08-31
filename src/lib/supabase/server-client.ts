/**
 * Server-side Supabase client utilities
 * Shared utility for API routes to avoid duplicate function definitions
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';
import { Database } from '@/lib/types/database.types';

/**
 * Create a Supabase client with service role for server-side operations
 * Used in API routes to bypass RLS and perform admin operations
 */
export function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  if (!supabaseUrl || !supabaseServiceRole) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient<Database>(supabaseUrl, supabaseServiceRole, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

/**
 * Create a Supabase client for user-authenticated operations
 * Uses the user's access token from the request headers
 */
export function createUserSupabaseClient(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
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
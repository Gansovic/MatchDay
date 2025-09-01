/**
 * Debug Login Test
 * 
 * Test the login process with credentials
 */

import { NextRequest, NextResponse } from 'next/server';
import { createUserSupabaseClient } from '@/lib/supabase/server-client';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    console.log('🔍 Testing login for email:', email);
    
    // Create user client
    const supabase = createUserSupabaseClient(request);
    
    // Attempt sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.log('❌ Login failed:', error.message);
      return NextResponse.json({
        success: false,
        error: error.message,
        errorCode: error.status || 'unknown',
        details: error
      });
    }
    
    console.log('✅ Login successful for:', data.user?.email);
    return NextResponse.json({
      success: true,
      user: {
        id: data.user?.id,
        email: data.user?.email,
        emailConfirmed: !!data.user?.email_confirmed_at
      },
      session: {
        hasAccessToken: !!data.session?.access_token,
        expiresAt: data.session?.expires_at
      }
    });
    
  } catch (error) {
    console.error('❌ Debug login test error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
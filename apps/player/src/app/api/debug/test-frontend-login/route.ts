/**
 * Debug Frontend Login Test
 * 
 * Test login using the exact same method as the frontend auth provider
 */

import { NextRequest, NextResponse } from 'next/server';
import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@matchday/database';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    console.log('🔍 Testing frontend-style login for:', email);
    
    // Create the same client as used in frontend
    const supabase = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookieOptions: {
          name: 'matchday-auth',
          lifetime: 60 * 60 * 24 * 7, // 7 days
          domain: undefined,
          path: '/',
          sameSite: 'lax',
        },
      }
    );
    
    // Use the exact same method as the auth provider
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.log('❌ Frontend-style login failed:', error.message);
      return NextResponse.json({
        success: false,
        error: error.message,
        errorCode: error.status || 'unknown',
        details: error
      });
    }
    
    console.log('✅ Frontend-style login successful for:', authData.user?.email);
    return NextResponse.json({
      success: true,
      user: {
        id: authData.user?.id,
        email: authData.user?.email,
        emailConfirmed: !!authData.user?.email_confirmed_at
      },
      session: {
        hasAccessToken: !!authData.session?.access_token,
        expiresAt: authData.session?.expires_at
      }
    });
    
  } catch (error) {
    console.error('❌ Frontend login test error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Frontend login test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
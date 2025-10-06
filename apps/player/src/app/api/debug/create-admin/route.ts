/**
 * Debug Create Admin User
 * 
 * Create a fresh admin user with specific credentials
 */

import { NextRequest, NextResponse } from 'next/server';
import { createUserSupabaseClient } from '@/lib/supabase/server-client';

export async function POST(request: NextRequest) {
  try {
    const { email, password, displayName } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: 'Email and password are required'
      }, { status: 400 });
    }
    
    console.log('👑 Creating admin user:', email);
    
    // Create response to handle cookies
    const response = NextResponse.json({ success: true });
    const supabase = createUserSupabaseClient(request, response);
    
    // Create the user through Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName || 'Admin User',
          preferred_position: '',
          location: ''
        }
      }
    });
    
    if (error) {
      console.log('❌ Admin creation failed:', error.message);
      return NextResponse.json({
        success: false,
        error: error.message,
        errorCode: error.status || 'unknown'
      });
    }
    
    if (!data.user) {
      return NextResponse.json({
        success: false,
        error: 'User creation returned no user data'
      });
    }
    
    console.log('✅ Admin user created successfully:', data.user.email);
    
    // Return success response with user info
    const successResponse = NextResponse.json({
      success: true,
      message: `Admin user ${email} created successfully`,
      user: {
        id: data.user.id,
        email: data.user.email,
        emailConfirmed: !!data.user.email_confirmed_at,
        createdAt: data.user.created_at
      },
      session: {
        hasAccessToken: !!data.session?.access_token,
        expiresAt: data.session?.expires_at
      }
    });
    
    // Copy any cookies from the response
    response.headers.forEach((value, key) => {
      if (key.toLowerCase().includes('cookie')) {
        successResponse.headers.set(key, value);
      }
    });
    
    return successResponse;
    
  } catch (error) {
    console.error('❌ Create admin error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to create admin user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
/**
 * Debug Authentication Test
 * 
 * Simple endpoint to test Supabase connection and check user existence
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server-client';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing Supabase connection...');
    
    // Test basic Supabase connection
    const supabase = await createServerSupabaseClient();
    
    // Try to get users count (basic test)
    const { count, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.log('❌ Database query error:', countError.message);
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: countError.message
      });
    }
    
    console.log('✅ Supabase connection successful, users count:', count);
    
    // Test auth connection by trying to list auth users (requires service role)
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log('⚠️ Auth admin query error:', authError.message);
      return NextResponse.json({
        success: true,
        database: 'connected',
        usersCount: count,
        auth: 'limited_access',
        message: 'Database connected but auth admin access limited',
        details: authError.message
      });
    }
    
    console.log('✅ Auth connection successful, auth users count:', authData?.users?.length || 0);
    
    return NextResponse.json({
      success: true,
      database: 'connected',
      usersCount: count,
      auth: 'connected',
      authUsersCount: authData?.users?.length || 0,
      message: 'All connections successful'
    });
    
  } catch (error) {
    console.error('❌ Debug auth test error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Connection test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
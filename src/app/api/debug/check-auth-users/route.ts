/**
 * Check Supabase Auth Users
 * 
 * Try to check what users exist in Supabase Auth
 */

import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server-client';

export async function GET() {
  try {
    console.log('🔍 Checking Supabase Auth users...');
    
    const supabase = createAdminSupabaseClient();
    
    // Try to list auth users using admin client
    const { data, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.log('❌ Auth admin error:', error.message);
      return NextResponse.json({
        success: false,
        error: 'Cannot access auth users',
        details: error.message,
        suggestion: 'Check SUPABASE_SERVICE_ROLE_KEY in env'
      });
    }
    
    console.log('✅ Found auth users:', data.users?.length || 0);
    
    return NextResponse.json({
      success: true,
      authUserCount: data.users?.length || 0,
      users: data.users?.map(user => ({
        id: user.id,
        email: user.email,
        emailConfirmed: !!user.email_confirmed_at,
        createdAt: user.created_at
      })) || []
    });
    
  } catch (error) {
    console.error('❌ Check auth users error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to check auth users',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
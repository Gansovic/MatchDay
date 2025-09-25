/**
 * Debug List Users
 * 
 * List users from the database to help with testing
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server-client';

export async function GET() {
  try {
    console.log('🔍 Listing users for debug...');
    
    const supabase = await createServerSupabaseClient();
    
    // Get users from the users table
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, full_name, created_at')
      .limit(10);
    
    if (error) {
      console.log('❌ Users query error:', error.message);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch users',
        details: error.message
      });
    }
    
    console.log('✅ Found users:', users?.length || 0);
    
    return NextResponse.json({
      success: true,
      userCount: users?.length || 0,
      users: users?.map(user => ({
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        createdAt: user.created_at
      })) || []
    });
    
  } catch (error) {
    console.error('❌ Debug list users error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to list users',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
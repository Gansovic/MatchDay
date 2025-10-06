/**
 * Debug Delete User
 * 
 * Delete a user from Supabase Auth to allow fresh creation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server-client';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Email is required'
      }, { status: 400 });
    }
    
    console.log('🗑️ Deleting user:', email);
    
    const supabase = createAdminSupabaseClient();
    
    // First, find the user by email
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.log('❌ Failed to list users:', listError.message);
      return NextResponse.json({
        success: false,
        error: 'Failed to list users',
        details: listError.message
      });
    }
    
    const targetUser = users.users?.find(user => user.email === email);
    
    if (!targetUser) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
        message: `No user found with email: ${email}`
      });
    }
    
    // Delete the user
    const { error: deleteError } = await supabase.auth.admin.deleteUser(targetUser.id);
    
    if (deleteError) {
      console.log('❌ Failed to delete user:', deleteError.message);
      return NextResponse.json({
        success: false,
        error: 'Failed to delete user',
        details: deleteError.message
      });
    }
    
    console.log('✅ User deleted successfully:', email);
    
    return NextResponse.json({
      success: true,
      message: `User ${email} deleted successfully`,
      deletedUserId: targetUser.id
    });
    
  } catch (error) {
    console.error('❌ Delete user error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to delete user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
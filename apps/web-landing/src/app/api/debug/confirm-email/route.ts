/**
 * Debug Confirm Email
 * 
 * Manually confirm a user's email address
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
    
    console.log('📧 Confirming email for:', email);
    
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
    
    // Confirm the user's email
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      targetUser.id,
      {
        email_confirm: true
      }
    );
    
    if (updateError) {
      console.log('❌ Failed to confirm email:', updateError.message);
      return NextResponse.json({
        success: false,
        error: 'Failed to confirm email',
        details: updateError.message
      });
    }
    
    console.log('✅ Email confirmed successfully:', email);
    
    return NextResponse.json({
      success: true,
      message: `Email confirmed for ${email}`,
      userId: targetUser.id
    });
    
  } catch (error) {
    console.error('❌ Confirm email error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to confirm email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
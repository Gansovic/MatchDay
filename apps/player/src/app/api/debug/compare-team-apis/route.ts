/**
 * Debug Compare Team APIs
 * 
 * Compare the results from /api/teams and /api/user/teams for a specific user
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 });
    }
    
    console.log('🔍 Comparing team APIs for user:', userId);
    
    // Test /api/user/teams
    const userTeamsResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/user/teams`, {
      credentials: 'include'
    });
    
    let userTeamsData = null;
    if (userTeamsResponse.ok) {
      userTeamsData = await userTeamsResponse.json();
    }
    
    // Test /api/teams
    const teamsResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/teams`, {
      credentials: 'include'
    });
    
    let teamsData = null;
    if (teamsResponse.ok) {
      teamsData = await teamsResponse.json();
    }
    
    console.log('🔍 API Comparison Results:', {
      userTeamsStatus: userTeamsResponse.status,
      teamsStatus: teamsResponse.status,
      userTeamsCount: userTeamsData?.teams?.length || 0,
      teamsCount: teamsData?.data?.length || 0
    });
    
    return NextResponse.json({
      success: true,
      userId,
      comparison: {
        userTeamsApi: {
          status: userTeamsResponse.status,
          url: '/api/user/teams',
          count: userTeamsData?.teams?.length || 0,
          data: userTeamsData
        },
        teamsApi: {
          status: teamsResponse.status,
          url: '/api/teams',
          count: teamsData?.data?.length || 0,
          data: teamsData
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Compare team APIs error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to compare team APIs',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
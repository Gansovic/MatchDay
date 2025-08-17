/**
 * Leagues API Routes
 * 
 * Handles league-related API operations:
 * - GET /api/leagues - Get available leagues for team creation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

/**
 * GET /api/leagues
 * Get available leagues for team creation
 */
export async function GET(request: NextRequest) {
  try {
    // For testing purposes, return mock data
    // TODO: Replace with actual database connection when Supabase is configured
    const mockLeagues = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'League1',
        description: 'Professional football league - Division 1',
        season: '2024/25',
        created_at: '2024-08-16T10:00:00Z'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        name: 'LaLiga',
        description: 'Spanish professional football league',
        season: '2024/25',
        created_at: '2024-08-16T10:00:00Z'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        name: 'Weekend Football Division',
        description: 'Casual weekend football league',
        season: '2024/25',
        created_at: '2024-08-16T10:00:00Z'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440004',
        name: 'City Championship League',
        description: 'City-wide championship competition',
        season: '2024/25',
        created_at: '2024-08-16T10:00:00Z'
      }
    ];

    return NextResponse.json({
      data: mockLeagues,
      message: 'Leagues retrieved successfully'
    });

  } catch (error) {
    console.error('Error in GET /api/leagues:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
/**
 * API Route: Approve Team League Request
 * 
 * POST /api/league-requests/[requestId]/approve
 * Approves a team's request to join a league
 */

import { NextRequest, NextResponse } from 'next/server';
import { LeagueRequestService } from '@/lib/services/league-request.service';
import { supabase } from '@/lib/supabase/client';

export async function POST(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  try {
    const { requestId } = await params;
    
    if (!requestId) {
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      );
    }

    // Get the user from the session
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Get user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const { responseMessage } = body;

    // Use the LeagueRequestService to approve the request
    const leagueRequestService = LeagueRequestService.getInstance();
    
    const result = await leagueRequestService.approveRequest({
      requestId,
      adminId: user.id,
      responseMessage: responseMessage || undefined
    });

    if (!result.success) {
      const statusCode = result.error?.code === 'REQUEST_NOT_FOUND' ? 404 :
                        result.error?.code === 'INSUFFICIENT_PERMISSIONS' ? 403 :
                        result.error?.code === 'REQUEST_ALREADY_PROCESSED' ? 409 :
                        500;

      return NextResponse.json(
        { 
          error: result.error?.message || 'Failed to approve request',
          code: result.error?.code
        },
        { status: statusCode }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message || 'Request approved successfully',
      data: result.data
    });

  } catch (error) {
    console.error('Error approving request:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
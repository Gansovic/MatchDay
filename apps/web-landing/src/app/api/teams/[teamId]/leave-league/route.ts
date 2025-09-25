import { NextRequest, NextResponse } from 'next/server';

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    
    // This endpoint now redirects to the leave-season endpoint
    // since we're using season-based registration
    const baseUrl = request.nextUrl.origin;
    const leaveSeasonUrl = `${baseUrl}/api/teams/${teamId}/leave-season`;
    
    // Forward the request to leave-season endpoint
    const response = await fetch(leaveSeasonUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}), // No seasonId means leave current season
    });

    const data = await response.json();
    
    const proxyResponse = NextResponse.json(data, { status: response.status });
    
    // Add CORS headers
    proxyResponse.headers.set('Access-Control-Allow-Origin', '*');
    proxyResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    proxyResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return proxyResponse;
  } catch (error) {
    console.error('Error in leave-league proxy:', error);
    return NextResponse.json(
      { 
        success: false,
        data: null,
        error: 'Failed to leave league' 
      },
      { status: 500 }
    );
  }
}
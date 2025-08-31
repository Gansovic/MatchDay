import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server-client';

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export async function GET() {
  try {
    // Use Supabase to get leagues
    const supabase = createServerSupabaseClient();
    
    const { data: leagues, error, count } = await supabase
      .from('leagues')
      .select('id, name, description, is_active, is_public', { count: 'exact' })
      .order('name');
    
    if (error) {
      throw new Error(`Leagues query error: ${error.message}`);
    }
    
    const response = NextResponse.json({
      leagues: leagues || [],
      count: count || 0
    });
    
    // Add CORS headers for direct HTML access
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  } catch (error) {
    console.error('Database query error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leagues' },
      { status: 500 }
    );
  }
}
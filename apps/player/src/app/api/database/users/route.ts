import { NextResponse } from 'next/server';
import DirectDatabaseService from '@/lib/database/direct-db.service';

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export async function GET() {
  try {
    const dbService = DirectDatabaseService.getInstance();
    const client = await dbService['pool'].connect();
    
    try {
      const result = await client.query(`
        SELECT 
          id,
          email,
          full_name,
          phone,
          date_of_birth,
          position,
          role,
          bio,
          created_at,
          updated_at
        FROM users 
        ORDER BY created_at DESC
      `);
      
      const response = NextResponse.json({
        users: result.rows,
        count: result.rowCount
      });
      
      // Add CORS headers for direct HTML access
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      return response;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database query error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
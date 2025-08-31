/**
 * Team Invitations API Route
 * 
 * POST /api/teams/[teamId]/invitations - Generate a new team invitation
 */

import { NextRequest, NextResponse } from 'next/server';
import DirectDatabaseService from '@/lib/database/direct-db.service';
import jwt from 'jsonwebtoken';
import { SendInvitationForm } from '@/lib/types/database.types';

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
    
    if (!teamId) {
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      );
    }

    // Development mode: Use a default user if no proper auth
    let userId: string = 'eec00b4f-7e94-4d76-8f2a-7364b49d1c86'; // Default to player@matchday.com
    
    if (process.env.NODE_ENV === 'production') {
      // Only enforce JWT in production
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Authentication required' },
          { status: 401 }
        );
      }

      const token = authHeader.replace('Bearer ', '');
      
      try {
        const jwtSecret = process.env.SUPABASE_JWT_SECRET || 'jUZj2O0d4B9nxxsU6p7xN3x81z9UGdY/lqbfIlUKb/Q=';
        const decoded = jwt.verify(token, jwtSecret) as any;
        userId = decoded.sub;
      } catch (jwtError) {
        return NextResponse.json(
          { error: 'Invalid token', message: 'JWT verification failed' },
          { status: 401 }
        );
      }
    } else {
      console.log('🧪 Development mode: Using default user for team invitations API');
    }

    // Parse request body
    const body: SendInvitationForm = await request.json();
    
    // Validate required fields
    if (!body.email || !body.email.trim()) {
      return NextResponse.json(
        { 
          error: 'Validation error',
          validationErrors: [{ field: 'email', message: 'Email is required' }]
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { 
          error: 'Validation error',
          validationErrors: [{ field: 'email', message: 'Please enter a valid email address' }]
        },
        { status: 400 }
      );
    }

    // Validate jersey number if provided
    if (body.jersey_number !== undefined) {
      const jersey = Number(body.jersey_number);
      if (isNaN(jersey) || jersey < 1 || jersey > 99) {
        return NextResponse.json(
          { 
            error: 'Validation error',
            validationErrors: [{ field: 'jersey_number', message: 'Jersey number must be between 1 and 99' }]
          },
          { status: 400 }
        );
      }
    }

    const dbService = DirectDatabaseService.getInstance();
    const client = await dbService['pool'].connect();
    
    try {
      // Check if user is captain of the team
      const captainCheck = await client.query(`
        SELECT captain_id FROM teams WHERE id = $1
      `, [teamId]);

      if (captainCheck.rows.length === 0) {
        return NextResponse.json(
          { error: 'Team not found' },
          { status: 404 }
        );
      }

      if (captainCheck.rows[0].captain_id !== userId) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Only team captains can send invitations' },
          { status: 403 }
        );
      }

      // Check if user is already invited or a member
      const existingCheck = await client.query(`
        SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = (
          SELECT id FROM users WHERE email = $2
        ) AND is_active = true
        UNION
        SELECT 1 FROM team_invitations 
        WHERE team_id = $1 AND email = $2 AND status = 'pending' AND expires_at > NOW()
      `, [teamId, body.email.trim().toLowerCase()]);

      if (existingCheck.rows.length > 0) {
        return NextResponse.json(
          { 
            error: 'Validation error',
            validationErrors: [{ 
              field: 'email', 
              message: 'This user is already a member or has a pending invitation' 
            }]
          },
          { status: 400 }
        );
      }

      // Check if jersey number is already taken (if provided)
      if (body.jersey_number) {
        const jerseyCheck = await client.query(`
          SELECT 1 FROM team_members 
          WHERE team_id = $1 AND jersey_number = $2 AND is_active = true
        `, [teamId, body.jersey_number]);

        if (jerseyCheck.rows.length > 0) {
          return NextResponse.json(
            { 
              error: 'Validation error',
              validationErrors: [{ 
                field: 'jersey_number', 
                message: 'This jersey number is already taken' 
              }]
            },
            { status: 400 }
          );
        }
      }

      // Create invitation
      const invitationResult = await client.query(`
        INSERT INTO team_invitations (
          team_id, 
          invited_by, 
          email, 
          position, 
          jersey_number, 
          message,
          status,
          expires_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW() + INTERVAL '7 days')
        RETURNING id, token, expires_at
      `, [
        teamId,
        userId,
        body.email.trim().toLowerCase(),
        body.position || null,
        body.jersey_number || null,
        body.message?.trim() || null
      ]);

      const invitation = invitationResult.rows[0];

      // Get team information for the response
      const teamResult = await client.query(`
        SELECT name FROM teams WHERE id = $1
      `, [teamId]);

      const teamName = teamResult.rows[0]?.name || 'Team';

      // Generate invitation URL
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const invitationUrl = `${baseUrl}/invitations/${invitation.token}`;

      // Generate WhatsApp message
      const whatsappMessage = `Hi! You've been invited to join ${teamName} on MatchDay! Click the link to accept: ${invitationUrl}`;
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

      const response = NextResponse.json({
        data: {
          id: invitation.id,
          token: invitation.token,
          invitationUrl,
          whatsappUrl,
          expiresAt: invitation.expires_at,
          teamName
        },
        message: 'Invitation created successfully'
      });
      
      // Add CORS headers
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      return response;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Team invitations API error:', error);
    return NextResponse.json(
      { error: 'Failed to create invitation' },
      { status: 500 }
    );
  }
}
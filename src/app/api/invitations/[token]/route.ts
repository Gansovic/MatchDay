/**
 * Invitation Acceptance API Route
 * 
 * GET /api/invitations/[token] - Get invitation details (for preview)
 * POST /api/invitations/[token] - Accept invitation and join team
 */

import { NextRequest, NextResponse } from 'next/server';
import DirectDatabaseService from '@/lib/database/direct-db.service';
import jwt from 'jsonwebtoken';

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Invitation token is required' },
        { status: 400 }
      );
    }

    const dbService = DirectDatabaseService.getInstance();
    const client = await dbService['pool'].connect();
    
    try {
      // Get invitation details with team information
      const invitationResult = await client.query(`
        SELECT 
          i.id,
          i.team_id,
          i.invited_by,
          i.email,
          i.position,
          i.jersey_number,
          i.message,
          i.status,
          i.expires_at,
          i.created_at,
          t.name as team_name,
          t.team_color,
          t.team_bio,
          t.location,
          l.name as league_name,
          u.email as inviter_email,
          COALESCE(up.display_name, up.full_name, u.email) as inviter_name
        FROM team_invitations i
        JOIN teams t ON i.team_id = t.id
        LEFT JOIN leagues l ON t.league_id = l.id
        JOIN users u ON i.invited_by = u.id
        LEFT JOIN user_profiles up ON u.id = up.id
        WHERE i.token = $1
      `, [token]);

      if (invitationResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Invitation not found' },
          { status: 404 }
        );
      }

      const invitation = invitationResult.rows[0];

      // Check if invitation has expired
      const now = new Date();
      const expiresAt = new Date(invitation.expires_at);
      const isExpired = now > expiresAt;

      // Check if invitation is already accepted
      const isAccepted = invitation.status === 'accepted';

      // Get team member count
      const memberCountResult = await client.query(`
        SELECT COUNT(*) as count
        FROM team_members 
        WHERE team_id = $1 AND is_active = true
      `, [invitation.team_id]);

      const memberCount = parseInt(memberCountResult.rows[0].count) || 0;

      const response = NextResponse.json({
        data: {
          id: invitation.id,
          team: {
            id: invitation.team_id,
            name: invitation.team_name,
            color: invitation.team_color || '#3B82F6',
            description: invitation.team_bio,
            location: invitation.location,
            memberCount: memberCount,
            league: invitation.league_name || 'Independent'
          },
          invitation: {
            email: invitation.email,
            position: invitation.position,
            jerseyNumber: invitation.jersey_number,
            message: invitation.message,
            status: invitation.status,
            expiresAt: invitation.expires_at,
            createdAt: invitation.created_at,
            isExpired,
            isAccepted
          },
          inviter: {
            email: invitation.inviter_email,
            name: invitation.inviter_name
          }
        },
        message: 'Invitation details retrieved successfully'
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
    console.error('Get invitation API error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve invitation' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Invitation token is required' },
        { status: 400 }
      );
    }

    // Development mode: Use a default user if no proper auth
    let userId: string = 'eec00b4f-7e94-4d76-8f2a-7364b49d1c86'; // Default to player@matchday.com
    let userEmail: string = 'player@matchday.com';
    
    if (process.env.NODE_ENV === 'production') {
      // Only enforce JWT in production
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Authentication required' },
          { status: 401 }
        );
      }

      const jwtToken = authHeader.replace('Bearer ', '');
      
      try {
        const jwtSecret = process.env.SUPABASE_JWT_SECRET || 'jUZj2O0d4B9nxxsU6p7xN3x81z9UGdY/lqbfIlUKb/Q=';
        const decoded = jwt.verify(jwtToken, jwtSecret) as any;
        userId = decoded.sub;
        userEmail = decoded.email;
      } catch (jwtError) {
        return NextResponse.json(
          { error: 'Invalid token', message: 'JWT verification failed' },
          { status: 401 }
        );
      }
    } else {
      console.log('🧪 Development mode: Using default user for invitation acceptance API');
    }

    const dbService = DirectDatabaseService.getInstance();
    const client = await dbService['pool'].connect();
    
    try {
      // Get invitation details
      const invitationResult = await client.query(`
        SELECT 
          i.id,
          i.team_id,
          i.email,
          i.position,
          i.jersey_number,
          i.status,
          i.expires_at,
          t.name as team_name,
          t.max_players
        FROM team_invitations i
        JOIN teams t ON i.team_id = t.id
        WHERE i.token = $1
      `, [token]);

      if (invitationResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Invitation not found' },
          { status: 404 }
        );
      }

      const invitation = invitationResult.rows[0];

      // Check if invitation has expired
      const now = new Date();
      const expiresAt = new Date(invitation.expires_at);
      if (now > expiresAt) {
        // Mark as expired
        await client.query(`
          UPDATE team_invitations SET status = 'expired' WHERE id = $1
        `, [invitation.id]);

        return NextResponse.json(
          { error: 'Invitation has expired' },
          { status: 410 }
        );
      }

      // Check if invitation is already accepted
      if (invitation.status === 'accepted') {
        return NextResponse.json(
          { error: 'Invitation has already been accepted' },
          { status: 409 }
        );
      }

      // Check if invitation email matches user email (if specified)
      if (invitation.email && invitation.email !== userEmail.toLowerCase()) {
        return NextResponse.json(
          { error: 'This invitation was sent to a different email address' },
          { status: 403 }
        );
      }

      // Check if user is already a member of the team
      const memberCheck = await client.query(`
        SELECT 1 FROM team_members 
        WHERE team_id = $1 AND user_id = $2 AND is_active = true
      `, [invitation.team_id, userId]);

      if (memberCheck.rows.length > 0) {
        return NextResponse.json(
          { error: 'You are already a member of this team' },
          { status: 409 }
        );
      }

      // Check team capacity
      const memberCountResult = await client.query(`
        SELECT COUNT(*) as count
        FROM team_members 
        WHERE team_id = $1 AND is_active = true
      `, [invitation.team_id]);

      const memberCount = parseInt(memberCountResult.rows[0].count) || 0;
      const maxPlayers = invitation.max_players || 22;

      if (memberCount >= maxPlayers) {
        return NextResponse.json(
          { error: 'Team is at maximum capacity' },
          { status: 409 }
        );
      }

      // Check if jersey number is still available (if specified)
      if (invitation.jersey_number) {
        const jerseyCheck = await client.query(`
          SELECT 1 FROM team_members 
          WHERE team_id = $1 AND jersey_number = $2 AND is_active = true
        `, [invitation.team_id, invitation.jersey_number]);

        if (jerseyCheck.rows.length > 0) {
          return NextResponse.json(
            { error: 'The requested jersey number is no longer available' },
            { status: 409 }
          );
        }
      }

      // Begin transaction
      await client.query('BEGIN');

      try {
        // Add user to team
        await client.query(`
          INSERT INTO team_members (
            team_id, 
            user_id, 
            position, 
            jersey_number, 
            is_active,
            joined_at
          )
          VALUES ($1, $2, $3, $4, true, NOW())
        `, [
          invitation.team_id,
          userId,
          invitation.position,
          invitation.jersey_number
        ]);

        // Mark invitation as accepted
        await client.query(`
          UPDATE team_invitations 
          SET status = 'accepted', updated_at = NOW()
          WHERE id = $1
        `, [invitation.id]);

        // Commit transaction
        await client.query('COMMIT');

        const response = NextResponse.json({
          data: {
            teamId: invitation.team_id,
            teamName: invitation.team_name,
            position: invitation.position,
            jerseyNumber: invitation.jersey_number
          },
          message: `Successfully joined ${invitation.team_name}!`
        });
        
        // Add CORS headers
        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        
        return response;
      } catch (error) {
        // Rollback transaction
        await client.query('ROLLBACK');
        throw error;
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Accept invitation API error:', error);
    return NextResponse.json(
      { error: 'Failed to accept invitation' },
      { status: 500 }
    );
  }
}
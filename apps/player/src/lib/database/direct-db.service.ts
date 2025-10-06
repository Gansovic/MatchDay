/**
 * Direct Database Service for Development
 * 
 * Bypasses Supabase PostgREST issues by connecting directly to PostgreSQL.
 * Used when Supabase JWT authentication is problematic during development.
 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

class DirectDatabaseService {
  private static instance: DirectDatabaseService;
  private pool: Pool;

  private constructor() {
    // Parse DATABASE_URL from environment
    const databaseUrl = process.env.DATABASE_URL || 'postgresql://matchday_user:matchday_pass@localhost:5433/matchday';
    
    this.pool = new Pool({
      connectionString: databaseUrl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  static getInstance(): DirectDatabaseService {
    if (!DirectDatabaseService.instance) {
      DirectDatabaseService.instance = new DirectDatabaseService();
    }
    return DirectDatabaseService.instance;
  }

  /**
   * Find league by name
   */
  async findLeagueByName(leagueName: string) {
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT id, name, description, is_active, is_public
        FROM leagues 
        WHERE name = $1 AND is_active = true AND is_public = true
      `;
      const result = await client.query(query, [leagueName]);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  /**
   * Create a new team
   */
  async createTeam(teamData: {
    name: string;
    league_id: string | null;
    captain_id: string;
    team_color?: string;
    max_players?: number;
    min_players?: number;
    team_bio?: string;
  }) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Generate proper UUID for team ID
      const teamId = uuidv4();

      // Insert team
      const teamInsertQuery = `
        INSERT INTO teams (
          id, name, league_id, captain_id, team_color, 
          max_players, min_players, team_bio, is_recruiting, 
          created_at, updated_at, is_archived
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
        ) RETURNING *
      `;
      
      const teamValues = [
        teamId,
        teamData.name,
        teamData.league_id,
        teamData.captain_id,
        teamData.team_color || '#2563eb',
        teamData.max_players || 22,
        teamData.min_players || 7,
        teamData.team_bio || null,
        true, // is_recruiting
        new Date().toISOString(),
        new Date().toISOString(),
        false // is_archived
      ];

      const teamResult = await client.query(teamInsertQuery, teamValues);
      const newTeam = teamResult.rows[0];

      // Add captain as team member
      const memberInsertQuery = `
        INSERT INTO team_members (
          team_id, user_id, position, jersey_number, 
          is_active, joined_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6
        )
      `;

      const memberValues = [
        teamId,
        teamData.captain_id,
        'midfielder', // default position
        1, // captain gets jersey number 1
        true, // is_active
        new Date().toISOString()
      ];

      await client.query(memberInsertQuery, memberValues);

      await client.query('COMMIT');
      
      console.log('✅ Team created directly in database:', newTeam.name);
      
      return {
        success: true,
        data: {
          ...newTeam,
          memberCount: 1,
          availableSpots: (teamData.max_players || 22) - 1
        }
      };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Direct database team creation failed:', error);
      return {
        success: false,
        error: {
          code: 'DB_ERROR',
          message: error instanceof Error ? error.message : 'Database operation failed'
        }
      };
    } finally {
      client.release();
    }
  }

  /**
   * Get teams for a user
   */
  async getUserTeams(userId: string) {
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT 
          t.id,
          t.name,
          t.league_id,
          t.team_color,
          t.max_players,
          t.team_bio,
          t.created_at,
          t.captain_id,
          l.name as league_name,
          l.description as league_description,
          COUNT(tm.user_id) as member_count
        FROM teams t
        INNER JOIN team_members tm ON t.id = tm.team_id
        LEFT JOIN leagues l ON t.league_id = l.id
        WHERE tm.user_id = $1 AND tm.is_active = true
        GROUP BY t.id, l.name, l.description
        ORDER BY t.created_at DESC
      `;
      
      const result = await client.query(query, [userId]);
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Check if user exists (for JWT validation)
   */
  async findUserById(userId: string) {
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT id, email, full_name
        FROM users 
        WHERE id = $1
      `;
      const result = await client.query(query, [userId]);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  /**
   * Close database connections
   */
  async close() {
    await this.pool.end();
  }
}

export default DirectDatabaseService;
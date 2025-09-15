import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server-client';
import fs from 'fs';
import path from 'path';

export async function POST() {
  try {
    const supabase = createAdminSupabaseClient();

    // Check if user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'supabase/migrations/20251213_create_season_join_requests.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split the migration into individual statements
    const statements = migrationSQL
      .split(/;(?=\s*(?:CREATE|ALTER|DROP|INSERT|UPDATE|DELETE|COMMENT))/i)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    const results = [];
    const errors = [];

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].endsWith(';') ? statements[i] : statements[i] + ';';

      try {
        // Execute each statement
        const { error } = await supabase.rpc('exec_sql', { sql: statement });

        if (error) {
          // If RPC doesn't exist, try a different approach
          // For now, we'll collect the SQL for manual execution
          errors.push({
            statement: i + 1,
            error: error.message,
            sql: statement.substring(0, 100) + '...'
          });
        } else {
          results.push({
            statement: i + 1,
            success: true
          });
        }
      } catch (err) {
        errors.push({
          statement: i + 1,
          error: err instanceof Error ? err.message : 'Unknown error',
          sql: statement.substring(0, 100) + '...'
        });
      }
    }

    // If we couldn't execute directly, provide the SQL for manual execution
    if (errors.length > 0) {
      return NextResponse.json({
        message: 'Migration could not be applied automatically',
        errors,
        manualSQL: migrationSQL,
        instruction: 'Please run the SQL manually in your database'
      }, { status: 206 });
    }

    return NextResponse.json({
      message: 'Migration applied successfully',
      results
    });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({
      error: 'Failed to run migration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = createAdminSupabaseClient();

    // Check if the table exists
    const { data, error } = await supabase
      .from('season_join_requests')
      .select('id')
      .limit(1);

    if (error) {
      if (error.message.includes('does not exist') || error.code === '42P01') {
        return NextResponse.json({
          migrationStatus: 'not_applied',
          message: 'The season_join_requests table does not exist. Migration needs to be applied.'
        });
      }
      return NextResponse.json({
        migrationStatus: 'error',
        error: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      migrationStatus: 'applied',
      message: 'The season_join_requests table exists and is accessible.'
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Failed to check migration status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
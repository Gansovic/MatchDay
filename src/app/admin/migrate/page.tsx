'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, ExternalLink, Copy, Database } from 'lucide-react';

export default function MigrationPage() {
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [migrationLog, setMigrationLog] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const migrationSQL = `-- ========================================================================
-- PRODUCTION SEASONS MIGRATION SCRIPT FOR SUPABASE
-- Copy and paste this entire script into Supabase SQL Editor
-- ========================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create seasons table with all required columns
CREATE TABLE IF NOT EXISTS seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  display_name VARCHAR(150) NOT NULL,
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  season_year INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  status VARCHAR(50) DEFAULT 'draft',
  description TEXT,
  max_teams INTEGER DEFAULT 20,
  registration_start DATE,
  registration_end DATE,
  tournament_format VARCHAR(50) DEFAULT 'league' CHECK (tournament_format IN ('league', 'knockout', 'hybrid')),
  registration_deadline DATE,
  match_frequency INTEGER DEFAULT 1 CHECK (match_frequency > 0),
  preferred_match_time TIME,
  min_teams INTEGER DEFAULT 2 CHECK (min_teams >= 2),
  rounds INTEGER CHECK (rounds > 0),
  total_matches_planned INTEGER DEFAULT 0 CHECK (total_matches_planned >= 0),
  points_for_win INTEGER DEFAULT 3 CHECK (points_for_win >= 0),
  points_for_draw INTEGER DEFAULT 1 CHECK (points_for_draw >= 0),
  points_for_loss INTEGER DEFAULT 0 CHECK (points_for_loss >= 0),
  allow_draws BOOLEAN DEFAULT true,
  home_away_balance BOOLEAN DEFAULT true,
  fixtures_status VARCHAR(50) DEFAULT 'pending' CHECK (fixtures_status IN ('pending', 'generating', 'completed', 'error')),
  fixtures_generated_at TIMESTAMP WITH TIME ZONE,
  rules JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  
  -- Constraints
  CONSTRAINT seasons_start_before_end CHECK (start_date < end_date),
  CONSTRAINT unique_season_name_per_league UNIQUE(name, league_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_seasons_league_id ON seasons(league_id);
CREATE INDEX IF NOT EXISTS idx_seasons_year ON seasons(season_year);
CREATE INDEX IF NOT EXISTS idx_seasons_status ON seasons(status);
CREATE INDEX IF NOT EXISTS idx_seasons_is_current ON seasons(is_current);
CREATE INDEX IF NOT EXISTS idx_seasons_is_active ON seasons(is_active);
CREATE INDEX IF NOT EXISTS idx_seasons_dates ON seasons(start_date, end_date);

-- Add season_id to matches table
ALTER TABLE matches ADD COLUMN IF NOT EXISTS season_id UUID REFERENCES seasons(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_matches_season_id ON matches(season_id);

-- Create season_teams junction table
CREATE TABLE IF NOT EXISTS season_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'registered' CHECK (status IN ('registered', 'confirmed', 'withdrawn')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_season_team_registration UNIQUE(season_id, team_id)
);

-- Create season_standings table
CREATE TABLE IF NOT EXISTS season_standings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  matches_played INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  goals_for INTEGER DEFAULT 0,
  goals_against INTEGER DEFAULT 0,
  goal_difference INTEGER GENERATED ALWAYS AS (goals_for - goals_against) STORED,
  points INTEGER GENERATED ALWAYS AS (wins * 3 + draws * 1) STORED,
  position INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_season_team_standing UNIQUE(season_id, team_id)
);

-- Enable Row Level Security
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE season_teams ENABLE ROW LEVEL SECURITY;  
ALTER TABLE season_standings ENABLE ROW LEVEL SECURITY;

-- Create basic policies (you can modify these later)
CREATE POLICY "Anyone can view active seasons" ON seasons FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view season teams" ON season_teams FOR SELECT USING (true);
CREATE POLICY "Anyone can view season standings" ON season_standings FOR SELECT USING (true);

-- Insert sample seasons for myLeague
INSERT INTO seasons (
    name, display_name, league_id, season_year, start_date, end_date,
    is_current, is_active, status, description, tournament_format,
    registration_deadline, match_frequency, min_teams, max_teams,
    points_for_win, points_for_draw, points_for_loss, allow_draws, 
    home_away_balance, fixtures_status
) VALUES 
(
    '2024-2025', '2024/25 myLeague Season', 
    '261f251e-aee8-4153-a4c7-537b565e7e3f', 2024,
    '2024-09-01', '2025-06-30',
    true, true, 'active', 
    'Current myLeague season featuring botTeam and bot2Team competing for the championship.',
    'league', '2024-08-20', 1, 2, 10, 3, 1, 0, true, true, 'pending'
),
(
    '2023-2024', '2023/24 myLeague Season',
    '261f251e-aee8-4153-a4c7-537b565e7e3f', 2023, 
    '2023-09-01', '2024-06-30',
    false, false, 'completed',
    'Previous myLeague season - completed championship.',
    'league', '2023-08-20', 1, 2, 10, 3, 1, 0, true, true, 'completed'
),
(
    '2025-2026', '2025/26 myLeague Season (Draft)',
    '261f251e-aee8-4153-a4c7-537b565e7e3f', 2025,
    '2025-09-01', '2026-06-30',
    false, true, 'draft', 
    'Upcoming myLeague season - registration opens soon!',
    'league', '2025-08-20', 1, 2, 10, 3, 1, 0, true, true, 'pending'
) ON CONFLICT (name, league_id) DO NOTHING;

-- Register teams for current season
INSERT INTO season_teams (season_id, team_id, status, registration_date)
SELECT s.id, t.team_id, 'confirmed', NOW()
FROM seasons s
CROSS JOIN (
    VALUES 
    ('a4f112f8-6bad-421f-8b50-77e4d4b7e81e'::UUID),
    ('f9142db6-e738-4f9c-91ca-d7786c904283'::UUID)
) AS t(team_id)
WHERE s.league_id = '261f251e-aee8-4153-a4c7-537b565e7e3f' 
  AND s.is_current = true
ON CONFLICT (season_id, team_id) DO NOTHING;

-- Success message
SELECT 
    'SUCCESS! Seasons migration completed. Check the seasons table.' as message,
    COUNT(*) as seasons_created
FROM seasons 
WHERE league_id = '261f251e-aee8-4153-a4c7-537b565e7e3f';`;

  const runMigration = async () => {
    setMigrationStatus('running');
    setMigrationLog([]);
    setErrorMessage('');

    try {
      // Step 1: Test if migration is needed
      setMigrationLog(prev => [...prev, '🔍 Checking if seasons table exists...']);
      
      const response = await fetch('/api/admin/migrate-seasons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}'
      });
      
      const result = await response.json();
      
      if (result.success) {
        setMigrationLog(prev => [...prev, '✅ Seasons table already exists and data seeded!']);
        setMigrationStatus('success');
      } else {
        setMigrationLog(prev => [...prev, '❌ Seasons table missing - manual migration required']);
        setMigrationStatus('error');
        setErrorMessage('The seasons table does not exist in your production database. Please follow the manual steps below.');
      }
    } catch (error) {
      setMigrationLog(prev => [...prev, `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`]);
      setMigrationStatus('error');
      setErrorMessage('Failed to check migration status');
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(migrationSQL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Production Seasons Migration</h1>
          <p className="text-muted-foreground mt-2">
            Add seasons functionality to your production Supabase database
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Migration Status
            </CardTitle>
            <CardDescription>
              This will create the seasons table structure and seed data for myLeague
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button 
                onClick={runMigration} 
                disabled={migrationStatus === 'running'}
                className="flex items-center gap-2"
              >
                {migrationStatus === 'running' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Checking...
                  </>
                ) : (
                  'Check Migration Status'
                )}
              </Button>
            </div>

            {migrationLog.length > 0 && (
              <div className="bg-gray-100 p-4 rounded-lg font-mono text-sm">
                {migrationLog.map((log, index) => (
                  <div key={index}>{log}</div>
                ))}
              </div>
            )}

            {migrationStatus === 'error' && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {errorMessage}
                </AlertDescription>
              </Alert>
            )}

            {migrationStatus === 'success' && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Migration completed successfully! Seasons are now available in your production database.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {(migrationStatus === 'error' || migrationStatus === 'idle') && (
          <Card>
            <CardHeader>
              <CardTitle>Manual Migration Required</CardTitle>
              <CardDescription>
                Since automatic table creation is not supported, please run this SQL script manually
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Follow these steps to complete the migration:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Copy the SQL script below</li>
                  <li>Go to your <a href="https://supabase.com/dashboard/project/twkipeacdamypppxmmhe" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">Supabase SQL Editor <ExternalLink className="h-3 w-3" /></a></li>
                  <li>Paste and execute the script</li>
                  <li>Click &quot;Check Migration Status&quot; above to verify</li>
                </ol>
              </div>

              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Migration SQL Script</h4>
                  <Button 
                    onClick={copyToClipboard} 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    {copied ? 'Copied!' : 'Copy SQL'}
                  </Button>
                </div>
                <pre className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-96 text-xs">
                  <code>{migrationSQL}</code>
                </pre>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Important:</strong> This script is safe to run multiple times. It uses &quot;IF NOT EXISTS&quot; 
                  clauses to prevent errors if tables already exist.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
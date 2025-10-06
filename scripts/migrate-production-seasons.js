#!/usr/bin/env node

/**
 * Production Seasons Migration Script
 * 
 * This script migrates the seasons schema to your production Supabase database
 * using the service role key to bypass RLS policies.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log('🚀 Starting Production Seasons Migration...');
console.log('📍 Database:', SUPABASE_URL);

// Create admin client with service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Migration SQL queries
const migrations = [
  {
    name: 'Create seasons table',
    sql: `
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
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
        
        -- Constraints
        CONSTRAINT seasons_start_before_end CHECK (start_date < end_date),
        CONSTRAINT unique_season_name_per_league UNIQUE(name, league_id)
      );
    `
  },
  {
    name: 'Add extended season columns',
    sql: `
      ALTER TABLE seasons 
      ADD COLUMN IF NOT EXISTS tournament_format VARCHAR(50) DEFAULT 'league' CHECK (tournament_format IN ('league', 'knockout', 'hybrid')),
      ADD COLUMN IF NOT EXISTS registration_deadline DATE,
      ADD COLUMN IF NOT EXISTS match_frequency INTEGER DEFAULT 1 CHECK (match_frequency > 0),
      ADD COLUMN IF NOT EXISTS preferred_match_time TIME,
      ADD COLUMN IF NOT EXISTS min_teams INTEGER DEFAULT 2 CHECK (min_teams >= 2),
      ADD COLUMN IF NOT EXISTS rounds INTEGER CHECK (rounds > 0),
      ADD COLUMN IF NOT EXISTS total_matches_planned INTEGER DEFAULT 0 CHECK (total_matches_planned >= 0),
      ADD COLUMN IF NOT EXISTS points_for_win INTEGER DEFAULT 3 CHECK (points_for_win >= 0),
      ADD COLUMN IF NOT EXISTS points_for_draw INTEGER DEFAULT 1 CHECK (points_for_draw >= 0),
      ADD COLUMN IF NOT EXISTS points_for_loss INTEGER DEFAULT 0 CHECK (points_for_loss >= 0),
      ADD COLUMN IF NOT EXISTS allow_draws BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS home_away_balance BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS fixtures_status VARCHAR(50) DEFAULT 'pending' CHECK (fixtures_status IN ('pending', 'generating', 'completed', 'error')),
      ADD COLUMN IF NOT EXISTS fixtures_generated_at TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS rules JSONB DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS created_by UUID,
      ADD COLUMN IF NOT EXISTS updated_by UUID;
    `
  },
  {
    name: 'Create season indexes',
    sql: `
      CREATE INDEX IF NOT EXISTS idx_seasons_league_id ON seasons(league_id);
      CREATE INDEX IF NOT EXISTS idx_seasons_year ON seasons(season_year);
      CREATE INDEX IF NOT EXISTS idx_seasons_status ON seasons(status);
      CREATE INDEX IF NOT EXISTS idx_seasons_is_current ON seasons(is_current);
      CREATE INDEX IF NOT EXISTS idx_seasons_is_active ON seasons(is_active);
      CREATE INDEX IF NOT EXISTS idx_seasons_dates ON seasons(start_date, end_date);
      CREATE UNIQUE INDEX IF NOT EXISTS seasons_name_league_unique ON seasons(name, league_id);
    `
  },
  {
    name: 'Add season_id to matches',
    sql: `
      ALTER TABLE matches ADD COLUMN IF NOT EXISTS season_id UUID REFERENCES seasons(id) ON DELETE CASCADE;
      CREATE INDEX IF NOT EXISTS idx_matches_season_id ON matches(season_id);
    `
  },
  {
    name: 'Create season_teams junction table',
    sql: `
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
      
      CREATE INDEX IF NOT EXISTS idx_season_teams_season_id ON season_teams(season_id);
      CREATE INDEX IF NOT EXISTS idx_season_teams_team_id ON season_teams(team_id);
      CREATE INDEX IF NOT EXISTS idx_season_teams_status ON season_teams(status);
    `
  },
  {
    name: 'Create season_standings table',
    sql: `
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
        
        home_wins INTEGER DEFAULT 0,
        home_draws INTEGER DEFAULT 0,
        home_losses INTEGER DEFAULT 0,
        away_wins INTEGER DEFAULT 0,
        away_draws INTEGER DEFAULT 0,
        away_losses INTEGER DEFAULT 0,
        
        recent_form VARCHAR(5) DEFAULT '',
        position INTEGER,
        previous_position INTEGER,
        last_match_date TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        CONSTRAINT unique_season_team_standing UNIQUE(season_id, team_id),
        CONSTRAINT valid_matches_played CHECK (matches_played >= 0),
        CONSTRAINT valid_wins CHECK (wins >= 0),
        CONSTRAINT valid_draws CHECK (draws >= 0),
        CONSTRAINT valid_losses CHECK (losses >= 0),
        CONSTRAINT valid_goals_for CHECK (goals_for >= 0),
        CONSTRAINT valid_goals_against CHECK (goals_against >= 0)
      );
      
      CREATE INDEX IF NOT EXISTS idx_season_standings_season_id ON season_standings(season_id);
      CREATE INDEX IF NOT EXISTS idx_season_standings_team_id ON season_standings(team_id);
      CREATE INDEX IF NOT EXISTS idx_season_standings_points ON season_standings(points DESC);
    `
  },
  {
    name: 'Enable RLS on new tables',
    sql: `
      ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
      ALTER TABLE season_teams ENABLE ROW LEVEL SECURITY;
      ALTER TABLE season_standings ENABLE ROW LEVEL SECURITY;
      
      -- Basic policies for viewing
      CREATE POLICY IF NOT EXISTS "Anyone can view active seasons" ON seasons FOR SELECT USING (is_active = true);
      CREATE POLICY IF NOT EXISTS "Anyone can view season teams" ON season_teams FOR SELECT USING (true);
      CREATE POLICY IF NOT EXISTS "Anyone can view season standings" ON season_standings FOR SELECT USING (true);
      
      -- Admin policies (adjust as needed)
      CREATE POLICY IF NOT EXISTS "Service role can manage seasons" ON seasons FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
      CREATE POLICY IF NOT EXISTS "Service role can manage season teams" ON season_teams FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
      CREATE POLICY IF NOT EXISTS "Service role can manage season standings" ON season_standings FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
    `
  }
];

// Seed data for myLeague
const seedSeasons = async () => {
  const myLeagueId = '261f251e-aee8-4153-a4c7-537b565e7e3f';
  const botTeamId = 'a4f112f8-6bad-421f-8b50-77e4d4b7e81e';
  const bot2TeamId = 'f9142db6-e738-4f9c-91ca-d7786c904283';
  
  const seasons = [
    {
      name: '2024-2025',
      display_name: '2024/25 myLeague Season',
      league_id: myLeagueId,
      season_year: 2024,
      start_date: '2024-09-01',
      end_date: '2025-06-30',
      is_current: true,
      is_active: true,
      status: 'active',
      description: 'Current myLeague season featuring botTeam and bot2Team competing for the championship.',
      tournament_format: 'league',
      registration_deadline: '2024-08-20',
      match_frequency: 1,
      min_teams: 2,
      max_teams: 10,
      points_for_win: 3,
      points_for_draw: 1,
      points_for_loss: 0,
      allow_draws: true,
      home_away_balance: true,
      fixtures_status: 'pending',
      rules: {},
      settings: {},
      metadata: {}
    },
    {
      name: '2023-2024',
      display_name: '2023/24 myLeague Season',
      league_id: myLeagueId,
      season_year: 2023,
      start_date: '2023-09-01',
      end_date: '2024-06-30',
      is_current: false,
      is_active: false,
      status: 'completed',
      description: 'Previous myLeague season - completed championship.',
      tournament_format: 'league',
      registration_deadline: '2023-08-20',
      match_frequency: 1,
      min_teams: 2,
      max_teams: 10,
      points_for_win: 3,
      points_for_draw: 1,
      points_for_loss: 0,
      allow_draws: true,
      home_away_balance: true,
      fixtures_status: 'completed',
      rules: {},
      settings: {},
      metadata: {}
    },
    {
      name: '2025-2026',
      display_name: '2025/26 myLeague Season (Draft)',
      league_id: myLeagueId,
      season_year: 2025,
      start_date: '2025-09-01',
      end_date: '2026-06-30',
      is_current: false,
      is_active: true,
      status: 'draft',
      description: 'Upcoming myLeague season - registration opens soon!',
      tournament_format: 'league',
      registration_deadline: '2025-08-20',
      match_frequency: 1,
      min_teams: 2,
      max_teams: 10,
      points_for_win: 3,
      points_for_draw: 1,
      points_for_loss: 0,
      allow_draws: true,
      home_away_balance: true,
      fixtures_status: 'pending',
      rules: {},
      settings: {},
      metadata: {}
    }
  ];
  
  console.log('📝 Seeding seasons data...');
  const { data: insertedSeasons, error } = await supabase
    .from('seasons')
    .upsert(seasons, { onConflict: 'name,league_id' })
    .select();
    
  if (error) {
    console.error('❌ Error seeding seasons:', error);
    return false;
  }
  
  console.log(`✅ Created ${insertedSeasons.length} seasons`);
  
  // Register teams for current season
  const currentSeason = insertedSeasons.find(s => s.is_current);
  if (currentSeason) {
    const teamRegistrations = [
      { season_id: currentSeason.id, team_id: botTeamId, status: 'confirmed' },
      { season_id: currentSeason.id, team_id: bot2TeamId, status: 'confirmed' }
    ];
    
    const { error: teamError } = await supabase
      .from('season_teams')
      .upsert(teamRegistrations, { onConflict: 'season_id,team_id' });
      
    if (teamError) {
      console.error('❌ Error registering teams:', teamError);
    } else {
      console.log('✅ Registered teams for current season');
    }
    
    // Update existing match to link to current season if exists
    const { error: matchError } = await supabase
      .from('matches')
      .update({ season_id: currentSeason.id })
      .or(`home_team_id.eq.${botTeamId},away_team_id.eq.${botTeamId},home_team_id.eq.${bot2TeamId},away_team_id.eq.${bot2TeamId}`)
      .is('season_id', null);
      
    if (matchError) {
      console.log('⚠️  Could not link existing matches to season:', matchError.message);
    } else {
      console.log('✅ Linked existing matches to current season');
    }
  }
  
  return true;
};

// Main migration function
const runMigration = async () => {
  try {
    console.log('⚡ Running schema migrations...\n');
    
    for (let i = 0; i < migrations.length; i++) {
      const { name, sql } = migrations[i];
      console.log(`${i + 1}/${migrations.length} ${name}...`);
      
      const { error } = await supabase.rpc('query', { query: sql });
      
      if (error) {
        console.error(`❌ Failed: ${error.message}`);
        return false;
      }
      
      console.log('✅ Success');
    }
    
    console.log('\n📊 Schema migration completed!');
    console.log('\n📝 Seeding data...');
    
    const seedSuccess = await seedSeasons();
    if (!seedSuccess) {
      return false;
    }
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📋 What was created:');
    console.log('• seasons table (with 35+ columns)');
    console.log('• season_teams junction table');  
    console.log('• season_standings table');
    console.log('• 3 seasons for myLeague');
    console.log('• Team registrations for current season');
    console.log('• Indexes and constraints');
    console.log('• RLS policies');
    
    console.log('\n🔗 Next steps:');
    console.log('• Check your Supabase dashboard: https://supabase.com/dashboard/project/twkipeacdamypppxmmhe');
    console.log('• Navigate to Table Editor → seasons');
    console.log('• You should now see 3 seasons for myLeague');
    
    return true;
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return false;
  }
};

// Alternative RPC query method
const altRunMigration = async () => {
  try {
    console.log('⚡ Trying alternative migration approach...\n');
    
    // Use raw SQL via the REST API
    for (let i = 0; i < migrations.length; i++) {
      const { name, sql } = migrations[i];
      console.log(`${i + 1}/${migrations.length} ${name}...`);
      
      try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
          },
          body: JSON.stringify({ sql })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ HTTP ${response.status}: ${errorText}`);
          continue;
        }
        
        console.log('✅ Success');
      } catch (error) {
        console.error(`❌ Network error: ${error.message}`);
        continue;
      }
    }
    
    // Try to seed data
    const seedSuccess = await seedSeasons();
    return seedSuccess;
    
  } catch (error) {
    console.error('❌ Alternative migration failed:', error);
    return false;
  }
};

// Run the migration
runMigration().then(success => {
  if (!success) {
    console.log('\n🔄 Trying alternative approach...');
    altRunMigration().then(altSuccess => {
      process.exit(altSuccess ? 0 : 1);
    });
  } else {
    process.exit(0);
  }
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
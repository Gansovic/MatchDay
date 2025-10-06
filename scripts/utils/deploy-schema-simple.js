#!/usr/bin/env node

/**
 * Simple schema deployment for MatchDay
 * Creates tables using individual SQL statements via HTTP
 */

const https = require('https');
const fs = require('fs');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Essential schema components broken into individual statements
const schemaStatements = [
  // Extensions and types
  'create extension if not exists "uuid-ossp";',
  
  "create type user_role as enum ('player', 'captain', 'league_admin', 'admin');",
  
  "create type match_status as enum ('scheduled', 'live', 'completed', 'cancelled');",
  
  "create type invitation_status as enum ('pending', 'accepted', 'declined');",
  
  // Users table
  `create table if not exists public.users (
    id uuid references auth.users on delete cascade not null primary key,
    email varchar(255) unique not null,
    display_name varchar(100),
    full_name varchar(255),
    avatar_url text,
    role user_role not null default 'player',
    preferred_position varchar(50),
    bio text,
    date_of_birth date,
    location varchar(100),
    phone varchar(20),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
  );`,
  
  // Leagues table
  `create table if not exists public.leagues (
    id uuid default uuid_generate_v4() primary key,
    name varchar(100) not null,
    description text,
    sport_type varchar(50) not null default 'football',
    league_type varchar(50) not null default 'competitive',
    season varchar(20) not null default '2024',
    season_start date,
    season_end date,
    location varchar(255),
    is_active boolean default true,
    is_public boolean default true,
    max_teams integer default 12,
    entry_fee decimal(10,2) default 0,
    created_by uuid references public.users(id) on delete cascade,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
  );`,
  
  // Teams table
  `create table if not exists public.teams (
    id uuid default uuid_generate_v4() primary key,
    name varchar(100) not null,
    description text,
    team_bio text,
    logo_url text,
    team_color varchar(7) default '#1E40AF',
    captain_id uuid references public.users(id) on delete set null,
    league_id uuid references public.leagues(id) on delete set null,
    home_ground varchar(100),
    founded_date date,
    max_players integer default 22,
    min_players integer default 7,
    is_active boolean default true,
    is_recruiting boolean default true,
    is_archived boolean default false,
    previous_league_name varchar(100),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
  );`,
  
  // Team members table
  `create table if not exists public.team_members (
    id uuid default uuid_generate_v4() primary key,
    team_id uuid references public.teams(id) on delete cascade not null,
    user_id uuid references public.users(id) on delete cascade not null,
    joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
    position varchar(50),
    jersey_number integer,
    is_active boolean default true,
    unique(team_id, user_id)
  );`,
  
  // Team invitations table (critical for functionality)
  `create table if not exists public.team_invitations (
    id uuid default uuid_generate_v4() primary key,
    token varchar(255) unique default encode(gen_random_bytes(32), 'hex'),
    team_id uuid references public.teams(id) on delete cascade not null,
    user_id uuid references public.users(id) on delete cascade,
    email varchar(255) not null,
    invited_by uuid references public.users(id) on delete cascade not null,
    status invitation_status default 'pending',
    position varchar(50),
    jersey_number integer,
    message text,
    expires_at timestamp with time zone default (now() + interval '7 days'),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    responded_at timestamp with time zone,
    unique(team_id, email)
  );`,
  
  // Matches table
  `create table if not exists public.matches (
    id uuid default uuid_generate_v4() primary key,
    league_id uuid references public.leagues(id) on delete cascade,
    home_team_id uuid references public.teams(id) on delete cascade not null,
    away_team_id uuid references public.teams(id) on delete cascade not null,
    match_date timestamp with time zone not null,
    venue varchar(100),
    status match_status default 'scheduled',
    home_score integer default 0,
    away_score integer default 0,
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    check (home_team_id != away_team_id)
  );`,
];

async function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    // Use Supabase's database direct access if available
    const postData = JSON.stringify({ query: sql });
    
    // Try edge functions endpoint for SQL execution
    const url = new URL('/functions/v1/exec-sql', SUPABASE_URL);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, data: data });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

async function deploySchema() {
  console.log('🚀 Deploying MatchDay schema...');
  console.log(`📡 Target: ${SUPABASE_URL}`);
  
  let successful = 0;
  let failed = 0;
  
  for (let i = 0; i < schemaStatements.length; i++) {
    const statement = schemaStatements[i];
    
    try {
      console.log(`⏳ Creating ${i + 1}/${schemaStatements.length}...`);
      await executeSQL(statement);
      successful++;
      console.log(`✅ Statement ${i + 1} executed successfully`);
    } catch (error) {
      failed++;
      console.warn(`⚠️  Statement ${i + 1} failed: ${error.message}`);
      
      // Continue on "already exists" errors
      if (!error.message.includes('already exists') && 
          !error.message.includes('does not exist')) {
        console.error('❌ Critical error');
        console.error('Statement was:', statement.substring(0, 100) + '...');
      }
    }
  }
  
  console.log(`\n📊 Deployment complete: ${successful} successful, ${failed} failed`);
  
  if (successful > 0) {
    console.log('✅ Core database structure should be ready!');
  }
}

if (require.main === module) {
  deploySchema().catch(console.error);
}
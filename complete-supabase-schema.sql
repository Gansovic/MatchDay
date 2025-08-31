-- Complete MatchDay Database Schema for Supabase Cloud
-- Includes all tables needed for full functionality
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create custom types
create type user_role as enum ('player', 'captain', 'league_admin', 'admin');
create type match_status as enum ('scheduled', 'live', 'completed', 'cancelled');
create type invitation_status as enum ('pending', 'accepted', 'declined');

-- Users table (extends Supabase auth.users)
create table if not exists public.users (
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
);

-- Leagues table
create table if not exists public.leagues (
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
);

-- Teams table
create table if not exists public.teams (
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
);

-- Team members table (many-to-many relationship)
create table if not exists public.team_members (
    id uuid default uuid_generate_v4() primary key,
    team_id uuid references public.teams(id) on delete cascade not null,
    user_id uuid references public.users(id) on delete cascade not null,
    joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
    position varchar(50),
    jersey_number integer,
    is_active boolean default true,
    unique(team_id, user_id)
);

-- Team invitations table (enhanced for your API)
create table if not exists public.team_invitations (
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
);

-- Matches table
create table if not exists public.matches (
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
);

-- Team statistics table
create table if not exists public.team_stats (
    id uuid default uuid_generate_v4() primary key,
    team_id uuid references public.teams(id) on delete cascade not null,
    league_id uuid references public.leagues(id) on delete cascade,
    season_year integer default extract(year from now()),
    games_played integer default 0,
    wins integer default 0,
    draws integer default 0,
    losses integer default 0,
    goals_for integer default 0,
    goals_against integer default 0,
    points integer default 0,
    position integer,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(team_id, season_year)
);

-- League standings table (calculated/cached)
create table if not exists public.league_standings (
    id uuid default uuid_generate_v4() primary key,
    league_id uuid references public.leagues(id) on delete cascade not null,
    team_id uuid references public.teams(id) on delete cascade not null,
    position integer,
    points integer default 0,
    matches_played integer default 0,
    wins integer default 0,
    draws integer default 0,
    losses integer default 0,
    goals_for integer default 0,
    goals_against integer default 0,
    goal_difference integer default 0,
    last_updated timestamp with time zone default timezone('utc'::text, now()),
    unique(league_id, team_id)
);

-- Player leaderboard table
create table if not exists public.player_leaderboard (
    id uuid default uuid_generate_v4() primary key,
    league_id uuid references public.leagues(id) on delete cascade,
    user_id uuid references public.users(id) on delete cascade not null,
    team_id uuid references public.teams(id) on delete cascade,
    goals integer default 0,
    assists integer default 0,
    appearances integer default 0,
    yellow_cards integer default 0,
    red_cards integer default 0,
    last_updated timestamp with time zone default timezone('utc'::text, now()),
    unique(league_id, user_id)
);

-- Row Level Security (RLS) Policies
alter table public.users enable row level security;
alter table public.leagues enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.team_invitations enable row level security;
alter table public.matches enable row level security;
alter table public.team_stats enable row level security;
alter table public.league_standings enable row level security;
alter table public.player_leaderboard enable row level security;

-- Users policies
create policy "Users can view public profiles" on public.users for select using (true);
create policy "Users can insert their own profile" on public.users for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);

-- Leagues policies
create policy "Anyone can view active leagues" on public.leagues for select using (is_active = true);
create policy "Authenticated users can create leagues" on public.leagues for insert with check (auth.role() = 'authenticated');
create policy "League admins can manage leagues" on public.leagues for all using (created_by = auth.uid());

-- Teams policies
create policy "Anyone can view active teams" on public.teams for select using (is_active = true);
create policy "Authenticated users can create teams" on public.teams for insert with check (auth.role() = 'authenticated');
create policy "Team captains can manage their teams" on public.teams for all using (captain_id = auth.uid());

-- Team members policies
create policy "Anyone can view team members" on public.team_members for select using (true);
create policy "Users can join teams" on public.team_members for insert with check (auth.uid() = user_id);
create policy "Team captains can manage members" on public.team_members for all using (
    exists (select 1 from public.teams where id = team_id and captain_id = auth.uid())
);
create policy "Users can leave teams" on public.team_members for delete using (user_id = auth.uid());

-- Team invitations policies
create policy "Users can view their own invitations" on public.team_invitations for select using (
    user_id = auth.uid() or invited_by = auth.uid() or 
    exists (select 1 from public.teams where id = team_id and captain_id = auth.uid())
);
create policy "Team captains can create invitations" on public.team_invitations for insert with check (
    exists (select 1 from public.teams where id = team_id and captain_id = auth.uid())
);
create policy "Users can respond to their invitations" on public.team_invitations for update using (user_id = auth.uid());

-- Matches policies
create policy "Anyone can view matches" on public.matches for select using (true);
create policy "League admins can manage matches" on public.matches for all using (
    exists (select 1 from public.leagues where id = league_id and created_by = auth.uid())
);

-- Team stats policies
create policy "Anyone can view team stats" on public.team_stats for select using (true);
create policy "Team captains can manage their team stats" on public.team_stats for all using (
    exists (select 1 from public.teams where id = team_id and captain_id = auth.uid())
);

-- Standings and leaderboard policies (read-only for most users)
create policy "Anyone can view standings" on public.league_standings for select using (true);
create policy "Anyone can view leaderboard" on public.player_leaderboard for select using (true);

-- Functions for updating timestamps
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

-- Function to automatically create user profile when user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.users (id, email, full_name, display_name)
    values (
        new.id, 
        new.email, 
        coalesce(new.raw_user_meta_data->>'full_name', new.email),
        coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
    );
    return new;
end;
$$ language plpgsql security definer;

-- Triggers for updated_at columns
create trigger handle_users_updated_at before update on public.users
    for each row execute procedure public.handle_updated_at();

create trigger handle_leagues_updated_at before update on public.leagues
    for each row execute procedure public.handle_updated_at();

create trigger handle_teams_updated_at before update on public.teams
    for each row execute procedure public.handle_updated_at();

create trigger handle_matches_updated_at before update on public.matches
    for each row execute procedure public.handle_updated_at();

create trigger handle_team_stats_updated_at before update on public.team_stats
    for each row execute procedure public.handle_updated_at();

-- Trigger to create profile on user signup
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

-- Insert sample data
insert into public.leagues (id, name, description, sport_type, league_type, season, season_start, season_end, is_active, is_public) 
values 
    ('550e8400-e29b-41d4-a716-446655440001', 'Premier Local League', 'The top tier of local football', 'football', 'competitive', '2024', '2024-09-01', '2024-12-31', true, true),
    ('6a82cc2e-6e2c-4fef-8d0e-2bf71e42665a', 'Community Cup', 'Friendly community tournament', 'football', 'casual', '2024', '2024-10-01', '2024-11-30', true, true)
on conflict (id) do nothing;

insert into public.teams (id, name, description, league_id, team_color) 
values 
    ('550e8400-e29b-41d4-a716-446655440200', 'Thunder FC', 'Fast and fierce', '550e8400-e29b-41d4-a716-446655440001', '#FF6B35'),
    ('550e8400-e29b-41d4-a716-446655440201', 'Lightning United', 'Strike like lightning', '550e8400-e29b-41d4-a716-446655440001', '#4ECDC4'),
    ('6980f90c-d948-437d-b0a2-61e6b9386545', 'Storm Raiders', 'Weather the storm', '550e8400-e29b-41d4-a716-446655440001', '#45B7D1'),
    ('664f8bde-c46d-4471-868e-805c71a082f9', 'Phoenix Rising', 'Rise from the ashes', '550e8400-e29b-41d4-a716-446655440001', '#F7931E'),
    ('beef7433-f958-4c55-bea6-bf2d2fbd7ace', 'Eagles FC', 'Soar to victory', null, '#6A4C93')
on conflict (id) do nothing;

-- Insert some sample matches
insert into public.matches (id, league_id, home_team_id, away_team_id, match_date, venue, status, home_score, away_score)
values
    (uuid_generate_v4(), '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440200', '550e8400-e29b-41d4-a716-446655440201', '2024-09-15 15:00:00+00', 'Central Stadium', 'completed', 2, 1),
    (uuid_generate_v4(), '550e8400-e29b-41d4-a716-446655440001', '6980f90c-d948-437d-b0a2-61e6b9386545', '664f8bde-c46d-4471-868e-805c71a082f9', '2024-09-22 15:00:00+00', 'West Field', 'scheduled', 0, 0)
on conflict do nothing;

-- Enable realtime for team invitations (key feature)
alter publication supabase_realtime add table public.team_invitations;
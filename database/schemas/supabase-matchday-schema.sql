-- MatchDay Database Schema for Supabase Cloud
-- Football league management system
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
    avatar_url text,
    role user_role not null default 'player',
    preferred_position varchar(50),
    bio text,
    date_of_birth date,
    location varchar(100),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Leagues table
create table if not exists public.leagues (
    id uuid default uuid_generate_v4() primary key,
    name varchar(100) not null,
    description text,
    season varchar(20) not null default '2024',
    season_start date,
    season_end date,
    is_active boolean default true,
    is_public boolean default true,
    max_teams integer default 12,
    created_by uuid references public.users(id) on delete cascade,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Teams table
create table if not exists public.teams (
    id uuid default uuid_generate_v4() primary key,
    name varchar(100) not null,
    description text,
    logo_url text,
    captain_id uuid references public.users(id) on delete set null,
    league_id uuid references public.leagues(id) on delete set null,
    home_ground varchar(100),
    founded_date date,
    is_active boolean default true,
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

-- Team invitations table
create table if not exists public.team_invitations (
    id uuid default uuid_generate_v4() primary key,
    team_id uuid references public.teams(id) on delete cascade not null,
    user_id uuid references public.users(id) on delete cascade not null,
    invited_by uuid references public.users(id) on delete cascade not null,
    status invitation_status default 'pending',
    message text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    responded_at timestamp with time zone,
    unique(team_id, user_id)
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
alter table public.league_standings enable row level security;
alter table public.player_leaderboard enable row level security;

-- Users policies
create policy "Users can view public profiles" on public.users for select using (true);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);

-- Leagues policies
create policy "Anyone can view active leagues" on public.leagues for select using (is_active = true);
create policy "League admins can manage leagues" on public.leagues for all using (created_by = auth.uid());

-- Teams policies
create policy "Anyone can view active teams" on public.teams for select using (is_active = true);
create policy "Team captains can manage their teams" on public.teams for all using (captain_id = auth.uid());

-- Team members policies
create policy "Anyone can view team members" on public.team_members for select using (true);
create policy "Team captains can manage members" on public.team_members for all using (
    exists (select 1 from public.teams where id = team_id and captain_id = auth.uid())
);
create policy "Users can leave teams" on public.team_members for delete using (user_id = auth.uid());

-- Team invitations policies
create policy "Users can view their own invitations" on public.team_invitations for select using (
    user_id = auth.uid() or invited_by = auth.uid() or 
    exists (select 1 from public.teams where id = team_id and captain_id = auth.uid())
);
create policy "Team captains can create invitations" on public.team_invitations for insert using (
    exists (select 1 from public.teams where id = team_id and captain_id = auth.uid())
);
create policy "Users can respond to their invitations" on public.team_invitations for update using (user_id = auth.uid());

-- Matches policies
create policy "Anyone can view matches" on public.matches for select using (true);
create policy "League admins can manage matches" on public.matches for all using (
    exists (select 1 from public.leagues where id = league_id and created_by = auth.uid())
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

-- Triggers for updated_at columns
create trigger handle_users_updated_at before update on public.users
    for each row execute procedure public.handle_updated_at();

create trigger handle_leagues_updated_at before update on public.leagues
    for each row execute procedure public.handle_updated_at();

create trigger handle_teams_updated_at before update on public.teams
    for each row execute procedure public.handle_updated_at();

create trigger handle_matches_updated_at before update on public.matches
    for each row execute procedure public.handle_updated_at();

-- Insert sample data
insert into public.leagues (id, name, description, season, season_start, season_end, is_active, is_public) 
values 
    ('550e8400-e29b-41d4-a716-446655440001', 'Premier Local League', 'The top tier of local football', '2024', '2024-09-01', '2024-12-31', true, true),
    ('6a82cc2e-6e2c-4fef-8d0e-2bf71e42665a', 'Community Cup', 'Friendly community tournament', '2024', '2024-10-01', '2024-11-30', true, true)
on conflict (id) do nothing;

insert into public.teams (id, name, description, league_id) 
values 
    ('550e8400-e29b-41d4-a716-446655440200', 'Thunder FC', 'Fast and fierce', '550e8400-e29b-41d4-a716-446655440001'),
    ('550e8400-e29b-41d4-a716-446655440201', 'Lightning United', 'Strike like lightning', '550e8400-e29b-41d4-a716-446655440001'),
    ('6980f90c-d948-437d-b0a2-61e6b9386545', 'Storm Raiders', 'Weather the storm', '550e8400-e29b-41d4-a716-446655440001'),
    ('664f8bde-c46d-4471-868e-805c71a082f9', 'Phoenix Rising', 'Rise from the ashes', '550e8400-e29b-41d4-a716-446655440001'),
    ('beef7433-f958-4c55-bea6-bf2d2fbd7ace', 'Eagles FC', 'Soar to victory', null)
on conflict (id) do nothing;

-- Enable realtime for team invitations (key feature)
alter publication supabase_realtime add table public.team_invitations;
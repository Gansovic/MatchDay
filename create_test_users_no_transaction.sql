-- Create Test Users for MatchDay Application (No Transaction)

-- Clean up any existing test data first
DELETE FROM team_league_requests WHERE team_id = '44444444-4444-4444-4444-444444444444';
DELETE FROM team_members WHERE team_id = '44444444-4444-4444-4444-444444444444';
DELETE FROM teams WHERE id = '44444444-4444-4444-4444-444444444444';
DELETE FROM leagues WHERE id = '33333333-3333-3333-3333-333333333333';
DELETE FROM user_profiles WHERE id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
DELETE FROM auth.identities WHERE user_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
DELETE FROM auth.users WHERE id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');

-- 1. CREATE PLAYER USER
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'authenticated',
    'authenticated',
    'player@matchday.com',
    '$2a$10$PkfLMiPUqVnZ6XQB8S.0YuBxQ4V3YwQoLkB3wfmQzHR0LmRxQHhL.', -- PlayerPass123!
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"display_name": "John Player", "full_name": "John Player"}'
);

-- Create user profile for player
INSERT INTO user_profiles (
    id,
    full_name,
    display_name,
    bio,
    preferred_position,
    location,
    created_at,
    updated_at
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'John Player',
    'JohnP',
    'Passionate football player looking for teams to join!',
    'midfielder',
    'New York, USA',
    NOW(),
    NOW()
);

-- 2. CREATE LEAGUE ADMIN USER
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-2222-2222-222222222222',
    'authenticated',
    'authenticated',
    'admin@matchday.com',
    '$2a$10$qF7RCJ5mGJ5xPZH8TQX9XeLlWqFmZHdH9wqhqX8YQqHLvQZ7sRJHq', -- AdminPass123!
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"display_name": "Sarah Admin", "full_name": "Sarah Admin"}'
);

-- Create user profile for admin
INSERT INTO user_profiles (
    id,
    full_name,
    display_name,
    bio,
    preferred_position,
    location,
    created_at,
    updated_at
) VALUES (
    '22222222-2222-2222-2222-222222222222',
    'Sarah Admin',
    'SarahA',
    'League administrator and football enthusiast. Managing competitive leagues since 2020.',
    'goalkeeper',
    'Los Angeles, USA',
    NOW(),
    NOW()
);

-- 3. CREATE A LEAGUE OWNED BY THE ADMIN USER
INSERT INTO leagues (
    id,
    name,
    description,
    sport_type,
    league_type,
    location,
    season_start,
    season_end,
    max_teams,
    entry_fee,
    created_by,
    is_active,
    is_public,
    season,
    created_at,
    updated_at
) VALUES (
    '33333333-3333-3333-3333-333333333333',
    'Champions League 2025',
    'Elite competitive football league for experienced teams. Join us for an exciting season!',
    'football',
    'competitive',
    'Los Angeles Stadium',
    '2025-09-01'::timestamp,
    '2026-05-31'::timestamp,
    16,
    50.00,
    '22222222-2222-2222-2222-222222222222', -- Owned by Sarah Admin
    true,
    true,
    '2025/26',
    NOW(),
    NOW()
);

-- 4. CREATE A TEAM OWNED BY THE PLAYER
INSERT INTO teams (
    id,
    name,
    team_color,
    captain_id,
    max_players,
    min_players,
    is_recruiting,
    team_bio,
    created_at,
    updated_at
) VALUES (
    '44444444-4444-4444-4444-444444444444',
    'Thunder FC',
    '#FF6B6B',
    '11111111-1111-1111-1111-111111111111', -- Captained by John Player
    22,
    11,
    true,
    'A dynamic team looking to compete at the highest level. We value teamwork, dedication, and sportsmanship.',
    NOW(),
    NOW()
);

-- Add the player as a team member of their own team
INSERT INTO team_members (
    id,
    team_id,
    user_id,
    position,
    jersey_number,
    is_active,
    joined_at
) VALUES (
    gen_random_uuid(),
    '44444444-4444-4444-4444-444444444444',
    '11111111-1111-1111-1111-111111111111',
    'midfielder',
    10,
    true,
    NOW()
);

-- 5. CREATE A SAMPLE TEAM JOIN REQUEST
INSERT INTO team_league_requests (
    id,
    team_id,
    league_id,
    requested_by,
    message,
    status,
    created_at,
    expires_at
) VALUES (
    gen_random_uuid(),
    '44444444-4444-4444-4444-444444444444',
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    'We are Thunder FC, an experienced and dedicated team looking to compete in your prestigious league. Our team has been training together for 2 years and we are ready for competitive matches. We would be honored to be part of Champions League 2025!',
    'pending',
    NOW(),
    NOW() + INTERVAL '30 days'
);
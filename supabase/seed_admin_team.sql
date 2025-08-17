-- Create an admin user and team for testing

-- First, create an auth user (admin)
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    role,
    instance_id
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'admin@matchday.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Admin User"}',
    NOW(),
    NOW(),
    'authenticated',
    '00000000-0000-0000-0000-000000000000'
) ON CONFLICT (id) DO NOTHING;

-- Create user profile for the admin
INSERT INTO user_profiles (
    id,
    full_name,
    bio,
    phone
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Admin User',
    'MatchDay Administrator',
    '+1234567890'
) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    bio = EXCLUDED.bio;

-- Create a user record for the admin
INSERT INTO users (
    id,
    email,
    full_name,
    phone,
    position,
    role,
    bio
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'admin@matchday.com',
    'Admin User',
    '+1234567890',
    'midfielder',
    'admin',
    'MatchDay Administrator and team captain'
) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;

-- Get a league ID (we'll use the first one)
DO $$
DECLARE
    league_uuid UUID;
    team_uuid UUID;
BEGIN
    -- Get the first league
    SELECT id INTO league_uuid FROM leagues 
    WHERE sport_type = 'football' AND is_active = true 
    LIMIT 1;
    
    -- Generate a new team ID
    team_uuid := uuid_generate_v4();
    
    -- Create a team for the admin user
    INSERT INTO teams (
        id,
        name,
        league_id,
        captain_id,
        location,
        founded_year,
        max_players,
        min_players,
        team_color,
        team_bio,
        is_recruiting
    ) VALUES (
        team_uuid,
        'FC MatchDay United',
        league_uuid,
        '11111111-1111-1111-1111-111111111111',
        'Downtown Stadium',
        2025,
        22,
        11,
        '#FF6B6B',
        'The premier team for MatchDay administrators and elite players. We play with passion and dedication!',
        true
    ) ON CONFLICT DO NOTHING;
    
    -- Add the admin as a team member (captain)
    INSERT INTO team_members (
        team_id,
        user_id,
        position,
        jersey_number,
        is_active,
        is_starter
    ) VALUES (
        team_uuid,
        '11111111-1111-1111-1111-111111111111',
        'midfielder',
        10,
        true,
        true
    ) ON CONFLICT DO NOTHING;
    
    -- Create team statistics for the current season
    INSERT INTO team_stats (
        team_id,
        league_id,
        season_year,
        wins,
        draws,
        losses,
        goals_for,
        goals_against,
        points
    ) VALUES (
        team_uuid,
        league_uuid,
        2025,
        8,
        3,
        2,
        24,
        12,
        27  -- 8 wins * 3 points + 3 draws * 1 point
    ) ON CONFLICT (team_id, season_year) DO UPDATE SET
        wins = EXCLUDED.wins,
        draws = EXCLUDED.draws,
        losses = EXCLUDED.losses,
        goals_for = EXCLUDED.goals_for,
        goals_against = EXCLUDED.goals_against,
        points = EXCLUDED.points;
    
    RAISE NOTICE 'Team created with ID: %', team_uuid;
END $$;

-- Also create another team for variety
DO $$
DECLARE
    league_uuid UUID;
    team_uuid UUID;
BEGIN
    -- Get a different league
    SELECT id INTO league_uuid FROM leagues 
    WHERE sport_type = 'football' AND is_active = true 
    ORDER BY name DESC
    LIMIT 1;
    
    -- Generate a new team ID
    team_uuid := uuid_generate_v4();
    
    -- Create another team
    INSERT INTO teams (
        id,
        name,
        league_id,
        captain_id,
        location,
        founded_year,
        max_players,
        min_players,
        team_color,
        team_bio,
        is_recruiting
    ) VALUES (
        team_uuid,
        'Thunder FC',
        league_uuid,
        '11111111-1111-1111-1111-111111111111',
        'North Field Arena',
        2024,
        22,
        11,
        '#4ECDC4',
        'Lightning fast attacks and thunderous defense. Join us for an electrifying season!',
        true
    ) ON CONFLICT DO NOTHING;
    
    -- Add the admin as a team member of this team too
    INSERT INTO team_members (
        team_id,
        user_id,
        position,
        jersey_number,
        is_active,
        is_starter
    ) VALUES (
        team_uuid,
        '11111111-1111-1111-1111-111111111111',
        'forward',
        7,
        true,
        true
    ) ON CONFLICT DO NOTHING;
    
    -- Create team statistics
    INSERT INTO team_stats (
        team_id,
        league_id,
        season_year,
        wins,
        draws,
        losses,
        goals_for,
        goals_against,
        points
    ) VALUES (
        team_uuid,
        league_uuid,
        2025,
        5,
        4,
        3,
        18,
        15,
        19  -- 5 wins * 3 points + 4 draws * 1 point
    ) ON CONFLICT (team_id, season_year) DO UPDATE SET
        wins = EXCLUDED.wins,
        draws = EXCLUDED.draws,
        losses = EXCLUDED.losses,
        goals_for = EXCLUDED.goals_for,
        goals_against = EXCLUDED.goals_against,
        points = EXCLUDED.points;
    
    RAISE NOTICE 'Second team created with ID: %', team_uuid;
END $$;

SELECT 'Admin user and teams created successfully!' as message;
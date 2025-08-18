-- Create test data for existing users

-- Clean up old test data
DELETE FROM team_league_requests WHERE team_id = '44444444-4444-4444-4444-444444444444';
DELETE FROM team_members WHERE team_id = '44444444-4444-4444-4444-444444444444';
DELETE FROM teams WHERE id = '44444444-4444-4444-4444-444444444444';

-- Create team for player
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
    '11111111-1111-1111-1111-111111111111',
    22,
    11,
    true,
    'A dynamic team looking to compete at the highest level. We value teamwork, dedication, and sportsmanship.',
    NOW(),
    NOW()
);

-- Add player as team member
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

-- Create team join request
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
    'We are Thunder FC, an experienced and dedicated team looking to compete in your prestigious league!',
    'pending',
    NOW(),
    NOW() + INTERVAL '30 days'
);
-- ============================================================================
-- CREATE AND SIMULATE COMPLETE SEASON
-- ============================================================================
-- This SQL script creates a NEW simulated season based on an existing season.
-- It copies teams, generates fixtures, simulates all matches, and creates stats.
--
-- USAGE: Replace the source_season_id below with your actual season ID
-- ============================================================================

-- Configuration: Source season to copy from (already set to your season)
DO $$
DECLARE
  v_source_season_id UUID := '730c95ae-3df5-454b-bdca-4a98fe86b711'; -- Source season to copy
  v_new_season_id UUID;
  v_source_season RECORD;
  v_team RECORD;
  v_match RECORD;
  v_home_score INT;
  v_away_score INT;
  v_home_players UUID[];
  v_away_players UUID[];
  v_scorer_id UUID;
  v_assister_id UUID;
  v_goals_to_distribute INT;
  v_team_ids UUID[];
  v_fixture RECORD;
  v_round INT;
BEGIN

  RAISE NOTICE '🎮 Starting complete season simulation...';
  RAISE NOTICE '📋 Source Season ID: %', v_source_season_id;

  -- ============================================================================
  -- STEP 1: Get source season details
  -- ============================================================================
  SELECT * INTO v_source_season
  FROM seasons
  WHERE id = v_source_season_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Source season not found: %', v_source_season_id;
  END IF;

  RAISE NOTICE '✅ Found source season: %', v_source_season.name;

  -- ============================================================================
  -- STEP 2: Create new simulated season
  -- ============================================================================
  INSERT INTO seasons (
    name,
    display_name,
    league_id,
    season_year,
    start_date,
    end_date,
    status,
    description,
    max_teams,
    registration_start,
    registration_end,
    is_active,
    is_current,
    created_at,
    updated_at
  )
  VALUES (
    'Simulated - ' || v_source_season.name,
    COALESCE(v_source_season.display_name, v_source_season.name) || ' (Simulated)',
    v_source_season.league_id,
    v_source_season.season_year,
    v_source_season.start_date,
    v_source_season.end_date,
    'completed',
    'Simulated season for debugging/testing purposes',
    v_source_season.max_teams,
    v_source_season.registration_start,
    v_source_season.registration_end,
    true,
    false,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_new_season_id;

  RAISE NOTICE '✅ Created new season: % (ID: %)', 'Simulated - ' || v_source_season.name, v_new_season_id;

  -- ============================================================================
  -- STEP 3: Copy teams from source season
  -- ============================================================================
  INSERT INTO season_teams (
    season_id,
    team_id,
    registration_date,
    status,
    created_at
  )
  SELECT
    v_new_season_id,
    team_id,
    registration_date,
    status,
    NOW()
  FROM season_teams
  WHERE season_id = v_source_season_id
  AND status IN ('registered', 'confirmed');

  RAISE NOTICE '✅ Copied % teams to new season', (
    SELECT COUNT(*) FROM season_teams WHERE season_id = v_new_season_id
  );

  -- ============================================================================
  -- STEP 4: Copy fixtures from source season
  -- ============================================================================
  RAISE NOTICE '🔄 Copying fixtures from source season...';

  -- Copy all matches from the source season
  INSERT INTO matches (
    season_id,
    league_id,
    home_team_id,
    away_team_id,
    match_date,
    venue,
    status,
    home_score,
    away_score,
    created_at,
    updated_at
  )
  SELECT
    v_new_season_id,
    league_id,
    home_team_id,
    away_team_id,
    match_date,
    venue,
    'scheduled', -- Start as scheduled, will be simulated next
    0, -- home_score (will be set during simulation)
    0, -- away_score (will be set during simulation)
    NOW(),
    NOW()
  FROM matches
  WHERE season_id = v_source_season_id;

  RAISE NOTICE '✅ Copied % fixtures from source season', (
    SELECT COUNT(*) FROM matches WHERE season_id = v_new_season_id
  );

  -- ============================================================================
  -- STEP 5: Simulate all matches
  -- ============================================================================
  RAISE NOTICE '🎮 Simulating all matches with scores and player stats...';

  FOR v_match IN
    SELECT
      m.id,
      m.home_team_id,
      m.away_team_id,
      m.match_date
    FROM matches m
    WHERE m.season_id = v_new_season_id
    ORDER BY m.match_date
  LOOP

    -- Generate realistic scores (weighted toward lower scores)
    v_home_score := CASE
      WHEN random() < 0.25 THEN 0
      WHEN random() < 0.60 THEN 1
      WHEN random() < 0.85 THEN 2
      WHEN random() < 0.95 THEN 3
      ELSE floor(random() * 2 + 4)::INT
    END;

    v_away_score := CASE
      WHEN random() < 0.25 THEN 0
      WHEN random() < 0.60 THEN 1
      WHEN random() < 0.85 THEN 2
      WHEN random() < 0.95 THEN 3
      ELSE floor(random() * 2 + 4)::INT
    END;

    -- Update match with scores
    UPDATE matches
    SET
      home_score = v_home_score,
      away_score = v_away_score,
      status = 'completed',
      updated_at = NOW()
    WHERE id = v_match.id;

    -- Get players for both teams
    SELECT array_agg(user_id) INTO v_home_players
    FROM team_members
    WHERE team_id = v_match.home_team_id
    AND is_active = true;

    SELECT array_agg(user_id) INTO v_away_players
    FROM team_members
    WHERE team_id = v_match.away_team_id
    AND is_active = true;

    -- Create base stats for all players
    -- Home team players
    IF v_home_players IS NOT NULL THEN
      INSERT INTO player_stats (
        user_id,
        match_id,
        team_id,
        goals,
        assists,
        minutes_played
      )
      SELECT
        unnest(v_home_players),
        v_match.id,
        v_match.home_team_id,
        0,
        0,
        90;
    END IF;

    -- Away team players
    IF v_away_players IS NOT NULL THEN
      INSERT INTO player_stats (
        user_id,
        match_id,
        team_id,
        goals,
        assists,
        minutes_played
      )
      SELECT
        unnest(v_away_players),
        v_match.id,
        v_match.away_team_id,
        0,
        0,
        90;
    END IF;

    -- Distribute home team goals
    v_goals_to_distribute := v_home_score;
    WHILE v_goals_to_distribute > 0 LOOP
      v_scorer_id := v_home_players[1 + floor(random() * array_length(v_home_players, 1))::INT];

      UPDATE player_stats
      SET goals = goals + 1
      WHERE user_id = v_scorer_id
      AND match_id = v_match.id;

      -- 40% chance of assist
      IF random() < 0.40 AND array_length(v_home_players, 1) > 1 THEN
        v_assister_id := v_home_players[1 + floor(random() * array_length(v_home_players, 1))::INT];
        WHILE v_assister_id = v_scorer_id AND array_length(v_home_players, 1) > 1 LOOP
          v_assister_id := v_home_players[1 + floor(random() * array_length(v_home_players, 1))::INT];
        END LOOP;

        UPDATE player_stats
        SET assists = assists + 1
        WHERE user_id = v_assister_id
        AND match_id = v_match.id;
      END IF;

      v_goals_to_distribute := v_goals_to_distribute - 1;
    END LOOP;

    -- Distribute away team goals
    v_goals_to_distribute := v_away_score;
    WHILE v_goals_to_distribute > 0 LOOP
      v_scorer_id := v_away_players[1 + floor(random() * array_length(v_away_players, 1))::INT];

      UPDATE player_stats
      SET goals = goals + 1
      WHERE user_id = v_scorer_id
      AND match_id = v_match.id;

      IF random() < 0.40 AND array_length(v_away_players, 1) > 1 THEN
        v_assister_id := v_away_players[1 + floor(random() * array_length(v_away_players, 1))::INT];
        WHILE v_assister_id = v_scorer_id AND array_length(v_away_players, 1) > 1 LOOP
          v_assister_id := v_away_players[1 + floor(random() * array_length(v_away_players, 1))::INT];
        END LOOP;

        UPDATE player_stats
        SET assists = assists + 1
        WHERE user_id = v_assister_id
        AND match_id = v_match.id;
      END IF;

      v_goals_to_distribute := v_goals_to_distribute - 1;
    END LOOP;

  END LOOP;

  RAISE NOTICE '✅ Simulated % matches with player stats', (
    SELECT COUNT(*) FROM matches WHERE season_id = v_new_season_id
  );

  -- ============================================================================
  -- COMPLETE!
  -- ============================================================================
  RAISE NOTICE '🎉 ============================================';
  RAISE NOTICE '🎉 SIMULATION COMPLETE!';
  RAISE NOTICE '🎉 ============================================';
  RAISE NOTICE '📊 New Season ID: %', v_new_season_id;
  RAISE NOTICE '📊 New Season Name: %', 'Simulated - ' || v_source_season.name;
  RAISE NOTICE '📊 Teams: %', (SELECT COUNT(*) FROM season_teams WHERE season_id = v_new_season_id);
  RAISE NOTICE '📊 Matches: %', (SELECT COUNT(*) FROM matches WHERE season_id = v_new_season_id);
  RAISE NOTICE '📊 Player Stats: %', (SELECT COUNT(*) FROM player_stats ps JOIN matches m ON ps.match_id = m.id WHERE m.season_id = v_new_season_id);
  RAISE NOTICE '';
  RAISE NOTICE '🔗 View in app: http://localhost:3000/leagues/%/seasons/%/dashboard', v_source_season.league_id, v_new_season_id;
  RAISE NOTICE '';

END $$;

-- ============================================================================
-- VIEW RESULTS
-- ============================================================================
-- Uncomment these to view the simulated data:

/*
-- Get the new season ID
SELECT id, name, status, registered_teams_count
FROM seasons
WHERE name LIKE 'Simulated -%'
ORDER BY created_at DESC
LIMIT 1;

-- View match results
SELECT
  m.match_date::date as date,
  ht.name as home_team,
  m.home_score,
  m.away_score,
  at.name as away_team,
  m.status
FROM matches m
JOIN teams ht ON m.home_team_id = ht.id
JOIN teams at ON m.away_team_id = at.id
WHERE m.season_id = (SELECT id FROM seasons WHERE name LIKE 'Simulated -%' ORDER BY created_at DESC LIMIT 1)
ORDER BY m.match_date;

-- View player stats leaderboard
SELECT
  up.display_name as player,
  t.name as team,
  COUNT(*) as matches,
  SUM(ps.goals) as goals,
  SUM(ps.assists) as assists,
  SUM(ps.yellow_cards) as yellows,
  SUM(ps.red_cards) as reds
FROM player_stats ps
JOIN user_profiles up ON ps.user_id = up.id
JOIN teams t ON ps.team_id = t.id
JOIN matches m ON ps.match_id = m.id
WHERE m.season_id = (SELECT id FROM seasons WHERE name LIKE 'Simulated -%' ORDER BY created_at DESC LIMIT 1)
GROUP BY up.display_name, t.name
ORDER BY goals DESC, assists DESC
LIMIT 20;

-- View standings (calculated)
WITH team_stats AS (
  SELECT
    m.season_id,
    t.id as team_id,
    t.name as team_name,
    COUNT(*) as played,
    SUM(CASE
      WHEN (m.home_team_id = t.id AND m.home_score > m.away_score) OR
           (m.away_team_id = t.id AND m.away_score > m.home_score)
      THEN 1 ELSE 0
    END) as wins,
    SUM(CASE
      WHEN m.home_score = m.away_score
      THEN 1 ELSE 0
    END) as draws,
    SUM(CASE
      WHEN (m.home_team_id = t.id AND m.home_score < m.away_score) OR
           (m.away_team_id = t.id AND m.away_score < m.home_score)
      THEN 1 ELSE 0
    END) as losses,
    SUM(CASE
      WHEN m.home_team_id = t.id THEN m.home_score
      ELSE m.away_score
    END) as goals_for,
    SUM(CASE
      WHEN m.home_team_id = t.id THEN m.away_score
      ELSE m.home_score
    END) as goals_against
  FROM teams t
  JOIN matches m ON (m.home_team_id = t.id OR m.away_team_id = t.id)
  WHERE m.status = 'completed'
  AND m.season_id = (SELECT id FROM seasons WHERE name LIKE 'Simulated -%' ORDER BY created_at DESC LIMIT 1)
  GROUP BY m.season_id, t.id, t.name
)
SELECT
  ROW_NUMBER() OVER (ORDER BY (wins * 3 + draws) DESC, (goals_for - goals_against) DESC) as position,
  team_name,
  played,
  wins,
  draws,
  losses,
  goals_for,
  goals_against,
  goals_for - goals_against as goal_diff,
  wins * 3 + draws as points
FROM team_stats
ORDER BY points DESC, goal_diff DESC;
*/

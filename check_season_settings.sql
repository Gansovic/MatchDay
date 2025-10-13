-- Check season settings for fixture generation
SELECT
    id,
    name,
    start_date,
    end_date,
    match_day,
    match_start_time,
    match_end_time,
    courts_available,
    games_per_court,
    rest_weeks_between_matches,
    rounds,
    home_away_balance,
    (SELECT COUNT(*) FROM season_teams WHERE season_id = '730c95ae-3df5-454b-bdca-4a98fe86b711' AND status IN ('registered', 'confirmed')) as team_count
FROM seasons
WHERE id = '730c95ae-3df5-454b-bdca-4a98fe86b711';

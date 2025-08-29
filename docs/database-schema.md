# MatchDay Database Schema

## Core Tables

### Users & Authentication
```sql
-- Users table (managed by Supabase Auth)
-- Extended with custom profile data

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  preferred_position TEXT,
  bio TEXT,
  date_of_birth DATE,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
```

### Leagues & Organizations
```sql
CREATE TABLE leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  sport_type TEXT NOT NULL, -- 'soccer', 'basketball', 'volleyball', etc.
  league_type TEXT NOT NULL, -- 'recreational', 'competitive', 'semi-pro'
  location TEXT,
  season_start DATE,
  season_end DATE,
  max_teams INTEGER,
  entry_fee DECIMAL(10,2),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view leagues" ON leagues FOR SELECT USING (true);
CREATE POLICY "League creators can manage their leagues" ON leagues FOR ALL USING (auth.uid() = created_by);
```

### Teams & Players
```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  logo_url TEXT,
  team_color TEXT,
  captain_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(league_id, name)
);

CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  position TEXT,
  jersey_number INTEGER,
  is_active BOOLEAN DEFAULT true,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(team_id, user_id),
  UNIQUE(team_id, jersey_number)
);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Team captains can manage their teams" ON teams FOR ALL USING (auth.uid() = captain_id);
CREATE POLICY "Anyone can view team members" ON team_members FOR SELECT USING (true);
CREATE POLICY "Team captains can manage members" ON team_members FOR ALL USING (
  auth.uid() IN (SELECT captain_id FROM teams WHERE id = team_id)
);
```

### Matches & Scheduling
```sql
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  home_team_id UUID REFERENCES teams(id),
  away_team_id UUID REFERENCES teams(id),
  scheduled_date TIMESTAMPTZ NOT NULL,
  venue TEXT,
  match_day INTEGER, -- Week/round number
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled'
  home_score INTEGER DEFAULT 0,
  away_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CHECK (home_team_id != away_team_id)
);

CREATE TABLE match_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id),
  player_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL, -- 'goal', 'assist', 'yellow_card', 'red_card', 'substitution'
  event_time INTEGER, -- Minutes into the match
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view matches" ON matches FOR SELECT USING (true);
CREATE POLICY "League creators can manage matches" ON matches FOR ALL USING (
  auth.uid() IN (SELECT created_by FROM leagues WHERE id = league_id)
);
```

### Statistics & Performance
```sql
CREATE TABLE player_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  games_played INTEGER DEFAULT 0,
  goals INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  yellow_cards INTEGER DEFAULT 0,
  red_cards INTEGER DEFAULT 0,
  minutes_played INTEGER DEFAULT 0,
  -- Sport-specific stats can be added as JSON
  additional_stats JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(player_id, league_id, team_id)
);

CREATE TABLE team_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  games_played INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  goals_for INTEGER DEFAULT 0,
  goals_against INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0, -- League points (3 for win, 1 for draw)
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(team_id, league_id)
);

ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view player stats" ON player_stats FOR SELECT USING (true);
CREATE POLICY "Anyone can view team stats" ON team_stats FOR SELECT USING (true);
```

### Achievements & Gamification
```sql
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT, -- Icon identifier
  category TEXT, -- 'scoring', 'teamwork', 'participation', 'milestone'
  requirements JSONB, -- Conditions for earning the achievement
  points_value INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  context JSONB, -- Additional context about how it was earned
  
  UNIQUE(user_id, achievement_id)
);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view achievements" ON achievements FOR SELECT USING (true);
CREATE POLICY "Anyone can view user achievements" ON user_achievements FOR SELECT USING (true);
```

### Configuration & Settings
```sql
CREATE TABLE app_configurations (
  id TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default configurations
INSERT INTO app_configurations (id, value, description) VALUES 
('scoring_rules', '{"win": 3, "draw": 1, "loss": 0}', 'Points awarded for match results'),
('achievement_rules', '{"first_goal": {"points": 10}, "hat_trick": {"points": 50}}', 'Achievement point values'),
('league_settings', '{"max_teams_per_league": 16, "matches_per_season": 30}', 'League operational settings');

ALTER TABLE app_configurations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view configurations" ON app_configurations FOR SELECT USING (true);
```

## Indexes for Performance

```sql
-- Match queries
CREATE INDEX idx_matches_league_date ON matches(league_id, scheduled_date);
CREATE INDEX idx_matches_teams ON matches(home_team_id, away_team_id);

-- Stats queries  
CREATE INDEX idx_player_stats_league ON player_stats(league_id, goals DESC, assists DESC);
CREATE INDEX idx_team_stats_league ON team_stats(league_id, points DESC, goals_for DESC);

-- User lookups
CREATE INDEX idx_team_members_user ON team_members(user_id, is_active);
CREATE INDEX idx_user_achievements_user ON user_achievements(user_id, earned_at DESC);
```

## Views for Common Queries

```sql
-- League standings
CREATE VIEW league_standings AS
SELECT 
  ts.*,
  t.name as team_name,
  t.logo_url,
  l.name as league_name,
  ROW_NUMBER() OVER (PARTITION BY ts.league_id ORDER BY ts.points DESC, (ts.goals_for - ts.goals_against) DESC) as position
FROM team_stats ts
JOIN teams t ON ts.team_id = t.id
JOIN leagues l ON ts.league_id = l.id;

-- Player leaderboards
CREATE VIEW player_leaderboard AS
SELECT 
  ps.*,
  up.display_name,
  up.avatar_url,
  t.name as team_name,
  l.name as league_name,
  CASE 
    WHEN ps.games_played > 0 THEN ROUND(ps.goals::DECIMAL / ps.games_played, 2)
    ELSE 0
  END as goals_per_game
FROM player_stats ps
JOIN user_profiles up ON ps.player_id = up.id
JOIN teams t ON ps.team_id = t.id
JOIN leagues l ON ps.league_id = l.id;
```
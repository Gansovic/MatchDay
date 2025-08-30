#!/bin/bash

# MatchDay Database Check Script
# Easy way to check the current state of your database

echo "🗄️  MatchDay Database Status Check"
echo "=================================="

# Database connection details
DB_HOST="localhost"
DB_PORT="5433"
DB_USER="matchday_user"
DB_NAME="matchday"
export PGPASSWORD="matchday_pass"

echo "📊 Teams Table:"
echo "---------------"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT 
  id,
  name,
  league_id,
  captain_id,
  max_players,
  team_color,
  created_at 
FROM teams 
ORDER BY created_at DESC;
"

echo ""
echo "👥 Team Members:"
echo "----------------"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT 
  tm.team_id,
  t.name as team_name,
  tm.user_id,
  tm.position,
  tm.jersey_number,
  tm.is_active
FROM team_members tm
JOIN teams t ON tm.team_id = t.id
ORDER BY t.name, tm.jersey_number;
"

echo ""
echo "🏆 Leagues:"
echo "----------"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT 
  id,
  name,
  description,
  is_active,
  is_public
FROM leagues 
ORDER BY name;
"

echo ""
echo "📈 Summary:"
echo "----------"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT 
  'Teams' as table_name,
  COUNT(*) as count
FROM teams
UNION ALL
SELECT 
  'Team Members' as table_name,
  COUNT(*) as count
FROM team_members
UNION ALL
SELECT 
  'Leagues' as table_name,
  COUNT(*) as count
FROM leagues;
"
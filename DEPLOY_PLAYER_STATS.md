# 🚨 URGENT: Deploy Player Stats to Production

The dashboard shows 0 matches because the `player_stats` table doesn't exist in production!

## Quick Deploy Steps:

### Option 1: Via Supabase Dashboard (Easiest)

1. **Open SQL Editor**: 
   https://supabase.com/dashboard/project/twkipeacdamypppxmmhe/sql/new

2. **Copy and paste** the contents of:
   `/Users/lukini/MatchDay/supabase/migrations/20250110_create_player_stats_production.sql`

3. **Click "Run"** to execute the migration

4. **Verify** by running this query:
   ```sql
   SELECT * FROM player_stats LIMIT 1;
   SELECT * FROM user_dashboard_stats WHERE email = 'player@matchday.com';
   ```

### Option 2: Via Supabase CLI

```bash
# In your terminal, from the MatchDay directory:
cd /Users/lukini/MatchDay

# Link to your project (you'll need the database password)
supabase link --project-ref twkipeacdamypppxmmhe

# Push the migration
supabase db push
```

### Option 3: Direct Database Connection

If you have the database password, you can use:
```bash
PGPASSWORD='your-password' psql \
  -h aws-0-us-east-1.pooler.supabase.com \
  -p 5432 \
  -U postgres.twkipeacdamypppxmmhe \
  -d postgres \
  -f /Users/lukini/MatchDay/supabase/migrations/20250110_create_player_stats_production.sql
```

## What This Creates:

- ✅ `player_stats` table - Stores individual match performance
- ✅ `user_dashboard_stats` view - Aggregates stats across ALL teams
- ✅ `player_team_stats` view - Team-specific player stats
- ✅ Proper RLS policies and indexes

## After Deployment:

1. **Add sample data** (optional):
   Run `/Users/lukini/MatchDay/supabase/migrations/20250110_sample_player_stats_data.sql`

2. **Refresh your dashboard**:
   The stats should now show correctly aggregated across both teams!

## Current Issue:

```
ERROR: Could not find the table 'public.player_stats' in the schema cache
ERROR: Could not find the table 'public.user_dashboard_stats' in the schema cache
```

These tables MUST be created in production for the dashboard to work!
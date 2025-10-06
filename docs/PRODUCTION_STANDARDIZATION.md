# Production Database Standardization Guide

## Overview

This guide helps standardize both the MatchDay player app and admin app to always use the **production Supabase database** instead of switching between local and production environments.

## Current Status

✅ **Completed Steps:**
- Both apps' `.env.local` files updated to use production Supabase
- Local Supabase instance stopped
- Environment configuration standardized

⚠️ **Remaining Steps:**
- Production database needs admin role enum values
- Need to create admin user in production
- Test admin authentication

## Production Configuration

Both apps now use these standardized environment variables:

```bash
# Production Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://twkipeacdamypppxmmhe.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3a2lwZWFjZGFteXBwcHhtbWhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzMDM1OTIsImV4cCI6MjA3MDg3OTU5Mn0.O8W36cCRgI07ZVsArbi-deRRDBJxpt0d7HioR3M9kx4
```

## Manual Steps Required

Since we cannot programmatically modify the production database, you need to complete these steps manually:

### 1. Update Database Schema

Go to [Supabase Dashboard > SQL Editor](https://supabase.com/dashboard/project/twkipeacdamypppxmmhe/sql) and run:

```sql
-- Add admin enum values to existing user_role type
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'app_admin';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'league_admin';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin';

-- Verify the enum values were added
SELECT enumlabel FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
ORDER BY enumlabel;
```

### 2. Create Admin Tables

Run the admin migration in the SQL Editor:

```sql
-- Create admin audit logs table
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create system notifications table
CREATE TABLE IF NOT EXISTS system_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'error', 'success')),
    priority INTEGER DEFAULT 1 CHECK (priority BETWEEN 1 AND 5),
    target_roles user_role[] DEFAULT ARRAY['app_admin'],
    is_read BOOLEAN DEFAULT false,
    expires_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ,
    read_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_notifications ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON TABLE admin_audit_logs TO authenticated;
GRANT ALL ON TABLE system_notifications TO authenticated;
```

### 3. Create Admin User

#### Option A: Through Authentication UI
1. Go to [Supabase Dashboard > Authentication > Users](https://supabase.com/dashboard/project/twkipeacdamypppxmmhe/auth/users)
2. Click "Add user"
3. Create user with:
   - Email: `admin@matchday.com`
   - Password: `MatchDayAdmin2024!`
   - Confirm email: Yes

#### Option B: Through SQL (if you have direct database access)
```sql
-- This would need to be run if you have service role access
INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at)
VALUES (gen_random_uuid(), 'admin@matchday.com', NOW(), NOW(), NOW());
```

### 4. Update User Profile

After creating the auth user, get the user ID and create/update the profile:

```sql
-- Create user profile (replace USER_ID with actual UUID from auth.users)
INSERT INTO users (id, email, display_name, full_name, role, bio)
VALUES (
    'USER_ID_FROM_AUTH_USERS',
    'admin@matchday.com',
    'MatchDay Admin',
    'MatchDay Administrator',
    'app_admin',
    'System Administrator for MatchDay'
);
```

## Testing the Setup

### 1. Test Player App
```bash
cd /Users/lukini/MatchDay
npm run dev
```
- Visit http://localhost:3000
- Verify it connects to production database
- Test user authentication

### 2. Test Admin App
```bash
cd /Users/lukini/matchday-admin
PORT=3001 npm run dev
```
- Visit http://localhost:3001
- Try logging in with admin credentials
- Verify admin functionality works

## Development Workflow

### Starting Development
```bash
# Terminal 1: Start player app
cd /Users/lukini/MatchDay
npm run dev

# Terminal 2: Start admin app
cd /Users/lukini/matchday-admin
PORT=3001 npm run dev
```

### Key URLs
- Player App: http://localhost:3000
- Admin App: http://localhost:3001
- Supabase Dashboard: https://supabase.com/dashboard/project/twkipeacdamypppxmmhe

## Benefits of This Approach

✅ **Consistency**: Both apps always use the same database
✅ **Real Data**: Development uses actual production data
✅ **No Sync Issues**: No need to sync between local and production
✅ **Simplified Setup**: No local Supabase instance required
✅ **Team Collaboration**: All developers use the same data

## Important Notes

⚠️ **Data Safety**: Be careful when testing since you're working with production data
🔐 **Backups**: Ensure regular database backups are in place
🚫 **No Local Supabase**: Don't start local Supabase (`supabase start`) anymore
📝 **Environment**: Always use the standardized `.env.local` files

## Troubleshooting

### If apps don't start:
- Check `.env.local` files have correct Supabase URLs
- Ensure no local Supabase is running (`supabase stop`)
- Clear browser cache and restart development servers

### If authentication fails:
- Verify admin user exists in Supabase Dashboard
- Check user has correct role in `users` table
- Ensure enum values were added successfully

### If database connection fails:
- Check Supabase project is active
- Verify API keys are correct
- Test connection in Supabase Dashboard first
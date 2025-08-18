# MatchDay Test User Scripts

This directory contains scripts for managing test users in the development environment.

## Available Scripts

### create-test-player.js
Creates or updates a test player user in the local Supabase instance.

**Usage:**
```bash
node scripts/create-test-player.js
```

**Created User:**
- Email: `player@matchday.com`
- Password: `player123!`
- Role: `player`
- Display Name: Test Player
- Position: Forward

### test-player-login.js
Verifies that the player login works correctly by attempting to authenticate and fetch the user profile.

**Usage:**
```bash
node scripts/test-player-login.js
```

### assign-leagues-to-admin.js
Assigns all existing leagues in the database to the admin user for management through the admin portal.

**Usage:**
```bash
node scripts/assign-leagues-to-admin.js
```

**Features:**
- Finds and validates the admin user (admin@matchday.com)
- Ensures admin has the correct role (league_admin)
- Updates all leagues to set admin as owner (created_by field)
- Verifies successful assignment
- Tests admin's access to leagues

### verify-admin-league-access.js
Comprehensive verification of admin user's league management capabilities.

**Usage:**
```bash
node scripts/verify-admin-league-access.js
```

**Features:**
- Authenticates as admin user
- Lists all leagues owned by admin
- Tests read/update operations on leagues
- Checks teams within admin's leagues
- Identifies any unassigned leagues
- Provides detailed access summary

### check-league-ownership.js
Quick status check for league ownership across the system.

**Usage:**
```bash
node scripts/check-league-ownership.js
```

**Features:**
- Lists all leagues grouped by owner
- Shows detailed information for each league
- Identifies unassigned leagues
- Displays team distribution statistics
- Provides ownership summary with admin status

## Test Credentials

### Player Account
- **Email:** `player@matchday.com`
- **Password:** `player123!`
- **Role:** Player
- **Purpose:** Testing player-specific features and dashboards

### Admin Account
- **Email:** `admin@matchday.com`
- **Password:** `admin123!`
- **Role:** Admin
- **Purpose:** Testing admin portal and management features

## Database Setup

The scripts interact with the local Supabase instance running at `http://localhost:54321`.

### SQL Files
- `create_player_auth.sql` - Raw SQL for creating the player user (alternative to JS script)

## Notes

1. These scripts use the Supabase service role key for administrative operations
2. The test users are created with confirmed email addresses for immediate use
3. Passwords are hashed using bcrypt before storage
4. User profiles are automatically created in the `user_profiles` table
5. **League Management:** After creating new leagues, always run `assign-leagues-to-admin.js` to ensure the admin can manage them
6. The admin user must have `league_admin` or `app_admin` role to manage leagues

## Troubleshooting

If login fails with "Invalid login credentials":
1. Run `node scripts/create-test-player.js` to ensure the user exists
2. Run `node scripts/test-player-login.js` to verify authentication works
3. Check that Supabase is running at `http://localhost:54321`
4. Verify the user profile has the correct role in the database
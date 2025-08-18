# Test Users for MatchDay

## How to Create Test Users

1. Open Supabase Studio: http://localhost:54323
2. Go to the SQL Editor tab
3. Copy and paste the contents of `create_test_users.sql`
4. Click "Run" to execute the script

## Test User Credentials

### 1. Regular Player Account
- **Email**: `player@matchday.com`
- **Password**: `PlayerPass123!`
- **Name**: John Player
- **Role**: Team Captain of "Thunder FC"
- **Features**: 
  - Can create and manage teams
  - Can invite players to team
  - Has already requested to join "Champions League 2025"

### 2. League Admin Account  
- **Email**: `admin@matchday.com`
- **Password**: `AdminPass123!`
- **Name**: Sarah Admin
- **Role**: Administrator of "Champions League 2025"
- **Features**:
  - Can approve/reject team join requests
  - Has access to "My Leagues" section
  - Has 1 pending request from Thunder FC to review

## Testing the Complete Workflow

### As Player (John):
1. Login with `player@matchday.com` / `PlayerPass123!`
2. Go to "My Teams" - you'll see Thunder FC
3. You can invite more players to your team
4. Go to "Explore Leagues" to see available leagues
5. Your request to join Champions League 2025 is pending

### As League Admin (Sarah):
1. Login with `admin@matchday.com` / `AdminPass123!`
2. You'll see "My Leagues" in the navigation (crown icon)
3. Click "My Leagues" to see Champions League 2025
4. Click "Manage" to see the pending request from Thunder FC
5. You can approve or reject the team's request
6. Once approved, Thunder FC will be part of your league

## Manual SQL Execution

If the users haven't been created yet:

1. Open http://localhost:54323 (Supabase Studio)
2. Navigate to SQL Editor
3. Paste the SQL from `create_test_users.sql`
4. Click "Run"

The script will:
- Create both user accounts
- Set up their profiles
- Create Thunder FC team (owned by John)
- Create Champions League 2025 (owned by Sarah)
- Create a pending join request from Thunder FC to the league

## Troubleshooting

If you get errors about duplicate users:
- The script already handles cleanup of existing test users
- If needed, you can manually delete users with IDs:
  - Player: `11111111-1111-1111-1111-111111111111`
  - Admin: `22222222-2222-2222-2222-222222222222`

## Login Page

Access the login page at: http://localhost:3001/auth/login

## Features to Test

1. **Team Management**: Login as player, view Thunder FC
2. **Player Invitations**: Send invites from Thunder FC
3. **League Discovery**: Browse available leagues
4. **Join Requests**: Already submitted for Thunder FC
5. **Admin Approval**: Login as admin, approve Thunder FC
6. **Role-Based Navigation**: Admin sees "My Leagues", player doesn't
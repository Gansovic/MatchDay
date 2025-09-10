#!/usr/bin/env python3
import json
import requests
import sys

# Supabase configuration
SUPABASE_URL = 'https://twkipeacdamypppxmmhe.supabase.co'
SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3a2lwZWFjZGFteXBwcHhtbWhlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTMwMzU5MiwiZXhwIjoyMDcwODc5NTkyfQ.ofH3TT43tYwpz5tIYfvrt_XvjW84OBC8cBFu5oCyKFg'

def check_table_exists():
    """Check if player_stats table exists"""
    print("🔍 Checking if player_stats table exists...")
    response = requests.get(
        f'{SUPABASE_URL}/rest/v1/player_stats?limit=1',
        headers={
            'apikey': SERVICE_KEY,
            'Authorization': f'Bearer {SERVICE_KEY}'
        }
    )
    
    if response.status_code == 200:
        print("✅ player_stats table exists!")
        return True
    elif "Could not find" in response.text:
        print("❌ player_stats table does not exist")
        return False
    else:
        print(f"⚠️  Unknown response: {response.status_code} - {response.text}")
        return False

def get_user_id():
    """Get player@matchday.com user ID"""
    print("🔍 Getting user ID for player@matchday.com...")
    response = requests.get(
        f'{SUPABASE_URL}/rest/v1/users?email=eq.player@matchday.com&select=id',
        headers={
            'apikey': SERVICE_KEY,
            'Authorization': f'Bearer {SERVICE_KEY}'
        }
    )
    
    if response.status_code == 200:
        users = response.json()
        if users:
            user_id = users[0]['id']
            print(f"✅ Found user ID: {user_id}")
            return user_id
    
    print(f"❌ Could not get user ID: {response.text}")
    return None

def get_user_teams(user_id):
    """Get user's team IDs"""
    print(f"🔍 Getting teams for user {user_id}...")
    response = requests.get(
        f'{SUPABASE_URL}/rest/v1/team_members?user_id=eq.{user_id}&is_active=eq.true&select=team_id',
        headers={
            'apikey': SERVICE_KEY,
            'Authorization': f'Bearer {SERVICE_KEY}'
        }
    )
    
    if response.status_code == 200:
        teams = response.json()
        team_ids = [team['team_id'] for team in teams]
        print(f"✅ Found {len(team_ids)} teams: {team_ids}")
        return team_ids
    
    print(f"❌ Could not get teams: {response.text}")
    return []

def create_sample_data():
    """Create sample matches and player stats"""
    if check_table_exists():
        print("✅ player_stats table already exists, adding sample data...")
        
        user_id = get_user_id()
        if not user_id:
            return False
            
        team_ids = get_user_teams(user_id)
        if len(team_ids) < 2:
            print("❌ User needs at least 2 teams")
            return False
        
        # Create sample player stats directly
        sample_stats = [
            {
                'user_id': user_id,
                'team_id': team_ids[0], 
                'goals': 2,
                'assists': 1,
                'minutes_played': 90
            },
            {
                'user_id': user_id,
                'team_id': team_ids[0],
                'goals': 1, 
                'assists': 2,
                'minutes_played': 85
            },
            {
                'user_id': user_id,
                'team_id': team_ids[1],
                'goals': 3,
                'assists': 0,
                'minutes_played': 90
            }
        ]
        
        print("📊 Creating sample player stats...")
        response = requests.post(
            f'{SUPABASE_URL}/rest/v1/player_stats',
            headers={
                'apikey': SERVICE_KEY,
                'Authorization': f'Bearer {SERVICE_KEY}',
                'Content-Type': 'application/json'
            },
            json=sample_stats
        )
        
        if response.status_code in [200, 201]:
            print("✅ Sample player stats created!")
            
            # Test the dashboard view
            print("📊 Testing user_dashboard_stats view...")
            dashboard_response = requests.get(
                f'{SUPABASE_URL}/rest/v1/user_dashboard_stats?user_id=eq.{user_id}',
                headers={
                    'apikey': SERVICE_KEY,
                    'Authorization': f'Bearer {SERVICE_KEY}'
                }
            )
            
            if dashboard_response.status_code == 200:
                dashboard_data = dashboard_response.json()
                if dashboard_data:
                    stats = dashboard_data[0]
                    print(f"🎉 SUCCESS! Dashboard shows:")
                    print(f"  - Matches Played: {stats.get('matches_played', 0)}")
                    print(f"  - Goals Scored: {stats.get('goals_scored', 0)}")
                    print(f"  - Assists: {stats.get('assists', 0)}")
                    print(f"  - Teams Joined: {stats.get('teams_joined', 0)}")
                    return True
            else:
                print(f"❌ Dashboard view test failed: {dashboard_response.text}")
        else:
            print(f"❌ Failed to create sample stats: {response.text}")
    else:
        print("❌ Cannot create sample data - player_stats table doesn't exist")
        print("📋 Please run the SQL migration in Supabase Dashboard first")
    
    return False

if __name__ == "__main__":
    success = create_sample_data()
    sys.exit(0 if success else 1)
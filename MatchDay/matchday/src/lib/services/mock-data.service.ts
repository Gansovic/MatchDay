/**
 * Mock Data Service
 * 
 * Provides realistic demo data to showcase the professional player experience
 * without requiring database setup. Makes amateur players feel like pros.
 */

export interface MockPlayerProfile {
  id: string;
  display_name: string;
  avatar_url?: string;
  bio: string;
  location: string;
  preferred_position: string;
  date_of_birth: string;
  created_at: string;
}

export interface MockPlayerStats {
  total_games: number;
  total_goals: number;
  total_assists: number;
  avg_goals_per_game: number;
  performance_rating: number;
  achievement_points: number;
  leagues_played: number;
  global_rank: number;
  league_stats: Array<{
    league_id: string;
    league_name: string;
    games_played: number;
    goals: number;
    assists: number;
    rank_in_league: number;
  }>;
}

export interface MockMatch {
  id: string;
  league_name: string;
  home_team: string;
  away_team: string;
  match_date: string;
  status: 'upcoming' | 'live' | 'completed';
  home_score?: number;
  away_score?: number;
  player_team: 'home' | 'away';
  venue: string;
}

export interface MockLeague {
  id: string;
  name: string;
  description: string;
  sport_type: string;
  league_type: 'recreational' | 'competitive' | 'semi-pro';
  location: string;
  season_start: string;
  season_end: string;
  entry_fee: number;
  current_teams: number;
  max_teams: number;
  available_spots: number;
  compatibility_score: number;
  skill_level_match: boolean;
  schedule_compatibility: boolean;
  distance_km?: number;
}

export class MockDataService {
  private static instance: MockDataService;

  public static getInstance(): MockDataService {
    if (!MockDataService.instance) {
      MockDataService.instance = new MockDataService();
    }
    return MockDataService.instance;
  }

  async getPlayerProfile(userId: string): Promise<MockPlayerProfile> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      id: userId,
      display_name: "Alex Rodriguez",
      bio: "Passionate midfielder who loves creating plays and scoring goals. Always looking to improve and help the team win!",
      location: "San Francisco, CA",
      preferred_position: "Midfielder",
      date_of_birth: "1995-06-15",
      created_at: "2024-01-15T00:00:00Z"
    };
  }

  async getPlayerStats(userId: string): Promise<MockPlayerStats> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    return {
      total_games: 47,
      total_goals: 23,
      total_assists: 15,
      avg_goals_per_game: 0.49,
      performance_rating: 8.7,
      achievement_points: 1247,
      leagues_played: 3,
      global_rank: 1247,
      league_stats: [
        {
          league_id: "sf-premier",
          league_name: "SF Premier Soccer League",
          games_played: 18,
          goals: 12,
          assists: 8,
          rank_in_league: 3
        },
        {
          league_id: "bay-area-comp",
          league_name: "Bay Area Competitive",
          games_played: 16,
          goals: 7,
          assists: 4,
          rank_in_league: 7
        },
        {
          league_id: "weekend-warriors",
          league_name: "Weekend Warriors FC",
          games_played: 13,
          goals: 4,
          assists: 3,
          rank_in_league: 12
        }
      ]
    };
  }

  async getUpcomingMatches(userId: string): Promise<MockMatch[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const today = new Date();
    
    return [
      {
        id: "match-1",
        league_name: "SF Premier Soccer League",
        home_team: "Thunder FC",
        away_team: "Lightning United",
        match_date: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: "upcoming",
        player_team: "home",
        venue: "Golden Gate Park Field 3"
      },
      {
        id: "match-2",
        league_name: "Bay Area Competitive",
        home_team: "Strikers SF",
        away_team: "Thunder FC",
        match_date: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        status: "upcoming",
        player_team: "away",
        venue: "Marina Green Sports Complex"
      },
      {
        id: "match-3",
        league_name: "Weekend Warriors FC",
        home_team: "Thunder FC",
        away_team: "Bay Bombers",
        match_date: new Date(today.getTime() + 9 * 24 * 60 * 60 * 1000).toISOString(),
        status: "upcoming",
        player_team: "home",
        venue: "Presidio Sports Field"
      }
    ];
  }

  async getRecentMatches(userId: string, limit: number = 5): Promise<MockMatch[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const today = new Date();
    
    return [
      {
        id: "match-past-1",
        league_name: "SF Premier Soccer League",
        home_team: "Thunder FC",
        away_team: "City Rovers",
        match_date: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        status: "completed",
        home_score: 3,
        away_score: 1,
        player_team: "home",
        venue: "Golden Gate Park Field 3"
      },
      {
        id: "match-past-2",
        league_name: "Bay Area Competitive",
        home_team: "Eagles FC",
        away_team: "Thunder FC",
        match_date: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: "completed",
        home_score: 1,
        away_score: 2,
        player_team: "away",
        venue: "Marina Green Sports Complex"
      },
      {
        id: "match-past-3",
        league_name: "Weekend Warriors FC",
        home_team: "Thunder FC",
        away_team: "Sharks United",
        match_date: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        status: "completed",
        home_score: 2,
        away_score: 2,
        player_team: "home",
        venue: "Presidio Sports Field"
      }
    ].slice(0, limit);
  }

  async getCompatibleLeagues(userId: string): Promise<MockLeague[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const today = new Date();
    const seasonStart = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const seasonEnd = new Date(today.getTime() + 120 * 24 * 60 * 60 * 1000);
    
    return [
      {
        id: "elite-soccer-sf",
        name: "Elite Soccer SF",
        description: "High-level competitive soccer for serious players. Professional coaching and facilities.",
        sport_type: "soccer",
        league_type: "competitive",
        location: "San Francisco, CA",
        season_start: seasonStart.toISOString(),
        season_end: seasonEnd.toISOString(),
        entry_fee: 250,
        current_teams: 10,
        max_teams: 12,
        available_spots: 24,
        compatibility_score: 94,
        skill_level_match: true,
        schedule_compatibility: true,
        distance_km: 5.2
      },
      {
        id: "bay-area-premier",
        name: "Bay Area Premier League",
        description: "Premier soccer league for ambitious amateur players. Great competition and community.",
        sport_type: "soccer",
        league_type: "competitive",
        location: "Oakland, CA",
        season_start: seasonStart.toISOString(),
        season_end: seasonEnd.toISOString(),
        entry_fee: 200,
        current_teams: 8,
        max_teams: 10,
        available_spots: 16,
        compatibility_score: 87,
        skill_level_match: true,
        schedule_compatibility: true,
        distance_km: 12.8
      },
      {
        id: "golden-gate-soccer",
        name: "Golden Gate Soccer Club",
        description: "Recreational league with competitive spirit. Perfect for players looking to have fun and improve.",
        sport_type: "soccer",
        league_type: "recreational",
        location: "San Francisco, CA",
        season_start: seasonStart.toISOString(),
        season_end: seasonEnd.toISOString(),
        entry_fee: 150,
        current_teams: 12,
        max_teams: 14,
        available_spots: 28,
        compatibility_score: 82,
        skill_level_match: true,
        schedule_compatibility: false,
        distance_km: 3.1
      },
      {
        id: "silicon-valley-fc",
        name: "Silicon Valley FC",
        description: "Tech workers united by soccer. Professional atmosphere with flexible scheduling.",
        sport_type: "soccer",
        league_type: "competitive",
        location: "Palo Alto, CA",
        season_start: seasonStart.toISOString(),
        season_end: seasonEnd.toISOString(),
        entry_fee: 300,
        current_teams: 6,
        max_teams: 8,
        available_spots: 12,
        compatibility_score: 76,
        skill_level_match: false,
        schedule_compatibility: true,
        distance_km: 25.4
      },
      {
        id: "weekend-soccer-sf",
        name: "SF Weekend Soccer League",
        description: "Casual but organized soccer for weekend warriors. Great way to stay active and meet people.",
        sport_type: "soccer",
        league_type: "recreational",
        location: "San Francisco, CA",
        season_start: seasonStart.toISOString(),
        season_end: seasonEnd.toISOString(),
        entry_fee: 100,
        current_teams: 15,
        max_teams: 16,
        available_spots: 8,
        compatibility_score: 71,
        skill_level_match: false,
        schedule_compatibility: true,
        distance_km: 7.9
      }
    ];
  }

  async submitJoinRequest(leagueId: string, userId: string, message: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Simulate success
    console.log(`Join request submitted for league ${leagueId} by user ${userId}`);
    return true;
  }

  async getAchievements(userId: string): Promise<Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    earned: boolean;
    progress?: number;
    max_progress?: number;
  }>> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return [
      {
        id: "first-goal",
        title: "First Goal",
        description: "Score your first goal in the league",
        icon: "⚽",
        earned: true
      },
      {
        id: "hat-trick",
        title: "Hat Trick Hero",
        description: "Score 3 goals in a single match",
        icon: "🎩",
        earned: true
      },
      {
        id: "team-player",
        title: "Team Player",
        description: "Get 10 assists in a season",
        icon: "🤝",
        earned: true
      },
      {
        id: "goal-machine",
        title: "Goal Machine",
        description: "Score 25 goals across all leagues",
        icon: "🚀",
        earned: false,
        progress: 23,
        max_progress: 25
      },
      {
        id: "league-champion",
        title: "League Champion",
        description: "Win a league championship",
        icon: "👑",
        earned: false
      }
    ];
  }

  async getGlobalLeaderboard(category: string, limit: number = 10): Promise<Array<{
    rank: number;
    player_name: string;
    value: number;
    is_current_user?: boolean;
  }>> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const leaders = [
      { rank: 1, player_name: "Marcus Johnson", value: 34 },
      { rank: 2, player_name: "Sarah Chen", value: 31 },
      { rank: 3, player_name: "Diego Martinez", value: 28 },
      { rank: 4, player_name: "Emily Rodriguez", value: 26 },
      { rank: 5, player_name: "James Wilson", value: 25 },
      { rank: 6, player_name: "Alex Rodriguez", value: 23, is_current_user: true },
      { rank: 7, player_name: "Sophia Kim", value: 22 },
      { rank: 8, player_name: "Michael Brown", value: 20 },
      { rank: 9, player_name: "Lisa Thompson", value: 19 },
      { rank: 10, player_name: "David Garcia", value: 18 }
    ];
    
    return leaders.slice(0, limit);
  }
}
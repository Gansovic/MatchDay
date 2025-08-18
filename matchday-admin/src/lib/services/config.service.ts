/**
 * Configuration Service for MatchDay
 * 
 * Manages all application configuration following the LEVER principle of
 * centralized configuration management. Provides hierarchical config loading:
 * 1. Memory cache
 * 2. Local storage
 * 3. Supabase database
 * 4. Default fallbacks
 * 
 * @example
 * ```typescript
 * const config = await ConfigService.getInstance().getScoringRules();
 * const maxTeams = await ConfigService.getInstance().getLeagueSettings();
 * ```
 * 
 * This service should be used for ALL configuration access.
 */
export class ConfigService {
  private static instance: ConfigService;
  private memoryCache = new Map();
  private supabase: any; // Will be injected
  
  private constructor() {}
  
  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }
  
  setSupabaseClient(client: any) {
    this.supabase = client;
  }
  
  async getConfig<T>(key: string): Promise<T> {
    // 1. Check memory cache
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key);
    }
    
    // 2. Check local storage
    if (typeof window !== 'undefined') {
      const local = localStorage.getItem(`matchday_config_${key}`);
      if (local) {
        const parsed = JSON.parse(local);
        this.memoryCache.set(key, parsed);
        return parsed;
      }
    }
    
    // 3. Fetch from Supabase
    if (this.supabase) {
      try {
        const { data } = await this.supabase
          .from('app_configurations')
          .select('value')
          .eq('id', key)
          .single();
        
        if (data) {
          const value = data.value;
          if (typeof window !== 'undefined') {
            localStorage.setItem(`matchday_config_${key}`, JSON.stringify(value));
          }
          this.memoryCache.set(key, value);
          return value;
        }
      } catch (error) {
        console.warn(`Failed to fetch config for ${key}:`, error);
      }
    }
    
    // 4. Fall back to defaults
    return this.getDefault(key);
  }
  
  private getDefault<T>(key: string): T {
    const defaults: Record<string, any> = {
      scoring_rules: { win: 3, draw: 1, loss: 0 },
      achievement_rules: {
        first_goal: { points: 10 },
        hat_trick: { points: 50 },
        clean_sheet: { points: 25 },
        mvp_game: { points: 30 },
        perfect_attendance: { points: 100 }
      },
      league_settings: {
        max_teams_per_league: 16,
        matches_per_season: 30,
        min_players_per_team: 11,
        max_players_per_team: 25
      },
      notification_settings: {
        match_reminders: true,
        score_updates: true,
        achievement_notifications: true
      }
    };
    
    return defaults[key] || null;
  }
  
  // Specific getters for commonly used configs
  async getScoringRules(): Promise<{ win: number; draw: number; loss: number }> {
    return this.getConfig('scoring_rules');
  }
  
  async getAchievementRules(): Promise<Record<string, { points: number }>> {
    return this.getConfig('achievement_rules');
  }
  
  async getLeagueSettings(): Promise<{
    max_teams_per_league: number;
    matches_per_season: number;
    min_players_per_team: number;
    max_players_per_team: number;
  }> {
    return this.getConfig('league_settings');
  }
  
  // Clear cache when config is updated
  invalidateConfig(key?: string) {
    if (key) {
      this.memoryCache.delete(key);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`matchday_config_${key}`);
      }
    } else {
      this.memoryCache.clear();
      if (typeof window !== 'undefined') {
        Object.keys(localStorage)
          .filter(k => k.startsWith('matchday_config_'))
          .forEach(k => localStorage.removeItem(k));
      }
    }
  }
}

// Export singleton instance
export const configService = ConfigService.getInstance();
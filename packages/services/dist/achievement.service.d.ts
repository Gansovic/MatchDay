/**
 * Achievement Service for MatchDay
 *
 * Handles comprehensive achievement and gamification operations with focus on:
 * - Player achievements and progress tracking
 * - Badge system and rarity calculations
 * - Cross-league milestone tracking
 * - Achievement recommendation system
 *
 * Optimized for motivating player engagement through gamification
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { Database, Achievement, UserAchievement, AchievementBadge, PlayerAchievementProgress, ServiceResponse, PaginatedServiceResponse, AchievementCategory, AchievementDifficulty, CacheOptions, RealtimeSubscriptionOptions } from '@matchday/database';
export interface AchievementFilters {
    category?: AchievementCategory;
    difficulty?: AchievementDifficulty;
    isActive?: boolean;
    earned?: boolean;
    inProgress?: boolean;
    search?: string;
}
export interface AchievementStats {
    totalAchievements: number;
    earnedAchievements: number;
    totalPoints: number;
    earnedPoints: number;
    completionPercentage: number;
    categoryProgress: {
        [key in AchievementCategory]: {
            total: number;
            earned: number;
            points: number;
            percentage: number;
        };
    };
    difficultyProgress: {
        [key in AchievementDifficulty]: {
            total: number;
            earned: number;
            points: number;
        };
    };
    recentAchievements: UserAchievement[];
    nextMilestones: PlayerAchievementProgress[];
}
export interface AchievementRecommendation {
    achievement: Achievement;
    priority: number;
    reasonCode: 'close_to_completion' | 'category_focus' | 'difficulty_progression' | 'seasonal_bonus';
    reason: string;
    estimatedEffort: 'low' | 'medium' | 'high';
    estimatedTimeToComplete: string;
    tips: string[];
}
export interface LeaderboardEntry {
    playerId: string;
    playerName: string;
    avatarUrl?: string;
    totalPoints: number;
    totalAchievements: number;
    recentAchievements: number;
    rank: number;
    trend: 'up' | 'down' | 'stable';
}
export declare class AchievementService {
    private static instance;
    private supabase;
    private cache;
    private constructor();
    static getInstance(supabaseClient?: SupabaseClient<Database>): AchievementService;
    /**
     * Handle service errors consistently
     */
    private handleError;
    /**
     * Cache management utilities
     */
    private getCacheKey;
    private getFromCache;
    private setCache;
    /**
     * Get comprehensive achievement statistics for a player
     */
    getPlayerAchievementStats(userId: string, options?: CacheOptions): Promise<ServiceResponse<AchievementStats>>;
    /**
     * Get player's achievement badges with rarity information
     */
    getPlayerAchievementBadges(userId: string, filters?: AchievementFilters, options?: {
        limit?: number;
        offset?: number;
    }): Promise<PaginatedServiceResponse<AchievementBadge>>;
    /**
     * Get achievement progress tracking with detailed metrics
     */
    getAchievementProgress(userId: string, filters?: AchievementFilters, options?: {
        limit?: number;
        offset?: number;
    }): Promise<PaginatedServiceResponse<PlayerAchievementProgress>>;
    /**
     * Get personalized achievement recommendations
     */
    getAchievementRecommendations(userId: string, options?: {
        limit?: number;
        focusCategory?: AchievementCategory;
    }): Promise<ServiceResponse<AchievementRecommendation[]>>;
    /**
     * Get achievement leaderboard
     */
    getAchievementLeaderboard(options?: {
        period?: 'all_time' | 'monthly' | 'weekly';
        category?: AchievementCategory;
        limit?: number;
        offset?: number;
    }): Promise<PaginatedServiceResponse<LeaderboardEntry>>;
    /**
     * Calculate achievement rarity
     */
    calculateAchievementRarity(achievementId: string): Promise<ServiceResponse<{
        totalEarned: number;
        totalPlayers: number;
        rarityPercentage: number;
    }>>;
    /**
     * Private helper methods
     */
    private calculateCategoryProgress;
    private calculateDifficultyProgress;
    private calculateNextMilestones;
    private calculateAchievementProgress;
    private generateRecommendation;
    /**
     * Subscribe to real-time achievement updates
     */
    subscribeToAchievementUpdates(userId: string, callback: (payload: any) => void, options?: RealtimeSubscriptionOptions): import("@supabase/supabase-js").RealtimeChannel;
    /**
     * Clear cache
     */
    clearCache(pattern?: string): void;
}
//# sourceMappingURL=achievement.service.d.ts.map
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
import { AchievementCategory, AchievementDifficulty } from '@matchday/database';
export class AchievementService {
    constructor(supabaseClient) {
        this.cache = new Map();
        this.supabase = supabaseClient;
    }
    static getInstance(supabaseClient) {
        if (!AchievementService.instance) {
            if (!supabaseClient) {
                throw new Error('SupabaseClient required for first initialization');
            }
            AchievementService.instance = new AchievementService(supabaseClient);
        }
        return AchievementService.instance;
    }
    /**
     * Handle service errors consistently
     */
    handleError(error, operation) {
        console.error(`AchievementService.${operation}:`, error);
        return {
            code: error.code || 'UNKNOWN_ERROR',
            message: error.message || 'An unexpected error occurred',
            details: error.details || error,
            timestamp: new Date().toISOString()
        };
    }
    /**
     * Cache management utilities
     */
    getCacheKey(operation, params) {
        return `achievement_service:${operation}:${JSON.stringify(params)}`;
    }
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached)
            return null;
        if (Date.now() - cached.timestamp > cached.ttl * 1000) {
            this.cache.delete(key);
            return null;
        }
        return cached.data;
    }
    setCache(key, data, ttl = 600) {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl
        });
    }
    /**
     * Get comprehensive achievement statistics for a player
     */
    async getPlayerAchievementStats(userId, options = {}) {
        try {
            const cacheKey = this.getCacheKey('getPlayerAchievementStats', { userId });
            const cached = this.getFromCache(cacheKey);
            if (cached && !options.revalidateOnBackground) {
                return { data: cached, error: null, success: true };
            }
            // Get all achievements
            const { data: allAchievements, error: achievementsError } = await this.supabase
                .from('achievements')
                .select('*')
                .eq('is_active', true)
                .order('sort_order');
            if (achievementsError)
                throw achievementsError;
            // Get user's earned achievements
            const { data: userAchievements, error: userError } = await this.supabase
                .from('user_achievements')
                .select(`
          *,
          achievement:achievements!inner(*)
        `)
                .eq('user_id', userId)
                .order('earned_at', { ascending: false });
            if (userError)
                throw userError;
            // Get player stats for progress calculation
            const { data: playerStats } = await this.supabase
                .from('player_cross_league_stats')
                .select('*')
                .eq('player_id', userId)
                .eq('season_year', new Date().getFullYear())
                .single();
            const totalAchievements = allAchievements?.length || 0;
            const earnedAchievements = userAchievements?.length || 0;
            const totalPoints = allAchievements?.reduce((sum, a) => sum + a.points_value, 0) || 0;
            const earnedPoints = userAchievements?.reduce((sum, ua) => sum + ua.achievement.points_value, 0) || 0;
            // Calculate category progress
            const categoryProgress = this.calculateCategoryProgress(allAchievements || [], userAchievements || []);
            // Calculate difficulty progress
            const difficultyProgress = this.calculateDifficultyProgress(allAchievements || [], userAchievements || []);
            // Get recent achievements (last 30 days)
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const recentAchievements = userAchievements?.filter(ua => new Date(ua.earned_at) >= thirtyDaysAgo) || [];
            // Calculate next milestones
            const nextMilestones = this.calculateNextMilestones(allAchievements || [], userAchievements || [], playerStats);
            const stats = {
                totalAchievements,
                earnedAchievements,
                totalPoints,
                earnedPoints,
                completionPercentage: totalAchievements > 0 ? Math.round((earnedAchievements / totalAchievements) * 100) : 0,
                categoryProgress,
                difficultyProgress,
                recentAchievements,
                nextMilestones
            };
            // Cache for 5 minutes
            this.setCache(cacheKey, stats, options.ttl || 300);
            return { data: stats, error: null, success: true };
        }
        catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'getPlayerAchievementStats'),
                success: false
            };
        }
    }
    /**
     * Get player's achievement badges with rarity information
     */
    async getPlayerAchievementBadges(userId, filters = {}, options = {}) {
        try {
            // Build query for user achievements
            let query = this.supabase
                .from('user_achievements')
                .select(`
          *,
          achievement:achievements!inner(*)
        `, { count: 'exact' })
                .eq('user_id', userId);
            if (filters.category) {
                query = query.eq('achievement.category', filters.category);
            }
            if (filters.difficulty) {
                query = query.eq('achievement.difficulty', filters.difficulty);
            }
            if (filters.search) {
                query = query.ilike('achievement.name', `%${filters.search}%`);
            }
            const { data: userAchievements, error, count } = await query
                .order('earned_at', { ascending: false })
                .range(options.offset || 0, (options.offset || 0) + (options.limit || 20) - 1);
            if (error)
                throw error;
            // Calculate rarity for each achievement
            const badges = await Promise.all((userAchievements || []).map(async (ua) => {
                const rarity = await this.calculateAchievementRarity(ua.achievement_id);
                return {
                    id: ua.achievement.id,
                    name: ua.achievement.name,
                    description: ua.achievement.description || '',
                    icon: ua.achievement.icon || '',
                    category: ua.achievement.category,
                    difficulty: ua.achievement.difficulty,
                    earnedAt: ua.earned_at,
                    context: ua.context,
                    rarity: rarity.data || {
                        totalEarned: 0,
                        totalPlayers: 1,
                        rarityPercentage: 100
                    }
                };
            }));
            const pagination = {
                page: Math.floor((options.offset || 0) / (options.limit || 20)) + 1,
                limit: options.limit || 20,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / (options.limit || 20)),
                hasNext: ((options.offset || 0) + (options.limit || 20)) < (count || 0),
                hasPrevious: (options.offset || 0) > 0
            };
            return {
                data: badges,
                error: null,
                success: true,
                pagination
            };
        }
        catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'getPlayerAchievementBadges'),
                success: false,
                pagination: {
                    page: 1,
                    limit: options.limit || 20,
                    total: 0,
                    totalPages: 0,
                    hasNext: false,
                    hasPrevious: false
                }
            };
        }
    }
    /**
     * Get achievement progress tracking with detailed metrics
     */
    async getAchievementProgress(userId, filters = {}, options = {}) {
        try {
            // Get all available achievements
            let query = this.supabase
                .from('achievements')
                .select('*', { count: 'exact' })
                .eq('is_active', true);
            if (filters.category) {
                query = query.eq('category', filters.category);
            }
            if (filters.difficulty) {
                query = query.eq('difficulty', filters.difficulty);
            }
            if (filters.search) {
                query = query.ilike('name', `%${filters.search}%`);
            }
            const { data: achievements, error, count } = await query
                .order('sort_order')
                .range(options.offset || 0, (options.offset || 0) + (options.limit || 50) - 1);
            if (error)
                throw error;
            // Get user's earned achievements
            const { data: userAchievements, error: userError } = await this.supabase
                .from('user_achievements')
                .select('achievement_id, earned_at')
                .eq('user_id', userId);
            if (userError)
                throw userError;
            // Get player stats for progress calculation
            const { data: playerStats } = await this.supabase
                .from('player_cross_league_stats')
                .select('*')
                .eq('player_id', userId)
                .eq('season_year', new Date().getFullYear())
                .single();
            const earnedAchievementIds = new Set(userAchievements?.map(ua => ua.achievement_id) || []);
            // Calculate progress for each achievement
            const achievementProgress = (achievements || [])
                .map(achievement => {
                const isCompleted = earnedAchievementIds.has(achievement.id);
                if (isCompleted) {
                    return {
                        achievement,
                        currentProgress: 1,
                        targetValue: 1,
                        progressPercentage: 100,
                        isCompleted: true
                    };
                }
                // Calculate progress based on requirements
                const progress = this.calculateAchievementProgress(achievement, playerStats);
                return {
                    achievement,
                    currentProgress: progress.current,
                    targetValue: progress.target,
                    progressPercentage: progress.percentage,
                    isCompleted: false,
                    estimatedCompletion: progress.estimatedCompletion,
                    nextMilestone: progress.nextMilestone
                };
            });
            // Apply filters
            let filteredProgress = achievementProgress;
            if (filters.earned === true) {
                filteredProgress = filteredProgress.filter(ap => ap.isCompleted);
            }
            else if (filters.earned === false) {
                filteredProgress = filteredProgress.filter(ap => !ap.isCompleted);
            }
            if (filters.inProgress === true) {
                filteredProgress = filteredProgress.filter(ap => !ap.isCompleted && ap.progressPercentage > 0);
            }
            // Sort by progress percentage (closest to completion first)
            filteredProgress.sort((a, b) => {
                if (a.isCompleted && !b.isCompleted)
                    return 1;
                if (!a.isCompleted && b.isCompleted)
                    return -1;
                return b.progressPercentage - a.progressPercentage;
            });
            const pagination = {
                page: Math.floor((options.offset || 0) / (options.limit || 50)) + 1,
                limit: options.limit || 50,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / (options.limit || 50)),
                hasNext: ((options.offset || 0) + (options.limit || 50)) < (count || 0),
                hasPrevious: (options.offset || 0) > 0
            };
            return {
                data: filteredProgress,
                error: null,
                success: true,
                pagination
            };
        }
        catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'getAchievementProgress'),
                success: false,
                pagination: {
                    page: 1,
                    limit: options.limit || 50,
                    total: 0,
                    totalPages: 0,
                    hasNext: false,
                    hasPrevious: false
                }
            };
        }
    }
    /**
     * Get personalized achievement recommendations
     */
    async getAchievementRecommendations(userId, options = {}) {
        try {
            const cacheKey = this.getCacheKey('getAchievementRecommendations', { userId, options });
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                return { data: cached, error: null, success: true };
            }
            // Get player's achievement progress
            const progressResponse = await this.getAchievementProgress(userId, {
                earned: false
            });
            if (!progressResponse.success || !progressResponse.data) {
                throw new Error('Failed to get achievement progress');
            }
            const progress = progressResponse.data;
            // Get player stats for context
            const { data: playerStats } = await this.supabase
                .from('player_cross_league_stats')
                .select('*')
                .eq('player_id', userId)
                .eq('season_year', new Date().getFullYear())
                .single();
            // Generate recommendations
            const recommendations = progress
                .filter(ap => !ap.isCompleted)
                .map(ap => this.generateRecommendation(ap, playerStats))
                .sort((a, b) => b.priority - a.priority)
                .slice(0, options.limit || 10);
            // Cache for 30 minutes
            this.setCache(cacheKey, recommendations, 1800);
            return { data: recommendations, error: null, success: true };
        }
        catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'getAchievementRecommendations'),
                success: false
            };
        }
    }
    /**
     * Get achievement leaderboard
     */
    async getAchievementLeaderboard(options = {}) {
        try {
            const cacheKey = this.getCacheKey('getAchievementLeaderboard', { options });
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                return {
                    data: cached,
                    error: null,
                    success: true,
                    pagination: {
                        page: Math.floor((options.offset || 0) / (options.limit || 20)) + 1,
                        limit: options.limit || 20,
                        total: cached.length,
                        totalPages: Math.ceil(cached.length / (options.limit || 20)),
                        hasNext: false,
                        hasPrevious: false
                    }
                };
            }
            // Build query based on period
            let dateFilter = '';
            if (options.period === 'monthly') {
                const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                dateFilter = `and earned_at >= '${monthAgo.toISOString()}'`;
            }
            else if (options.period === 'weekly') {
                const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                dateFilter = `and earned_at >= '${weekAgo.toISOString()}'`;
            }
            // Use RPC function for complex leaderboard calculation
            const { data: leaderboard, error } = await this.supabase
                .rpc('get_achievement_leaderboard', {
                date_filter: dateFilter,
                category_filter: options.category || null,
                limit_count: options.limit || 50,
                offset_count: options.offset || 0
            });
            if (error)
                throw error;
            const leaderboardEntries = (leaderboard || []).map((entry, index) => ({
                playerId: entry.player_id,
                playerName: entry.player_name,
                avatarUrl: entry.avatar_url,
                totalPoints: entry.total_points,
                totalAchievements: entry.total_achievements,
                recentAchievements: entry.recent_achievements || 0,
                rank: (options.offset || 0) + index + 1,
                trend: 'stable' // Would need historical data to calculate trend
            }));
            // Cache for 10 minutes
            this.setCache(cacheKey, leaderboardEntries, 600);
            const pagination = {
                page: Math.floor((options.offset || 0) / (options.limit || 20)) + 1,
                limit: options.limit || 20,
                total: leaderboardEntries.length,
                totalPages: Math.ceil(leaderboardEntries.length / (options.limit || 20)),
                hasNext: leaderboardEntries.length === (options.limit || 20),
                hasPrevious: (options.offset || 0) > 0
            };
            return {
                data: leaderboardEntries,
                error: null,
                success: true,
                pagination
            };
        }
        catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'getAchievementLeaderboard'),
                success: false,
                pagination: {
                    page: 1,
                    limit: options.limit || 20,
                    total: 0,
                    totalPages: 0,
                    hasNext: false,
                    hasPrevious: false
                }
            };
        }
    }
    /**
     * Calculate achievement rarity
     */
    async calculateAchievementRarity(achievementId) {
        try {
            const { data, error } = await this.supabase
                .rpc('calculate_achievement_rarity', { achievement_id: achievementId });
            if (error)
                throw error;
            return {
                data: data || { totalEarned: 0, totalPlayers: 1, rarityPercentage: 100 },
                error: null,
                success: true
            };
        }
        catch (error) {
            return {
                data: null,
                error: this.handleError(error, 'calculateAchievementRarity'),
                success: false
            };
        }
    }
    /**
     * Private helper methods
     */
    calculateCategoryProgress(allAchievements, userAchievements) {
        const categories = Object.values(AchievementCategory);
        const result = {};
        categories.forEach(category => {
            const categoryAchievements = allAchievements.filter(a => a.category === category);
            const earnedCategoryAchievements = userAchievements.filter(ua => ua.achievement.category === category);
            result[category] = {
                total: categoryAchievements.length,
                earned: earnedCategoryAchievements.length,
                points: earnedCategoryAchievements.reduce((sum, ua) => sum + ua.achievement.points_value, 0),
                percentage: categoryAchievements.length > 0
                    ? Math.round((earnedCategoryAchievements.length / categoryAchievements.length) * 100)
                    : 0
            };
        });
        return result;
    }
    calculateDifficultyProgress(allAchievements, userAchievements) {
        const difficulties = Object.values(AchievementDifficulty);
        const result = {};
        difficulties.forEach(difficulty => {
            const difficultyAchievements = allAchievements.filter(a => a.difficulty === difficulty);
            const earnedDifficultyAchievements = userAchievements.filter(ua => ua.achievement.difficulty === difficulty);
            result[difficulty] = {
                total: difficultyAchievements.length,
                earned: earnedDifficultyAchievements.length,
                points: earnedDifficultyAchievements.reduce((sum, ua) => sum + ua.achievement.points_value, 0)
            };
        });
        return result;
    }
    calculateNextMilestones(allAchievements, userAchievements, playerStats) {
        const earnedIds = new Set(userAchievements.map(ua => ua.achievement.id));
        return allAchievements
            .filter(a => !earnedIds.has(a.id))
            .map(achievement => {
            const progress = this.calculateAchievementProgress(achievement, playerStats);
            return {
                achievement,
                currentProgress: progress.current,
                targetValue: progress.target,
                progressPercentage: progress.percentage,
                isCompleted: false,
                estimatedCompletion: progress.estimatedCompletion,
                nextMilestone: progress.nextMilestone
            };
        })
            .filter(ap => ap.progressPercentage > 0)
            .sort((a, b) => b.progressPercentage - a.progressPercentage)
            .slice(0, 5);
    }
    calculateAchievementProgress(achievement, playerStats) {
        const requirements = achievement.requirements;
        let current = 0;
        let target = 1;
        if (requirements.goals && playerStats) {
            current = playerStats.total_goals || 0;
            target = requirements.goals;
        }
        else if (requirements.assists && playerStats) {
            current = playerStats.total_assists || 0;
            target = requirements.assists;
        }
        else if (requirements.matches_played && playerStats) {
            current = playerStats.total_games_played || 0;
            target = requirements.matches_played;
        }
        else if (requirements.leagues_played && playerStats) {
            current = playerStats.leagues_played || 0;
            target = requirements.leagues_played;
        }
        const percentage = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
        // Estimate completion time based on current progress
        let estimatedCompletion;
        if (current > 0 && percentage < 100) {
            const remaining = target - current;
            const rate = current / Math.max(playerStats?.total_games_played || 1, 1);
            const estimatedGames = remaining / Math.max(rate, 0.1);
            if (estimatedGames <= 5) {
                estimatedCompletion = 'Within 5 games';
            }
            else if (estimatedGames <= 10) {
                estimatedCompletion = 'Within 10 games';
            }
            else {
                estimatedCompletion = 'Long term goal';
            }
        }
        return {
            current,
            target,
            percentage,
            estimatedCompletion,
            nextMilestone: current > 0 ? Math.ceil(current * 1.2) : Math.ceil(target * 0.2)
        };
    }
    generateRecommendation(progress, playerStats) {
        let priority = 0;
        let reasonCode = 'category_focus';
        let reason = '';
        let estimatedEffort = 'medium';
        let estimatedTimeToComplete = 'Unknown';
        const tips = [];
        // Calculate priority based on progress percentage
        if (progress.progressPercentage >= 80) {
            priority = 90;
            reasonCode = 'close_to_completion';
            reason = 'You\'re very close to earning this achievement!';
            estimatedEffort = 'low';
            estimatedTimeToComplete = 'Very soon';
        }
        else if (progress.progressPercentage >= 50) {
            priority = 70;
            reasonCode = 'close_to_completion';
            reason = 'You\'re halfway there - keep it up!';
            estimatedEffort = 'medium';
            estimatedTimeToComplete = 'Medium term';
        }
        else if (progress.progressPercentage >= 25) {
            priority = 50;
            reasonCode = 'category_focus';
            reason = 'Good progress in this category';
            estimatedEffort = 'medium';
            estimatedTimeToComplete = 'Medium term';
        }
        else {
            priority = 30;
            reasonCode = 'difficulty_progression';
            reason = 'A good challenge to work towards';
            estimatedEffort = 'high';
            estimatedTimeToComplete = 'Long term';
        }
        // Add difficulty bonus
        switch (progress.achievement.difficulty) {
            case 'bronze':
                priority += 10;
                break;
            case 'silver':
                priority += 5;
                break;
            case 'gold':
                priority -= 5;
                break;
            case 'platinum':
                priority -= 10;
                break;
        }
        // Generate tips based on achievement requirements
        const requirements = progress.achievement.requirements;
        if (requirements.goals) {
            tips.push('Focus on creating scoring opportunities');
            tips.push('Practice shooting accuracy in training');
        }
        else if (requirements.assists) {
            tips.push('Look for teammates in better positions');
            tips.push('Improve your passing accuracy');
        }
        else if (requirements.matches_played) {
            tips.push('Stay active in your leagues');
            tips.push('Consistency is key for this achievement');
        }
        return {
            achievement: progress.achievement,
            priority: Math.max(0, Math.min(100, priority)),
            reasonCode,
            reason,
            estimatedEffort,
            estimatedTimeToComplete,
            tips
        };
    }
    /**
     * Subscribe to real-time achievement updates
     */
    subscribeToAchievementUpdates(userId, callback, options = { table: 'user_achievements', event: '*' }) {
        return this.supabase
            .channel(`achievements-${userId}-updates`)
            .on('postgres_changes', {
            event: options.event,
            schema: options.schema || 'public',
            table: options.table,
            filter: options.filter || `user_id=eq.${userId}`
        }, callback)
            .subscribe();
    }
    /**
     * Clear cache
     */
    clearCache(pattern) {
        if (!pattern) {
            this.cache.clear();
            return;
        }
        const keys = Array.from(this.cache.keys());
        keys.forEach(key => {
            if (key.includes(pattern)) {
                this.cache.delete(key);
            }
        });
    }
}
//# sourceMappingURL=achievement.service.js.map
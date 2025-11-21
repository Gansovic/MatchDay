/**
 * User Service for MatchDay
 *
 * Handles user profile operations with Supabase integration.
 * Provides CRUD operations for user profiles and related data.
 */
import { SupabaseClient } from '@supabase/supabase-js';
import type { UserProfile, UpdateUserProfile, ServiceResponse } from '@matchday/database';
export declare class UserService {
    private static instance;
    private supabase;
    private constructor();
    static getInstance(supabaseClient?: SupabaseClient): UserService;
    /**
     * Get user profile by ID
     */
    getUserProfile(userId: string): Promise<ServiceResponse<UserProfile>>;
    /**
     * Update user profile
     */
    updateUserProfile(userId: string, updates: UpdateUserProfile): Promise<ServiceResponse<UserProfile>>;
    /**
     * Create user profile (typically called during signup)
     */
    createUserProfile(userId: string, profileData: {
        display_name: string;
        preferred_position?: string;
        location?: string;
        bio?: string;
        date_of_birth?: string;
        avatar_url?: string;
        avatar_media_id?: string;
    }): Promise<ServiceResponse<UserProfile>>;
    /**
     * Check if user profile exists
     */
    profileExists(userId: string): Promise<ServiceResponse<boolean>>;
    /**
     * Get or create user profile (ensures profile exists)
     */
    getOrCreateUserProfile(userId: string, fallbackData?: {
        display_name: string;
        preferred_position?: string;
        location?: string;
    }): Promise<ServiceResponse<UserProfile>>;
}
//# sourceMappingURL=user.service.d.ts.map
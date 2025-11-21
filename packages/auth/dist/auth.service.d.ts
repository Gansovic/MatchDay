/**
 * Authentication Service for MatchDay
 *
 * Handles user authentication and session management following LEVER principles.
 * Integrates with Supabase Auth and manages user profiles automatically.
 *
 * @example
 * ```typescript
 * const { user, session } = await AuthService.getInstance().signInWithEmail(email, password);
 * await AuthService.getInstance().signOut();
 * ```
 *
 * This service should be used for ALL authentication operations.
 */
import { User, Session, AuthError } from '@supabase/supabase-js';
export interface AuthUser extends User {
    profile?: {
        display_name: string;
        avatar_url?: string;
        preferred_position?: string;
        bio?: string;
        date_of_birth?: string;
        location?: string;
    };
}
export interface AuthSession extends Session {
    user: AuthUser;
}
export interface SignUpData {
    email: string;
    password: string;
    displayName: string;
    preferredPosition?: string;
    location?: string;
}
export interface SignInData {
    email: string;
    password: string;
}
export declare class AuthService {
    private static instance;
    private supabase;
    private currentUser;
    private currentSession;
    private listeners;
    private constructor();
    static getInstance(): AuthService;
    setSupabaseClient(client: any): void;
    private initializeAuthListener;
    private enrichUserWithProfile;
    /**
     * Sign up new user with automatic profile creation
     */
    signUp(data: SignUpData): Promise<{
        user: AuthUser | null;
        session: AuthSession | null;
        error: AuthError | null;
    }>;
    /**
     * Sign in existing user
     */
    signIn(data: SignInData): Promise<{
        user: AuthUser | null;
        session: AuthSession | null;
        error: AuthError | null;
    }>;
    /**
     * Sign in with OAuth providers (Google, etc.)
     */
    signInWithOAuth(provider: 'google' | 'github' | 'discord'): Promise<{
        error: AuthError | null;
    }>;
    /**
     * Sign out current user
     */
    signOut(): Promise<{
        error: AuthError | null;
    }>;
    /**
     * Reset password
     */
    resetPassword(email: string): Promise<{
        error: AuthError | null;
    }>;
    /**
     * Update password
     */
    updatePassword(newPassword: string): Promise<{
        error: AuthError | null;
    }>;
    /**
     * Update user profile
     */
    updateProfile(updates: {
        display_name?: string;
        avatar_url?: string;
        preferred_position?: string;
        bio?: string;
        date_of_birth?: string;
        location?: string;
    }): Promise<{
        error: Error | null;
    }>;
    /**
     * Get current user
     */
    getCurrentUser(): AuthUser | null;
    /**
     * Get current session
     */
    getCurrentSession(): AuthSession | null;
    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean;
    /**
     * Subscribe to auth state changes
     */
    onAuthStateChange(callback: (user: AuthUser | null) => void): () => void;
    /**
     * Require authentication - throws if not authenticated
     */
    requireAuth(): AuthUser;
    /**
     * Check if user has specific permissions
     */
    hasPermission(permission: 'create_league' | 'manage_team' | 'admin'): boolean;
}
//# sourceMappingURL=auth.service.d.ts.map
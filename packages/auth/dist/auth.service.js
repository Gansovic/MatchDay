// @ts-nocheck
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
import { EdgeFunctionsService } from '@matchday/services';
export class AuthService {
    constructor() {
        this.currentUser = null;
        this.currentSession = null;
        this.listeners = [];
    }
    static getInstance() {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }
    setSupabaseClient(client) {
        this.supabase = client;
        this.initializeAuthListener();
    }
    async initializeAuthListener() {
        // Listen for auth state changes
        this.supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                // Fetch user profile
                const userWithProfile = await this.enrichUserWithProfile(session.user);
                this.currentUser = userWithProfile;
                this.currentSession = { ...session, user: userWithProfile };
            }
            else {
                this.currentUser = null;
                this.currentSession = null;
            }
            // Notify listeners
            this.listeners.forEach(listener => listener(this.currentUser));
        });
        // Get initial session
        const { data: { session } } = await this.supabase.auth.getSession();
        if (session?.user) {
            const userWithProfile = await this.enrichUserWithProfile(session.user);
            this.currentUser = userWithProfile;
            this.currentSession = { ...session, user: userWithProfile };
        }
    }
    async enrichUserWithProfile(user) {
        try {
            const { data: profile } = await this.supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single();
            return {
                ...user,
                profile: profile || undefined
            };
        }
        catch (error) {
            console.warn('Failed to fetch user profile:', error);
            return user;
        }
    }
    /**
     * Sign up new user with automatic profile creation
     */
    async signUp(data) {
        try {
            const { data: authData, error: authError } = await this.supabase.auth.signUp({
                email: data.email,
                password: data.password
            });
            if (authError) {
                return { user: null, session: null, error: authError };
            }
            if (authData.user) {
                // Create user profile via Edge Function to ensure proper validation and audit logging
                const profileResult = await EdgeFunctionsService.getInstance().updateUserProfile({
                    display_name: data.displayName,
                    preferred_position: data.preferredPosition,
                    location: data.location
                });
                if (!profileResult.success) {
                    console.warn('Failed to create user profile:', profileResult.error);
                }
                const enrichedUser = await this.enrichUserWithProfile(authData.user);
                const enrichedSession = authData.session ?
                    { ...authData.session, user: enrichedUser } : null;
                return {
                    user: enrichedUser,
                    session: enrichedSession,
                    error: null
                };
            }
            return { user: null, session: null, error: null };
        }
        catch (error) {
            return {
                user: null,
                session: null,
                error: error
            };
        }
    }
    /**
     * Sign in existing user
     */
    async signIn(data) {
        try {
            const { data: authData, error } = await this.supabase.auth.signInWithPassword({
                email: data.email,
                password: data.password
            });
            if (error) {
                return { user: null, session: null, error };
            }
            if (authData.user) {
                const enrichedUser = await this.enrichUserWithProfile(authData.user);
                const enrichedSession = { ...authData.session, user: enrichedUser };
                return {
                    user: enrichedUser,
                    session: enrichedSession,
                    error: null
                };
            }
            return { user: null, session: null, error: null };
        }
        catch (error) {
            return {
                user: null,
                session: null,
                error: error
            };
        }
    }
    /**
     * Sign in with OAuth providers (Google, etc.)
     */
    async signInWithOAuth(provider) {
        try {
            const { error } = await this.supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`
                }
            });
            return { error };
        }
        catch (error) {
            return { error: error };
        }
    }
    /**
     * Sign out current user
     */
    async signOut() {
        try {
            const { error } = await this.supabase.auth.signOut();
            return { error };
        }
        catch (error) {
            return { error: error };
        }
    }
    /**
     * Reset password
     */
    async resetPassword(email) {
        try {
            const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/reset-password`
            });
            return { error };
        }
        catch (error) {
            return { error: error };
        }
    }
    /**
     * Update password
     */
    async updatePassword(newPassword) {
        try {
            const { error } = await this.supabase.auth.updateUser({
                password: newPassword
            });
            return { error };
        }
        catch (error) {
            return { error: error };
        }
    }
    /**
     * Update user profile
     */
    async updateProfile(updates) {
        try {
            const result = await EdgeFunctionsService.getInstance().updateUserProfile(updates);
            if (!result.success) {
                return { error: new Error(result.error) };
            }
            // Refresh current user data
            if (this.currentUser) {
                this.currentUser = await this.enrichUserWithProfile(this.currentUser);
                this.listeners.forEach(listener => listener(this.currentUser));
            }
            return { error: null };
        }
        catch (error) {
            return { error: error };
        }
    }
    /**
     * Get current user
     */
    getCurrentUser() {
        return this.currentUser;
    }
    /**
     * Get current session
     */
    getCurrentSession() {
        return this.currentSession;
    }
    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!this.currentUser;
    }
    /**
     * Subscribe to auth state changes
     */
    onAuthStateChange(callback) {
        this.listeners.push(callback);
        // Return unsubscribe function
        return () => {
            const index = this.listeners.indexOf(callback);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        };
    }
    /**
     * Require authentication - throws if not authenticated
     */
    requireAuth() {
        if (!this.currentUser) {
            throw new Error('Authentication required');
        }
        return this.currentUser;
    }
    /**
     * Check if user has specific permissions
     */
    hasPermission(permission) {
        if (!this.currentUser)
            return false;
        // For now, all authenticated users can create leagues and manage teams
        // In the future, this could be enhanced with role-based permissions
        switch (permission) {
            case 'create_league':
            case 'manage_team':
                return true;
            case 'admin':
                // Check if user has admin role (would be stored in user metadata or separate table)
                return this.currentUser.user_metadata?.role === 'admin';
            default:
                return false;
        }
    }
}
//# sourceMappingURL=auth.service.js.map
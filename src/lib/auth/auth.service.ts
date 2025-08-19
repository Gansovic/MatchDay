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
import { EdgeFunctionsService } from '../services/edge-functions.service';
import { BaseService } from '../services/base.service';
import { ErrorRecoveryService } from '../error/error-recovery.service';
import { errorHandler, ErrorType } from '../error/error-handler';

export interface AuthUser extends User {
  profile?: {
    display_name: string;
    avatar_url?: string;
    preferred_position?: string;
    bio?: string;
    date_of_birth?: string;
    location?: string;
    role?: 'player' | 'league_admin' | 'app_admin';
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

export class AuthService extends BaseService {
  private static instance: AuthService;
  private supabase: any;
  private currentUser: AuthUser | null = null;
  private currentSession: AuthSession | null = null;
  private listeners: Array<(user: AuthUser | null) => void> = [];
  private isOffline: boolean = false;
  private offlineQueue: Array<() => Promise<any>> = [];
  private reconnectionAttempts: number = 0;
  private maxReconnectionAttempts: number = 5;
  
  private constructor() {
    super({
      retryAttempts: 3,
      retryDelay: 1000,
      cacheEnabled: true,
      cacheTTL: 10 * 60 * 1000, // 10 minutes for auth data
      timeout: 15000 // 15 seconds for auth operations
    });

    // Monitor online/offline status
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline.bind(this));
      window.addEventListener('offline', this.handleOffline.bind(this));
    }
  }
  
  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }
  
  setSupabaseClient(client: any) {
    this.supabase = client;
    this.initializeAuthListener();
  }
  
  private async initializeAuthListener() {
    try {
      // Listen for auth state changes with error handling
      this.supabase.auth.onAuthStateChange(async (event: string, session: Session | null) => {
        try {
          console.log('Auth state change:', event, session?.user?.email);
          
          if (session?.user) {
            // Fetch user profile with retry and error handling
            const userWithProfile = await this.executeOperation(
              () => this.enrichUserWithProfile(session.user),
              {
                operationName: 'enrichUserWithProfile',
                userId: session.user.id,
                metadata: { event }
              }
            );
            
            this.currentUser = userWithProfile;
            this.currentSession = { ...session, user: userWithProfile } as AuthSession;
            
            // Cache the session
            this.setCache(`session:${session.user.id}`, this.currentSession);
          } else {
            this.currentUser = null;
            this.currentSession = null;
            this.invalidateCache('session:');
          }
          
          // Notify listeners with error handling
          this.notifyListeners(this.currentUser);
        } catch (error) {
          console.error('Error in auth state change:', error);
          // Don't throw - this would break the auth flow
        }
      });
      
      // Get initial session with error handling
      const { data: { session }, error } = await this.supabase.auth.getSession();
      
      if (error) {
        throw errorHandler.handle(error, {
          type: ErrorType.AUTH,
          metadata: { operation: 'getInitialSession' }
        });
      }
      
      if (session?.user) {
        const userWithProfile = await this.executeOperation(
          () => this.enrichUserWithProfile(session.user),
          {
            operationName: 'getInitialSession',
            userId: session.user.id
          }
        );
        
        this.currentUser = userWithProfile;
        this.currentSession = { ...session, user: userWithProfile } as AuthSession;
        this.setCache(`session:${session.user.id}`, this.currentSession);
      }
    } catch (error) {
      console.error('Failed to initialize auth listener:', error);
      // Try to recover from cached session
      this.attemptCacheRecovery();
    }
  }

  private notifyListeners(user: AuthUser | null) {
    this.listeners.forEach(listener => {
      try {
        listener(user);
      } catch (error) {
        console.error('Error in auth listener:', error);
      }
    });
  }

  private async attemptCacheRecovery() {
    try {
      // Try to find any cached session
      for (const [key, entry] of this.cache.entries()) {
        if (key.startsWith('session:') && entry.data) {
          console.log('Attempting cache recovery for auth session');
          this.currentSession = entry.data;
          this.currentUser = entry.data.user;
          this.notifyListeners(this.currentUser);
          break;
        }
      }
    } catch (error) {
      console.error('Cache recovery failed:', error);
    }
  }

  private handleOnline() {
    console.log('Network back online, processing queued operations');
    this.isOffline = false;
    this.reconnectionAttempts = 0;
    this.processOfflineQueue();
  }

  private handleOffline() {
    console.log('Network offline detected');
    this.isOffline = true;
  }

  private async processOfflineQueue() {
    const queue = [...this.offlineQueue];
    this.offlineQueue = [];

    for (const operation of queue) {
      try {
        await operation();
      } catch (error) {
        console.error('Failed to process queued operation:', error);
        // Re-queue failed operations
        this.offlineQueue.push(operation);
      }
    }
  }
  
  private async enrichUserWithProfile(user: User): Promise<AuthUser> {
    try {
      const { data: profile } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      return {
        ...user,
        profile: profile || undefined
      };
    } catch (error) {
      console.warn('Failed to fetch user profile:', error);
      return user as AuthUser;
    }
  }
  
  /**
   * Sign up new user with automatic profile creation
   */
  async signUp(data: SignUpData): Promise<{
    user: AuthUser | null;
    session: AuthSession | null;
    error: AuthError | null;
  }> {
    if (this.isOffline) {
      return {
        user: null,
        session: null,
        error: { message: 'Cannot create account while offline' } as AuthError
      };
    }

    return this.executeOperation(async () => {
      const { data: authData, error: authError } = await this.supabase.auth.signUp({
        email: data.email,
        password: data.password
      });
      
      if (authError) {
        throw errorHandler.handle(authError, {
          type: ErrorType.AUTH,
          metadata: { operation: 'signUp', email: data.email }
        });
      }
      
      if (authData.user) {
        // Create user profile via Edge Function to ensure proper validation and audit logging
        try {
          const profileResult = await EdgeFunctionsService.getInstance().updateUserProfile({
            display_name: data.displayName,
            preferred_position: data.preferredPosition,
            location: data.location
          });
          
          if (!profileResult.success) {
            console.warn('Failed to create user profile:', profileResult.error);
          }
        } catch (profileError) {
          console.warn('Profile creation failed:', profileError);
          // Don't fail signup for profile creation issues
        }
        
        const enrichedUser = await this.enrichUserWithProfile(authData.user);
        const enrichedSession = authData.session ? 
          { ...authData.session, user: enrichedUser } as AuthSession : null;
        
        return {
          user: enrichedUser,
          session: enrichedSession,
          error: null
        };
      }
      
      return { user: null, session: null, error: null };
    }, {
      operationName: 'signUp',
      metadata: { email: data.email }
    }).catch(error => ({
      user: null,
      session: null,
      error: error as AuthError
    }));
  }
  
  /**
   * Sign in existing user
   */
  async signIn(data: SignInData): Promise<{
    user: AuthUser | null;
    session: AuthSession | null;
    error: AuthError | null;
  }> {
    // Check for offline mode - allow cached sessions
    if (this.isOffline) {
      const cachedSession = this.getFromCache<AuthSession>(`session:${data.email}`);
      if (cachedSession) {
        console.log('Using cached session for offline login');
        return {
          user: cachedSession.user,
          session: cachedSession,
          error: null
        };
      }
      
      return {
        user: null,
        session: null,
        error: { message: 'No cached session available for offline login' } as AuthError
      };
    }

    return this.executeOperation(async () => {
      const { data: authData, error } = await this.supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      });
      
      if (error) {
        throw errorHandler.handle(error, {
          type: ErrorType.AUTH,
          metadata: { operation: 'signIn', email: data.email }
        });
      }
      
      if (authData.user) {
        const enrichedUser = await this.enrichUserWithProfile(authData.user);
        const enrichedSession = { ...authData.session, user: enrichedUser } as AuthSession;
        
        // Cache the session for offline use
        this.setCache(`session:${authData.user.id}`, enrichedSession);
        this.setCache(`session:${data.email}`, enrichedSession); // Also cache by email for offline lookup
        
        return {
          user: enrichedUser,
          session: enrichedSession,
          error: null
        };
      }
      
      return { user: null, session: null, error: null };
    }, {
      operationName: 'signIn',
      metadata: { email: data.email }
    }).catch(error => ({
      user: null,
      session: null,
      error: error as AuthError
    }));
  }
  
  /**
   * Sign in with OAuth providers (Google, etc.)
   */
  async signInWithOAuth(provider: 'google' | 'github' | 'discord'): Promise<{
    error: AuthError | null;
  }> {
    try {
      const { error } = await this.supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  }
  
  /**
   * Sign out current user
   */
  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await this.supabase.auth.signOut();
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  }
  
  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });
      
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  }
  
  /**
   * Update password
   */
  async updatePassword(newPassword: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await this.supabase.auth.updateUser({
        password: newPassword
      });
      
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  }
  
  /**
   * Update user profile
   */
  async updateProfile(updates: {
    display_name?: string;
    avatar_url?: string;
    preferred_position?: string;
    bio?: string;
    date_of_birth?: string;
    location?: string;
  }): Promise<{ error: Error | null }> {
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
    } catch (error) {
      return { error: error as Error };
    }
  }
  
  /**
   * Get current user
   */
  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }
  
  /**
   * Get current session
   */
  getCurrentSession(): AuthSession | null {
    return this.currentSession;
  }
  
  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.currentUser;
  }
  
  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
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
  requireAuth(): AuthUser {
    if (!this.currentUser) {
      throw new Error('Authentication required');
    }
    return this.currentUser;
  }
  
  /**
   * Check if user has specific permissions
   */
  hasPermission(permission: 'create_league' | 'manage_team' | 'admin'): boolean {
    if (!this.currentUser) return false;
    
    const userRole = this.currentUser.profile?.role;
    
    switch (permission) {
      case 'create_league':
        // League admins and app admins can create leagues
        return userRole === 'league_admin' || userRole === 'app_admin';
      case 'manage_team':
        // All authenticated users can manage teams they're part of
        return true;
      case 'admin':
        // Only app admins have full admin permissions
        return userRole === 'app_admin';
      default:
        return false;
    }
  }

  /**
   * Get current user's role
   */
  getUserRole(): 'player' | 'league_admin' | 'app_admin' | null {
    if (!this.currentUser?.profile?.role) return null;
    return this.currentUser.profile.role as 'player' | 'league_admin' | 'app_admin';
  }

  /**
   * Check if user is a league admin
   */
  isLeagueAdmin(): boolean {
    const role = this.getUserRole();
    return role === 'league_admin' || role === 'app_admin';
  }

  /**
   * Check if user is an app admin
   */
  isAppAdmin(): boolean {
    return this.getUserRole() === 'app_admin';
  }

  /**
   * Check if in offline mode
   */
  isOfflineMode(): boolean {
    return this.isOffline;
  }

  /**
   * Queue operation for when network returns
   */
  queueForOnline(operation: () => Promise<any>): void {
    if (this.isOffline) {
      this.offlineQueue.push(operation);
    } else {
      // Execute immediately if online
      operation().catch(error => 
        console.error('Queued operation failed:', error)
      );
    }
  }

  /**
   * Enhanced health check for auth service
   */
  protected async performHealthCheck(): Promise<void> {
    // Check Supabase connection
    if (!this.supabase) {
      throw new Error('Supabase client not initialized');
    }

    // Test basic auth functionality
    try {
      await this.supabase.auth.getUser();
    } catch (error) {
      throw new Error(`Auth service unhealthy: ${error.message}`);
    }

    // Check if we can read user profiles table
    try {
      await this.supabase.from('user_profiles').select('id').limit(1);
    } catch (error) {
      throw new Error(`User profiles table inaccessible: ${error.message}`);
    }
  }

  /**
   * Get auth service status
   */
  getAuthStatus(): {
    isAuthenticated: boolean;
    isOffline: boolean;
    currentUser: { id: string; email: string; role?: string } | null;
    cacheSize: number;
    reconnectionAttempts: number;
    queuedOperations: number;
  } {
    return {
      isAuthenticated: !!this.currentUser,
      isOffline: this.isOffline,
      currentUser: this.currentUser ? {
        id: this.currentUser.id,
        email: this.currentUser.email || 'unknown',
        role: this.currentUser.profile?.role
      } : null,
      cacheSize: this.cache.size,
      reconnectionAttempts: this.reconnectionAttempts,
      queuedOperations: this.offlineQueue.length
    };
  }

  /**
   * Force refresh of current session
   */
  async refreshSession(): Promise<{ success: boolean; error?: string }> {
    if (this.isOffline) {
      return { success: false, error: 'Cannot refresh session while offline' };
    }

    return this.executeOperation(async () => {
      const { data, error } = await this.supabase.auth.refreshSession();
      
      if (error) {
        throw errorHandler.handle(error, {
          type: ErrorType.AUTH,
          metadata: { operation: 'refreshSession' }
        });
      }

      if (data.session?.user) {
        const enrichedUser = await this.enrichUserWithProfile(data.session.user);
        this.currentUser = enrichedUser;
        this.currentSession = { ...data.session, user: enrichedUser } as AuthSession;
        
        // Update cache
        this.setCache(`session:${data.session.user.id}`, this.currentSession);
        
        this.notifyListeners(this.currentUser);
        
        return { success: true };
      }
      
      return { success: false, error: 'No session data returned' };
    }, {
      operationName: 'refreshSession',
      userId: this.currentUser?.id
    }).catch(error => ({
      success: false,
      error: error.message || 'Session refresh failed'
    }));
  }

  /**
   * Clear all cached auth data
   */
  clearAuthCache(): void {
    this.invalidateCache('session:');
    this.offlineQueue.length = 0; // Clear queue
  }
}
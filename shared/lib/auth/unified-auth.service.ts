/**
 * Unified Authentication Service for MatchDay
 * 
 * This is the single source of truth for authentication across all MatchDay applications.
 * Handles user authentication, session management, and role-based access control
 * with development-resilient features and fallback mechanisms.
 * 
 * @example
 * ```typescript
 * const auth = UnifiedAuthService.getInstance();
 * const { user, session } = await auth.signIn({ email, password });
 * const role = auth.getUserRole();
 * ```
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
    role?: 'player' | 'league_admin' | 'app_admin';
    full_name?: string;
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

export interface AuthHealth {
  isHealthy: boolean;
  supabaseConnected: boolean;
  userProfilesAccessible: boolean;
  authTablesAccessible: boolean;
  lastCheckTime: Date;
  errors: string[];
}

export class UnifiedAuthService {
  private static instance: UnifiedAuthService;
  private supabase: any;
  private currentUser: AuthUser | null = null;
  private currentSession: AuthSession | null = null;
  private listeners: Array<(user: AuthUser | null) => void> = [];
  private healthStatus: AuthHealth = {
    isHealthy: false,
    supabaseConnected: false,
    userProfilesAccessible: false,
    authTablesAccessible: false,
    lastCheckTime: new Date(),
    errors: []
  };

  // Development-resilient test users that survive migrations
  private readonly DEVELOPMENT_USERS = {
    admin: {
      email: 'admin@matchday.com',
      id: '22222222-2222-2222-2222-222222222222',
      role: 'app_admin' as const,
      displayName: 'Admin User'
    },
    player: {
      email: 'player@matchday.com', 
      id: '11111111-1111-1111-1111-111111111111',
      role: 'player' as const,
      displayName: 'Player User'
    }
  };
  
  private constructor() {
    // Run health check every 30 seconds
    setInterval(() => this.runHealthCheck(), 30000);
  }
  
  static getInstance(): UnifiedAuthService {
    if (!UnifiedAuthService.instance) {
      UnifiedAuthService.instance = new UnifiedAuthService();
    }
    return UnifiedAuthService.instance;
  }
  
  setSupabaseClient(client: any) {
    this.supabase = client;
    this.initializeAuthListener();
    this.runHealthCheck();
  }
  
  private async initializeAuthListener() {
    try {
      // Listen for auth state changes
      this.supabase.auth.onAuthStateChange(async (event: string, session: Session | null) => {
        console.log('Auth state change:', event, session?.user?.email);
        
        if (session?.user) {
          // Fetch user profile with fallback
          const userWithProfile = await this.enrichUserWithProfile(session.user);
          this.currentUser = userWithProfile;
          this.currentSession = { ...session, user: userWithProfile } as AuthSession;
        } else {
          this.currentUser = null;
          this.currentSession = null;
        }
        
        // Notify listeners
        this.listeners.forEach(listener => {
          try {
            listener(this.currentUser);
          } catch (error) {
            console.warn('Error in auth listener:', error);
          }
        });
      });
      
      // Get initial session
      const { data: { session } } = await this.supabase.auth.getSession();
      if (session?.user) {
        const userWithProfile = await this.enrichUserWithProfile(session.user);
        this.currentUser = userWithProfile;
        this.currentSession = { ...session, user: userWithProfile } as AuthSession;
      }
    } catch (error) {
      console.error('Failed to initialize auth listener:', error);
      this.healthStatus.errors.push('Failed to initialize auth listener');
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
        profile: profile || this.getDefaultProfile(user.id)
      };
    } catch (error) {
      console.warn('Failed to fetch user profile:', error);
      
      // Fallback: check if this is a development user
      const devUser = Object.values(this.DEVELOPMENT_USERS).find(u => u.id === user.id);
      if (devUser) {
        return {
          ...user,
          profile: {
            display_name: devUser.displayName,
            role: devUser.role,
            full_name: devUser.displayName
          }
        };
      }
      
      // Default fallback profile
      return {
        ...user,
        profile: this.getDefaultProfile(user.id)
      };
    }
  }

  private getDefaultProfile(userId: string): AuthUser['profile'] {
    return {
      display_name: 'User',
      role: 'player',
      full_name: 'MatchDay User'
    };
  }
  
  /**
   * Run comprehensive health check on auth system
   */
  async runHealthCheck(): Promise<AuthHealth> {
    const startTime = new Date();
    const errors: string[] = [];
    let supabaseConnected = false;
    let userProfilesAccessible = false;
    let authTablesAccessible = false;

    try {
      // Test Supabase connection
      if (this.supabase) {
        const { data } = await this.supabase.from('user_profiles').select('count').limit(1);
        supabaseConnected = true;
        userProfilesAccessible = true;
      } else {
        errors.push('Supabase client not initialized');
      }

      // Test auth tables access
      try {
        await this.supabase.auth.getUser();
        authTablesAccessible = true;
      } catch (error) {
        errors.push('Auth tables not accessible');
        authTablesAccessible = false;
      }

    } catch (error) {
      errors.push(`Health check failed: ${error.message}`);
    }

    this.healthStatus = {
      isHealthy: errors.length === 0 && supabaseConnected,
      supabaseConnected,
      userProfilesAccessible,
      authTablesAccessible,
      lastCheckTime: startTime,
      errors
    };

    return this.healthStatus;
  }

  /**
   * Get current auth system health status
   */
  getHealthStatus(): AuthHealth {
    return { ...this.healthStatus };
  }
  
  /**
   * Sign up new user with automatic profile creation and error resilience
   */
  async signUp(data: SignUpData): Promise<{
    user: AuthUser | null;
    session: AuthSession | null;
    error: AuthError | null;
  }> {
    try {
      const { data: authData, error: authError } = await this.supabase.auth.signUp({
        email: data.email,
        password: data.password
      });
      
      if (authError) {
        return { user: null, session: null, error: authError };
      }
      
      if (authData.user) {
        // Create user profile with fallback handling
        try {
          // Try to create profile via edge function first
          const { data: profileData, error: profileError } = await this.supabase
            .from('user_profiles')
            .insert({
              id: authData.user.id,
              display_name: data.displayName,
              full_name: data.displayName,
              preferred_position: data.preferredPosition,
              location: data.location,
              role: 'player'
            })
            .select()
            .single();

          if (profileError) {
            console.warn('Failed to create user profile:', profileError);
          }
        } catch (profileError) {
          console.warn('Profile creation failed, user can still login:', profileError);
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
    } catch (error) {
      return {
        user: null,
        session: null,
        error: error as AuthError
      };
    }
  }
  
  /**
   * Sign in existing user with fallback mechanisms
   */
  async signIn(data: SignInData): Promise<{
    user: AuthUser | null;
    session: AuthSession | null;
    error: AuthError | null;
  }> {
    try {
      const { data: authData, error } = await this.retryWithBackoff(() => 
        this.supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password
        })
      );
      
      if (error) {
        // Check if this is a network error
        if (this.isNetworkError(error)) {
          console.warn('Network error during sign in, attempting offline fallback');
          return this.attemptOfflineSignIn(data);
        }
        
        // Check if this is a development user that might need recovery
        await this.ensureDevelopmentUsersExist();
        
        // Retry once after ensuring dev users exist
        const { data: retryAuthData, error: retryError } = await this.retryWithBackoff(() =>
          this.supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password
          })
        );
        
        if (retryError) {
          return { user: null, session: null, error: retryError };
        }
        
        if (retryAuthData.user) {
          const enrichedUser = await this.enrichUserWithProfile(retryAuthData.user);
          const enrichedSession = { ...retryAuthData.session, user: enrichedUser } as AuthSession;
          
          return {
            user: enrichedUser,
            session: enrichedSession,
            error: null
          };
        }
      }
      
      if (authData.user) {
        const enrichedUser = await this.enrichUserWithProfile(authData.user);
        const enrichedSession = { ...authData.session, user: enrichedUser } as AuthSession;
        
        return {
          user: enrichedUser,
          session: enrichedSession,
          error: null
        };
      }
      
      return { user: null, session: null, error: null };
    } catch (error) {
      // Final fallback for network errors
      if (this.isNetworkError(error)) {
        return this.attemptOfflineSignIn(data);
      }
      
      return {
        user: null,
        session: null,
        error: error as AuthError
      };
    }
  }

  /**
   * Ensure development users exist - recovery mechanism
   */
  async ensureDevelopmentUsersExist(): Promise<void> {
    if (!this.supabase) return;
    
    try {
      for (const [key, devUser] of Object.entries(this.DEVELOPMENT_USERS)) {
        // Check if user exists in user_profiles
        const { data: profile } = await this.supabase
          .from('user_profiles')
          .select('id')
          .eq('id', devUser.id)
          .single();

        if (!profile) {
          console.log(`Recovering development user: ${devUser.email}`);
          
          // Try to create the profile (user might exist in auth.users)
          await this.supabase
            .from('user_profiles')
            .upsert({
              id: devUser.id,
              display_name: devUser.displayName,
              full_name: devUser.displayName,
              role: devUser.role
            });
        }
      }
    } catch (error) {
      console.warn('Failed to ensure development users exist:', error);
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
      if (!this.currentUser) {
        return { error: new Error('No authenticated user') };
      }

      const { error } = await this.supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', this.currentUser.id);
      
      if (error) {
        return { error: new Error(error.message) };
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
   * Get development user credentials (for testing purposes only)
   */
  getDevelopmentUsers() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Development users not available in production');
    }
    return this.DEVELOPMENT_USERS;
  }

  /**
   * Check if an error is a network-related error
   */
  private isNetworkError(error: any): boolean {
    if (!error) return false;
    
    const networkErrorMessages = [
      'fetch',
      'network',
      'timeout',
      'connection',
      'ECONNREFUSED',
      'ENOTFOUND',
      'ETIMEDOUT'
    ];
    
    const errorMessage = error.message?.toLowerCase() || '';
    const errorName = error.name?.toLowerCase() || '';
    
    return networkErrorMessages.some(keyword => 
      errorMessage.includes(keyword) || errorName.includes(keyword)
    );
  }

  /**
   * Retry a function with exponential backoff
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          break; // Last attempt failed
        }
        
        // Only retry on network errors
        if (!this.isNetworkError(error)) {
          throw error;
        }
        
        // Calculate delay with exponential backoff and jitter
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        console.log(`Network error detected, retrying in ${Math.round(delay)}ms... (attempt ${attempt + 1}/${maxRetries + 1})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  /**
   * Attempt offline sign in for development users
   */
  private async attemptOfflineSignIn(data: SignInData): Promise<{
    user: AuthUser | null;
    session: AuthSession | null;
    error: AuthError | null;
  }> {
    console.log('🔌 Network unavailable, attempting offline authentication...');
    
    // Check if this is a known development user
    const devUser = Object.values(this.DEVELOPMENT_USERS).find(u => u.email === data.email);
    
    if (!devUser) {
      return {
        user: null,
        session: null,
        error: {
          message: 'Network unavailable and user not found in offline cache',
          name: 'NetworkError'
        } as AuthError
      };
    }

    // For development users, create a mock session
    console.log(`✅ Offline authentication successful for development user: ${devUser.email}`);
    
    const mockUser: AuthUser = {
      id: devUser.id,
      email: devUser.email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      aud: 'authenticated',
      role: 'authenticated',
      email_confirmed_at: new Date().toISOString(),
      last_sign_in_at: new Date().toISOString(),
      app_metadata: {},
      user_metadata: { full_name: devUser.displayName },
      identities: [],
      factors: [],
      profile: {
        display_name: devUser.displayName,
        full_name: devUser.displayName,
        role: devUser.role
      }
    } as AuthUser;

    const mockSession = {
      access_token: 'offline-mock-token',
      refresh_token: 'offline-mock-refresh',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: 'bearer',
      user: mockUser
    } as AuthSession;

    // Update current state
    this.currentUser = mockUser;
    this.currentSession = mockSession;
    
    // Notify listeners
    this.listeners.forEach(listener => {
      try {
        listener(this.currentUser);
      } catch (error) {
        console.warn('Error in auth listener during offline mode:', error);
      }
    });

    // Set up reconnection monitoring
    this.startReconnectionMonitoring();

    return {
      user: mockUser,
      session: mockSession,
      error: null
    };
  }

  /**
   * Monitor network connection and attempt to reconnect
   */
  private startReconnectionMonitoring(): void {
    // Only start one monitor
    if (this.reconnectionInterval) {
      return;
    }

    console.log('📡 Starting network reconnection monitoring...');
    
    this.reconnectionInterval = setInterval(async () => {
      try {
        // Try to make a simple request to check connectivity
        await this.supabase.auth.getSession();
        
        console.log('🌐 Network connection restored, refreshing auth state...');
        
        // Clear the monitor
        if (this.reconnectionInterval) {
          clearInterval(this.reconnectionInterval);
          this.reconnectionInterval = null;
        }
        
        // Refresh auth state from server
        await this.refreshAuthState();
        
      } catch (error) {
        // Still offline, continue monitoring
        console.log('📡 Still offline, continuing to monitor...');
      }
    }, 10000); // Check every 10 seconds
  }

  private reconnectionInterval: NodeJS.Timeout | null = null;

  /**
   * Refresh auth state from server after reconnection
   */
  private async refreshAuthState(): Promise<void> {
    try {
      const { data: { session } } = await this.supabase.auth.getSession();
      
      if (session?.user) {
        const enrichedUser = await this.enrichUserWithProfile(session.user);
        this.currentUser = enrichedUser;
        this.currentSession = { ...session, user: enrichedUser } as AuthSession;
        
        console.log('✅ Auth state refreshed from server');
      } else {
        // No valid session, clear current state
        this.currentUser = null;
        this.currentSession = null;
        
        console.log('⚠️  No valid session found after reconnection');
      }
      
      // Notify listeners of the updated state
      this.listeners.forEach(listener => {
        try {
          listener(this.currentUser);
        } catch (error) {
          console.warn('Error in auth listener during refresh:', error);
        }
      });
      
    } catch (error) {
      console.warn('Failed to refresh auth state after reconnection:', error);
    }
  }

  /**
   * Check if currently in offline mode
   */
  isOfflineMode(): boolean {
    return this.reconnectionInterval !== null;
  }

  /**
   * Clear offline state and stop monitoring (for testing)
   */
  clearOfflineState(): void {
    if (this.reconnectionInterval) {
      clearInterval(this.reconnectionInterval);
      this.reconnectionInterval = null;
    }
  }
}
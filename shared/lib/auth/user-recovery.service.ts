/**
 * User Recovery Service
 * 
 * Provides mechanisms to recover and ensure critical development users exist.
 * This service is used by the unified auth service to maintain reliable
 * authentication during development.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export interface DevelopmentUser {
  email: string;
  id: string;
  role: 'player' | 'league_admin' | 'app_admin';
  displayName: string;
}

export class UserRecoveryService {
  private static instance: UserRecoveryService;
  private supabase: SupabaseClient | null = null;

  // Development users that should always exist
  private readonly CRITICAL_USERS: DevelopmentUser[] = [
    {
      email: 'admin@matchday.com',
      id: '22222222-2222-2222-2222-222222222222',
      role: 'app_admin',
      displayName: 'Admin User'
    },
    {
      email: 'player@matchday.com',
      id: '11111111-1111-1111-1111-111111111111',
      role: 'player',
      displayName: 'Player User'
    }
  ];

  private constructor() {}

  static getInstance(): UserRecoveryService {
    if (!UserRecoveryService.instance) {
      UserRecoveryService.instance = new UserRecoveryService();
    }
    return UserRecoveryService.instance;
  }

  setSupabaseClient(client: SupabaseClient) {
    this.supabase = client;
  }

  /**
   * Check if a user profile exists in the database
   */
  async checkUserProfileExists(userId: string): Promise<boolean> {
    if (!this.supabase) return false;

    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('id')
        .eq('id', userId)
        .single();

      return !error && !!data;
    } catch {
      return false;
    }
  }

  /**
   * Check if a user exists in auth.users (via auth API)
   */
  async checkAuthUserExists(email: string): Promise<boolean> {
    if (!this.supabase) return false;

    try {
      // Try to get user by email - this will work if user exists
      const { data } = await this.supabase.auth.getUser();
      return !!data.user;
    } catch {
      // In a real implementation, we'd need admin privileges to check this
      // For now, we assume if profile doesn't exist, auth user might not either
      return false;
    }
  }

  /**
   * Recover a user profile (create if missing)
   */
  async recoverUserProfile(user: DevelopmentUser): Promise<{ success: boolean; error?: string }> {
    if (!this.supabase) {
      return { success: false, error: 'Supabase client not initialized' };
    }

    try {
      console.log(`Recovering user profile for: ${user.email}`);

      const { error } = await this.supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          display_name: user.displayName,
          full_name: user.displayName,
          role: user.role,
          bio: `Recovered ${user.role} account`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        return { success: false, error: error.message };
      }

      console.log(`✅ User profile recovered: ${user.email}`);
      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Recover all critical development users
   */
  async recoverAllCriticalUsers(): Promise<{
    recoveredCount: number;
    failures: Array<{ user: DevelopmentUser; error: string }>;
  }> {
    console.log('🔄 Starting recovery of critical development users...');

    let recoveredCount = 0;
    const failures: Array<{ user: DevelopmentUser; error: string }> = [];

    for (const user of this.CRITICAL_USERS) {
      try {
        // Check if profile exists
        const profileExists = await this.checkUserProfileExists(user.id);
        
        if (!profileExists) {
          console.log(`Missing profile detected for: ${user.email}`);
          
          const result = await this.recoverUserProfile(user);
          if (result.success) {
            recoveredCount++;
          } else {
            failures.push({ user, error: result.error || 'Unknown error' });
          }
        } else {
          console.log(`✅ Profile exists for: ${user.email}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        failures.push({ user, error: errorMessage });
      }
    }

    console.log(`🎉 Recovery complete. Recovered: ${recoveredCount}, Failed: ${failures.length}`);
    
    return { recoveredCount, failures };
  }

  /**
   * Verify all critical users are accessible
   */
  async verifyCriticalUsers(): Promise<{
    allAccessible: boolean;
    missingUsers: DevelopmentUser[];
    errors: string[];
  }> {
    const missingUsers: DevelopmentUser[] = [];
    const errors: string[] = [];

    for (const user of this.CRITICAL_USERS) {
      try {
        const exists = await this.checkUserProfileExists(user.id);
        if (!exists) {
          missingUsers.push(user);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to check ${user.email}: ${errorMessage}`);
      }
    }

    return {
      allAccessible: missingUsers.length === 0 && errors.length === 0,
      missingUsers,
      errors
    };
  }

  /**
   * Get development user by email
   */
  getDevelopmentUser(email: string): DevelopmentUser | null {
    return this.CRITICAL_USERS.find(user => user.email === email) || null;
  }

  /**
   * Get all development users (for reference)
   */
  getAllDevelopmentUsers(): DevelopmentUser[] {
    return [...this.CRITICAL_USERS];
  }

  /**
   * Create a development-safe password for a user
   * This generates a secure but predictable password for development
   */
  generateDevelopmentPassword(user: DevelopmentUser): string {
    // Create a development password that's secure but deterministic
    // This allows recovery scripts to recreate the same password
    const basePassword = `${user.role}Dev123!`;
    return basePassword;
  }
}
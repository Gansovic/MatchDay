/**
 * Mock Authentication Service for Development
 * 
 * Provides a simplified authentication system that works without Supabase GoTrue
 * for development purposes when GoTrue service is unavailable.
 * 
 * Generates proper JWT tokens that work with Supabase PostgREST.
 */

import jwt from 'jsonwebtoken';

export interface MockUser {
  id: string;
  email: string;
  full_name?: string;
  role?: string;
  user_metadata?: {
    full_name?: string;
    role?: string;
    preferred_position?: string;
  };
}

export interface MockSession {
  user: MockUser;
  access_token: string;
  token_type: 'bearer';
  expires_in: number;
  refresh_token: string;
}

// Mock users database (matching our real users)
const MOCK_USERS: { [email: string]: { password: string; user: MockUser } } = {
  'test@matchday.com': {
    password: 'test123456',
    user: {
      id: '9a2d37e5-bc7a-4efa-a9ac-00cb0700d9b0',
      email: 'test@matchday.com',
      full_name: 'Test User',
      role: 'player',
      user_metadata: {
        full_name: 'Test User',
        role: 'player'
      }
    }
  },
  'admin@matchday.com': {
    password: 'admin123!',
    user: {
      id: '550e8400-e29b-41d4-a716-446655440999',
      email: 'admin@matchday.com',
      full_name: 'Admin User',
      role: 'admin',
      user_metadata: {
        full_name: 'Admin User',
        role: 'admin'
      }
    }
  },
  'player@matchday.com': {
    password: 'player123!',
    user: {
      id: 'eec00b4f-7e94-4d76-8f2a-7364b49d1c86', // Real ID from database
      email: 'player@matchday.com',
      full_name: 'Player User',
      role: 'player',
      user_metadata: {
        full_name: 'Player User',
        role: 'player',
        preferred_position: 'midfielder'
      }
    }
  },
  'john.doe@example.com': {
    password: 'admin123!',
    user: {
      id: '550e8400-e29b-41d4-a716-446655440100',
      email: 'john.doe@example.com',
      full_name: 'John Doe',
      role: 'captain',
      user_metadata: {
        full_name: 'John Doe',
        role: 'captain',
        preferred_position: 'midfielder'
      }
    }
  },
  'jane.smith@example.com': {
    password: 'admin123!',
    user: {
      id: '550e8400-e29b-41d4-a716-446655440101',
      email: 'jane.smith@example.com',
      full_name: 'Jane Smith',
      role: 'player',
      user_metadata: {
        full_name: 'Jane Smith',
        role: 'player',
        preferred_position: 'forward'
      }
    }
  },
  'mike.wilson@example.com': {
    password: 'admin123!',
    user: {
      id: '550e8400-e29b-41d4-a716-446655440102',
      email: 'mike.wilson@example.com',
      full_name: 'Mike Wilson',
      role: 'player',
      user_metadata: {
        full_name: 'Mike Wilson',
        role: 'player',
        preferred_position: 'goalkeeper'
      }
    }
  }
};

class MockAuthService {
  private currentSession: MockSession | null = null;
  private listeners: ((event: string, session: MockSession | null) => void)[] = [];

  constructor() {
    // Check for existing session in localStorage
    this.loadSessionFromStorage();
  }

  async signInWithPassword(email: string, password: string): Promise<{
    data: { user: MockUser; session: MockSession } | null;
    error: { message: string } | null;
  }> {
    const userEntry = MOCK_USERS[email];
    
    if (!userEntry || userEntry.password !== password) {
      return {
        data: null,
        error: { message: 'Invalid email or password' }
      };
    }

    // Generate proper JWT token using Supabase JWT secret
    const jwtSecret = process.env.SUPABASE_JWT_SECRET || 'jUZj2O0d4B9nxxsU6p7xN3x81z9UGdY/lqbfIlUKb/Q=';
    
    const payload = {
      aud: 'authenticated',
      exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour
      sub: userEntry.user.id,
      email: userEntry.user.email,
      role: 'authenticated',
      user_metadata: userEntry.user.user_metadata || {}
    };
    
    const accessToken = jwt.sign(payload, jwtSecret, {
      algorithm: 'HS256'
    });
    
    console.log('🔧 Generated JWT token for:', userEntry.user.email);
    console.log('🔧 Token preview:', accessToken.substring(0, 50) + '...');

    const session: MockSession = {
      user: userEntry.user,
      access_token: accessToken,
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: `mock_refresh_${Date.now()}`
    };

    this.currentSession = session;
    this.saveSessionToStorage();
    
    // Notify listeners
    this.listeners.forEach(listener => listener('SIGNED_IN', session));

    return {
      data: { user: userEntry.user, session },
      error: null
    };
  }

  async signOut(): Promise<{ error: null }> {
    this.currentSession = null;
    this.clearSessionFromStorage();
    
    // Notify listeners
    this.listeners.forEach(listener => listener('SIGNED_OUT', null));

    return { error: null };
  }

  async getSession(): Promise<{
    data: { session: MockSession | null };
    error: null;
  }> {
    return {
      data: { session: this.currentSession },
      error: null
    };
  }

  async getUser(): Promise<{
    data: { user: MockUser | null };
    error: null;
  }> {
    return {
      data: { user: this.currentSession?.user || null },
      error: null
    };
  }

  onAuthStateChange(callback: (event: string, session: MockSession | null) => void) {
    this.listeners.push(callback);
    
    // Immediately call with current state
    setTimeout(() => {
      callback(this.currentSession ? 'SIGNED_IN' : 'SIGNED_OUT', this.currentSession);
    }, 100);

    return {
      data: {
        subscription: {
          unsubscribe: () => {
            const index = this.listeners.indexOf(callback);
            if (index > -1) {
              this.listeners.splice(index, 1);
            }
          }
        }
      }
    };
  }

  private saveSessionToStorage() {
    if (typeof window !== 'undefined' && this.currentSession) {
      localStorage.setItem('mock_auth_session', JSON.stringify(this.currentSession));
    }
  }

  private loadSessionFromStorage() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('mock_auth_session');
      if (stored) {
        try {
          this.currentSession = JSON.parse(stored);
        } catch (e) {
          // Invalid stored session
          this.clearSessionFromStorage();
        }
      }
    }
  }

  private clearSessionFromStorage() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mock_auth_session');
    }
  }
}

export const mockAuthService = new MockAuthService();
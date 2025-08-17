/**
 * Test Helper Functions and Extensions
 * 
 * Common utilities and Jest extensions for testing
 */

// This is a helper file, not a test file
describe('Test Helpers - Not a test file', () => {
  it('should be skipped', () => {
    expect(true).toBe(true);
  });
});

// Extend Jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeOneOf(expected: any[]): R;
      toBeValidUUID(): R;
      toBeValidEmail(): R;
      toBeValidPhoneNumber(): R;
      toBeValidHexColor(): R;
    }
  }
}

// Custom Jest matchers
expect.extend({
  toBeOneOf(received: any, expected: any[]) {
    const pass = expected.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${expected.join(', ')}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be one of ${expected.join(', ')}`,
        pass: false,
      };
    }
  },

  toBeValidUUID(received: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid UUID`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid UUID`,
        pass: false,
      };
    }
  },

  toBeValidEmail(received: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailRegex.test(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid email`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid email`,
        pass: false,
      };
    }
  },

  toBeValidPhoneNumber(received: string) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const cleanPhone = received.replace(/[\s\-\(\)]/g, '');
    const pass = phoneRegex.test(cleanPhone);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid phone number`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid phone number`,
        pass: false,
      };
    }
  },

  toBeValidHexColor(received: string) {
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    const pass = hexColorRegex.test(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid hex color`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid hex color`,
        pass: false,
      };
    }
  },
});

/**
 * Sleep utility for tests that need timing
 */
export const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retry utility for flaky operations
 */
export const retry = async <T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts) {
        await sleep(delay);
      }
    }
  }
  
  throw lastError!;
};

/**
 * Database connection check
 */
export const waitForDatabase = async (
  supabase: any,
  timeoutMs: number = 10000
): Promise<boolean> => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    try {
      const { error } = await supabase.from('user_profiles').select('id').limit(1);
      if (!error) {
        return true;
      }
    } catch (error) {
      // Database not ready yet
    }
    
    await sleep(100);
  }
  
  return false;
};

/**
 * Generate test data factories
 */
export const TestDataFactory = {
  user: (overrides: Partial<any> = {}) => ({
    email: `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`,
    password: 'testpass123',
    display_name: 'Test User',
    full_name: 'Test Full Name',
    ...overrides
  }),

  league: (overrides: Partial<any> = {}) => ({
    name: `Test League ${Date.now()}-${Math.random().toString(36).substring(7)}`,
    sport_type: 'football',
    league_type: 'competitive',
    location: 'Test City',
    is_active: true,
    is_public: true,
    ...overrides
  }),

  team: (overrides: Partial<any> = {}) => ({
    name: `Test Team ${Date.now()}-${Math.random().toString(36).substring(7)}`,
    team_color: '#2563eb',
    max_players: 22,
    min_players: 7,
    team_bio: 'Test team bio',
    ...overrides
  }),

  profile: (overrides: Partial<any> = {}) => ({
    full_name: 'Test Full Name',
    display_name: 'Test Display Name',
    bio: 'Test bio',
    phone: '+1234567890',
    location: 'Test City',
    preferred_position: 'midfielder',
    ...overrides
  })
};

/**
 * Mock API request factory
 */
export const createMockRequest = (
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
    authToken?: string;
  } = {}
) => {
  const {
    method = 'GET',
    headers = {},
    body,
    authToken
  } = options;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers
  };

  if (authToken) {
    requestHeaders['Authorization'] = `Bearer ${authToken}`;
  }

  return new Request(url, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined
  });
};

/**
 * Assert response structure helper
 */
export const assertSuccessResponse = (response: any, expectedData?: any) => {
  expect(response).toHaveProperty('data');
  expect(response).toHaveProperty('message');
  expect(response.message).toBeTruthy();
  
  if (expectedData) {
    expect(response.data).toMatchObject(expectedData);
  }
};

export const assertErrorResponse = (
  response: any, 
  expectedError?: string, 
  expectedStatus?: number
) => {
  expect(response).toHaveProperty('error');
  expect(response).toHaveProperty('message');
  expect(response.error).toBeTruthy();
  expect(response.message).toBeTruthy();
  
  if (expectedError) {
    expect(response.error).toBe(expectedError);
  }
};

/**
 * Database cleanup helper
 */
export const ensureCleanDatabase = async (supabase: any, entities: {
  userIds?: string[];
  teamIds?: string[];
  leagueIds?: string[];
}) => {
  const { userIds = [], teamIds = [], leagueIds = [] } = entities;

  // Clean up in order to respect foreign key constraints
  if (teamIds.length > 0) {
    // Delete team members first
    await supabase
      .from('team_members')
      .delete()
      .in('team_id', teamIds);
    
    // Delete teams
    await supabase
      .from('teams')
      .delete()
      .in('id', teamIds);
  }

  if (leagueIds.length > 0) {
    await supabase
      .from('leagues')
      .delete()
      .in('id', leagueIds);
  }

  if (userIds.length > 0) {
    // Delete user profiles
    await supabase
      .from('user_profiles')
      .delete()
      .in('id', userIds);
    
    // Try to delete auth users (may fail in test environment)
    for (const userId of userIds) {
      try {
        await supabase.auth.admin.deleteUser(userId);
      } catch (error) {
        // Ignore auth deletion failures in tests
      }
    }
  }
};

/**
 * Performance measurement helper
 */
export const measurePerformance = async <T>(
  operation: () => Promise<T>,
  label: string = 'Operation'
): Promise<{ result: T; duration: number }> => {
  const startTime = Date.now();
  const result = await operation();
  const duration = Date.now() - startTime;
  
  console.log(`${label} took ${duration}ms`);
  
  return { result, duration };
};

/**
 * Validation helpers
 */
export const ValidationHelpers = {
  isValidDate: (dateString: string): boolean => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  },

  isValidAge: (birthDate: string, minAge: number = 13, maxAge: number = 100): boolean => {
    const birth = new Date(birthDate);
    const now = new Date();
    const age = now.getFullYear() - birth.getFullYear();
    
    return age >= minAge && age <= maxAge;
  },

  isValidTeamName: (name: string): boolean => {
    return typeof name === 'string' && 
           name.trim().length >= 2 && 
           name.trim().length <= 50;
  },

  isValidColorHex: (color: string): boolean => {
    return /^#[0-9A-Fa-f]{6}$/.test(color);
  }
};
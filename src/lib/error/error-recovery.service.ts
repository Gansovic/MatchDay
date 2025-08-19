/**
 * Error Recovery Service
 * 
 * Centralized service for automatic error recovery with retry logic,
 * circuit breaker pattern, and intelligent error handling.
 */

interface ErrorLog {
  timestamp: Date;
  error: Error;
  context?: any;
  recovered: boolean;
  recoveryAttempts: number;
}

interface RecoveryStrategy {
  canHandle: (error: Error) => boolean;
  recover: (error: Error) => Promise<boolean>;
  priority: number;
}

export class ErrorRecoveryService {
  private static instance: ErrorRecoveryService;
  private errorLogs: ErrorLog[] = [];
  private recoveryStrategies: RecoveryStrategy[] = [];
  private circuitBreakerState: Map<string, {
    failures: number;
    lastFailure: Date;
    isOpen: boolean;
  }> = new Map();
  
  private readonly MAX_ERROR_LOGS = 100;
  private readonly CIRCUIT_BREAKER_THRESHOLD = 5;
  private readonly CIRCUIT_BREAKER_RESET_TIME = 60000; // 1 minute

  private constructor() {
    this.initializeRecoveryStrategies();
    this.startCircuitBreakerMonitor();
  }

  static getInstance(): ErrorRecoveryService {
    if (!ErrorRecoveryService.instance) {
      ErrorRecoveryService.instance = new ErrorRecoveryService();
    }
    return ErrorRecoveryService.instance;
  }

  private initializeRecoveryStrategies() {
    // Network error recovery
    this.addRecoveryStrategy({
      canHandle: (error) => this.isNetworkError(error),
      recover: async (error) => {
        console.log('Attempting network error recovery...');
        
        // Wait and retry
        await this.delay(1000);
        
        // Check if network is back
        try {
          const response = await fetch('/api/health', { 
            method: 'HEAD',
            cache: 'no-cache' 
          }).catch(() => null);
          
          if (response?.ok) {
            console.log('Network recovered');
            return true;
          }
        } catch {
          // Network still down
        }
        
        return false;
      },
      priority: 1
    });

    // Auth error recovery
    this.addRecoveryStrategy({
      canHandle: (error) => this.isAuthError(error),
      recover: async (error) => {
        console.log('Attempting auth error recovery...');
        
        // Try to refresh session
        if (typeof window !== 'undefined' && window.localStorage) {
          const refreshToken = localStorage.getItem('refresh_token');
          if (refreshToken) {
            try {
              // Attempt to refresh auth token
              const response = await fetch('/api/auth/refresh', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken })
              });
              
              if (response.ok) {
                console.log('Auth session refreshed');
                return true;
              }
            } catch {
              // Refresh failed
            }
          }
        }
        
        return false;
      },
      priority: 2
    });

    // Database error recovery
    this.addRecoveryStrategy({
      canHandle: (error) => this.isDatabaseError(error),
      recover: async (error) => {
        console.log('Attempting database error recovery...');
        
        // Wait for potential database recovery
        await this.delay(2000);
        
        // Could trigger a reconnection attempt here
        return false;
      },
      priority: 3
    });

    // Generic recovery for unknown errors
    this.addRecoveryStrategy({
      canHandle: () => true,
      recover: async (error) => {
        console.log('Attempting generic error recovery...');
        
        // Clear any problematic cache
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.clear();
            // Keep auth tokens
            const authKeys = ['supabase.auth.token', 'refresh_token'];
            const preserved: Record<string, string> = {};
            authKeys.forEach(key => {
              const value = localStorage.getItem(key);
              if (value) preserved[key] = value;
            });
            
            localStorage.clear();
            
            // Restore auth tokens
            Object.entries(preserved).forEach(([key, value]) => {
              localStorage.setItem(key, value);
            });
            
            return true;
          } catch {
            // Cache clear failed
          }
        }
        
        return false;
      },
      priority: 999
    });
  }

  private startCircuitBreakerMonitor() {
    // Reset circuit breakers periodically
    setInterval(() => {
      const now = Date.now();
      this.circuitBreakerState.forEach((state, key) => {
        if (state.isOpen && 
            now - state.lastFailure.getTime() > this.CIRCUIT_BREAKER_RESET_TIME) {
          state.isOpen = false;
          state.failures = 0;
          console.log(`Circuit breaker reset for: ${key}`);
        }
      });
    }, 10000); // Check every 10 seconds
  }

  addRecoveryStrategy(strategy: RecoveryStrategy) {
    this.recoveryStrategies.push(strategy);
    this.recoveryStrategies.sort((a, b) => a.priority - b.priority);
  }

  async attemptRecovery(error: Error): Promise<boolean> {
    const errorKey = this.getErrorKey(error);
    
    // Check circuit breaker
    if (this.isCircuitOpen(errorKey)) {
      console.log(`Circuit breaker open for: ${errorKey}`);
      return false;
    }

    // Find applicable recovery strategies
    const strategies = this.recoveryStrategies.filter(s => s.canHandle(error));
    
    for (const strategy of strategies) {
      try {
        const recovered = await this.retryWithBackoff(
          () => strategy.recover(error),
          3, // max attempts
          1000 // initial delay
        );
        
        if (recovered) {
          this.recordRecovery(errorKey);
          return true;
        }
      } catch (recoveryError) {
        console.error('Recovery strategy failed:', recoveryError);
      }
    }
    
    // Record failure
    this.recordFailure(errorKey);
    return false;
  }

  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxAttempts: number,
    initialDelay: number
  ): Promise<T> {
    let lastError: Error | undefined;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxAttempts - 1) {
          const delay = initialDelay * Math.pow(2, attempt) * (1 + Math.random() * 0.1);
          await this.delay(delay);
        }
      }
    }
    
    throw lastError || new Error('Retry failed');
  }

  private isCircuitOpen(errorKey: string): boolean {
    const state = this.circuitBreakerState.get(errorKey);
    return state?.isOpen || false;
  }

  private recordFailure(errorKey: string) {
    const state = this.circuitBreakerState.get(errorKey) || {
      failures: 0,
      lastFailure: new Date(),
      isOpen: false
    };
    
    state.failures++;
    state.lastFailure = new Date();
    
    if (state.failures >= this.CIRCUIT_BREAKER_THRESHOLD) {
      state.isOpen = true;
      console.log(`Circuit breaker opened for: ${errorKey}`);
    }
    
    this.circuitBreakerState.set(errorKey, state);
  }

  private recordRecovery(errorKey: string) {
    const state = this.circuitBreakerState.get(errorKey);
    if (state) {
      state.failures = Math.max(0, state.failures - 1);
      this.circuitBreakerState.set(errorKey, state);
    }
  }

  logError(error: Error, context?: any) {
    const log: ErrorLog = {
      timestamp: new Date(),
      error,
      context,
      recovered: false,
      recoveryAttempts: 0
    };
    
    this.errorLogs.unshift(log);
    
    // Keep only recent logs
    if (this.errorLogs.length > this.MAX_ERROR_LOGS) {
      this.errorLogs = this.errorLogs.slice(0, this.MAX_ERROR_LOGS);
    }
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', error, context);
    }
  }

  getErrorLogs(): ErrorLog[] {
    return [...this.errorLogs];
  }

  getCircuitBreakerStatus(): Map<string, any> {
    return new Map(this.circuitBreakerState);
  }

  clearErrorLogs() {
    this.errorLogs = [];
  }

  // Helper methods
  private isNetworkError(error: Error): boolean {
    return error.message.toLowerCase().includes('network') ||
           error.message.toLowerCase().includes('fetch') ||
           error.message.toLowerCase().includes('failed to fetch') ||
           error.name === 'NetworkError';
  }

  private isAuthError(error: Error): boolean {
    return error.message.toLowerCase().includes('auth') ||
           error.message.toLowerCase().includes('unauthorized') ||
           error.message.toLowerCase().includes('401') ||
           error.message.toLowerCase().includes('403');
  }

  private isDatabaseError(error: Error): boolean {
    return error.message.toLowerCase().includes('database') ||
           error.message.toLowerCase().includes('postgres') ||
           error.message.toLowerCase().includes('supabase') ||
           error.message.toLowerCase().includes('sql');
  }

  private getErrorKey(error: Error): string {
    // Create a unique key for similar errors
    const type = error.name || 'Error';
    const message = error.message.split('\n')[0].substring(0, 50);
    return `${type}:${message}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public utility for manual retry with backoff
  async retryOperation<T>(
    operation: () => Promise<T>,
    options: {
      maxAttempts?: number;
      initialDelay?: number;
      maxDelay?: number;
      backoffFactor?: number;
      onRetry?: (attempt: number, error: Error) => void;
    } = {}
  ): Promise<T> {
    const {
      maxAttempts = 3,
      initialDelay = 1000,
      maxDelay = 30000,
      backoffFactor = 2,
      onRetry
    } = options;

    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxAttempts - 1) {
          onRetry?.(attempt + 1, lastError);
          
          const delay = Math.min(
            initialDelay * Math.pow(backoffFactor, attempt),
            maxDelay
          );
          
          await this.delay(delay);
        }
      }
    }

    throw lastError || new Error('Operation failed after retries');
  }
}